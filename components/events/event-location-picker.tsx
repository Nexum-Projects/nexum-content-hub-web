"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Crosshair, Loader2, LocateFixed, MapPin, Search, X } from "lucide-react";
import { toast } from "sonner";

import {
  findLocationByQuery,
  findReverseGeolocation,
  getGoogleMapsKey,
  type GoogleMapsLocationResult,
} from "@/app/actions/google-maps";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type GoogleLatLng = {
  lat: number;
  lng: number;
};

type GoogleMapsApi = {
  maps: {
    Map: new (
      element: HTMLElement,
      options: {
        center: GoogleLatLng;
        disableDefaultUI?: boolean;
        fullscreenControl?: boolean;
        gestureHandling?: string;
        mapTypeControl?: boolean;
        streetViewControl?: boolean;
        zoom: number;
        zoomControl?: boolean;
      },
    ) => {
      addListener: (eventName: string, callback: () => void) => void;
      getCenter: () => { lat: () => number; lng: () => number } | undefined;
      setCenter: (center: GoogleLatLng) => void;
      setZoom: (zoom: number) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleMapsApi;
    gm_authFailure?: () => void;
  }
}

export type EventLocationValue = {
  latitude: number;
  longitude: number;
  fullAddress: string;
};

type Props = {
  disabled?: boolean;
  onChange: (value: EventLocationValue | null) => void;
  value?: EventLocationValue | null;
};

const DEFAULT_CENTER = {
  lat: 14.634915,
  lng: -90.506882,
};

let googleMapsScriptPromise: Promise<void> | null = null;

function toMapCenter(value?: EventLocationValue | null): GoogleLatLng {
  if (!value) {
    return DEFAULT_CENTER;
  }

  return {
    lat: value.latitude,
    lng: value.longitude,
  };
}

function formatPlaceAddress(place: GoogleMapsLocationResult) {
  const name = place.displayName.text.trim();
  const address = place.formattedAddress.trim();

  if (!name || address.toLowerCase().includes(name.toLowerCase())) {
    return address;
  }

  return `${name}, ${address}`;
}

function toEventLocation(place: GoogleMapsLocationResult): EventLocationValue {
  return {
    latitude: place.location.latitude,
    longitude: place.location.longitude,
    fullAddress: formatPlaceAddress(place),
  };
}

function toPlaceResult(location: EventLocationValue): GoogleMapsLocationResult {
  return {
    formattedAddress: location.fullAddress,
    location: {
      latitude: location.latitude,
      longitude: location.longitude,
    },
    displayName: {
      text: location.fullAddress.split(",")[0] ?? location.fullAddress,
      languageCode: "es",
    },
  };
}

function firstAddress(results: { formatted_address: string; geometry: { location: { lat: number; lng: number } } }[]) {
  const result = results[0];
  if (!result) {
    return null;
  }

  return {
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
    fullAddress: result.formatted_address,
  };
}

function loadGoogleMaps(apiKey: string) {
  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (googleMapsScriptPromise) {
    return googleMapsScriptPromise;
  }

  googleMapsScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-google-maps-script='true']");
    if (existing) {
      if (window.google?.maps) {
        resolve();
        return;
      }

      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google Maps script failed")));
      return;
    }

    const timeout = window.setTimeout(() => {
      reject(new Error("Google Maps script timeout"));
    }, 12000);

    window.gm_authFailure = () => {
      window.clearTimeout(timeout);
      reject(new Error("Google Maps authentication failed"));
    };

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsScript = "true";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&language=es`;
    script.onload = () => {
      window.clearTimeout(timeout);
      resolve();
    };
    script.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("Google Maps script failed"));
    };
    document.head.appendChild(script);
  });

  return googleMapsScriptPromise;
}

export function EventLocationPicker({ disabled, onChange, value }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value?.fullAddress ?? "");
  const [apiKey, setApiKey] = useState("");
  const [center, setCenter] = useState<GoogleLatLng>(toMapCenter(value));
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [results, setResults] = useState<GoogleMapsLocationResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<EventLocationValue | null>(value ?? null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<InstanceType<GoogleMapsApi["maps"]["Map"]> | null>(null);
  const searchRequestRef = useRef(0);

  useEffect(() => {
    void getGoogleMapsKey().then((key) => {
      setApiKey(key);
      if (!key) {
        setMapError("Falta configurar GOOGLE_MAPS_KEY para poder cargar el mapa.");
      }
    });
  }, []);

  useEffect(() => {
    if (!open || !apiKey || !mapContainerRef.current) {
      return;
    }

    let cancelled = false;
    setIsMapLoading(true);
    setMapError(null);
    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !window.google?.maps || !mapContainerRef.current) {
          return;
        }

        if (!mapRef.current) {
          mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
            center,
            disableDefaultUI: true,
            fullscreenControl: true,
            gestureHandling: "greedy",
            mapTypeControl: false,
            streetViewControl: false,
            zoom: value ? 17 : 14,
            zoomControl: true,
          });
          mapRef.current.addListener("dragend", () => {
            const nextCenter = mapRef.current?.getCenter();
            if (nextCenter) {
              setCenter({ lat: nextCenter.lat(), lng: nextCenter.lng() });
              setSelectedLocation(null);
            }
          });
        } else {
          mapRef.current.setCenter(center);
        }
      })
      .catch(() => {
        setMapError(
          "No se pudo cargar el mapa. Revisa que Maps JavaScript API este habilitada y que la key permita http://localhost:3000/*.",
        );
        toast.error("No se pudo cargar Google Maps.");
      })
      .finally(() => {
        if (!cancelled) {
          setIsMapLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, center, open, value]);

  useEffect(() => {
    if (open) {
      const nextCenter = toMapCenter(value);
      setCenter(nextCenter);
      setQuery(value?.fullAddress ?? "");
      setResults([]);
      setFeedback(null);
      setMapError(null);
      setSelectedLocation(value ?? null);
      mapRef.current?.setCenter(nextCenter);
      mapRef.current?.setZoom(value ? 17 : 14);
      return;
    }

    mapRef.current = null;
  }, [open, value]);

  const moveMap = useCallback((nextCenter: GoogleLatLng, zoom = 17) => {
    setCenter(nextCenter);
    mapRef.current?.setCenter(nextCenter);
    mapRef.current?.setZoom(zoom);
  }, []);

  const search = useCallback(
    async (nextQuery = query, options: { focusFirst?: boolean; showToast?: boolean } = {}) => {
      const normalizedQuery = nextQuery.trim();
      if (normalizedQuery.length < 3) {
        setResults([]);
        setFeedback(null);
        return;
      }

      const requestId = searchRequestRef.current + 1;
      searchRequestRef.current = requestId;
      setIsSearching(true);
      setFeedback(null);
      const response = await findLocationByQuery(normalizedQuery).catch(() => null);

      if (requestId !== searchRequestRef.current) {
        return;
      }

      setIsSearching(false);

      if (!response) {
        const message = "No se pudo buscar la ubicacion. Revisa la configuracion de Google Maps e intenta de nuevo.";
        setFeedback(message);
        if (options.showToast) {
          toast.error("No se pudo buscar", { description: message });
        }
        return;
      }

      if (response.status === "error") {
        const message = response.errors[0]?.message ?? "No se pudo buscar la ubicacion.";
        setFeedback(message);
        if (options.showToast) {
          toast.error(response.errors[0]?.title ?? "No se pudo buscar", {
            description: message,
          });
        }
        return;
      }

      setResults(response.data.places);
      const firstPlace = response.data.places[0];
      if (firstPlace) {
        if (options.focusFirst) {
          moveMap({
            lat: firstPlace.location.latitude,
            lng: firstPlace.location.longitude,
          });
        }
        return;
      }

      setFeedback("No encontramos resultados para esa direccion. Intenta con otro texto o ajusta el mapa manualmente.");
      if (options.showToast) {
        toast.info("No encontramos resultados para esa direccion.");
      }
    },
    [moveMap, query],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 3) {
      setResults([]);
      setFeedback(null);
      return;
    }

    const timeout = window.setTimeout(() => {
      void search(normalizedQuery);
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [open, query, search]);

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no permite geolocalizacion.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextCenter = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        moveMap(nextCenter);
        setIsSearching(true);
        setFeedback(null);

        const response = await findReverseGeolocation(nextCenter);
        setIsSearching(false);

        if (response.status === "error") {
          const message = response.errors[0]?.message ?? "No se pudo resolver tu ubicacion actual.";
          setFeedback(message);
          toast.error(response.errors[0]?.title ?? "No se pudo resolver la ubicacion", {
            description: message,
          });
          return;
        }

        const location = firstAddress(response.data.results ?? []);
        if (!location) {
          setFeedback("Movimos el mapa a tu ubicacion, pero Google no devolvio una direccion para ese punto.");
          return;
        }

        setQuery(location.fullAddress);
        setResults([toPlaceResult(location)]);
        setSelectedLocation(location);
      },
      () => toast.error("No se pudo obtener tu ubicacion."),
    );
  }

  function select(place: GoogleMapsLocationResult) {
    const location = toEventLocation(place);
    setQuery(location.fullAddress);
    setFeedback(null);
    setResults([]);
    setSelectedLocation(location);
    moveMap({ lat: location.latitude, lng: location.longitude });
  }

  async function confirmLocation() {
    if (selectedLocation) {
      onChange(selectedLocation);
      setQuery(selectedLocation.fullAddress);
      setOpen(false);
      return;
    }

    setIsSearching(true);
    const response = await findReverseGeolocation(center);
    setIsSearching(false);

    if (response.status === "error") {
      toast.error(response.errors[0]?.title ?? "No se pudo resolver la ubicacion", {
        description: response.errors[0]?.message,
      });
      setFeedback(response.errors[0]?.message ?? "No se pudo resolver la ubicacion seleccionada.");
      return;
    }

    const location = firstAddress(response.data.results ?? []);
    if (!location) {
      toast.error("No se encontro una direccion para esa ubicacion.");
      setFeedback("No se encontro una direccion para esa ubicacion. Mueve un poco el mapa e intenta de nuevo.");
      return;
    }

    onChange(location);
    setQuery(location.fullAddress);
    setOpen(false);
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-muted/30 p-3">
        {value ? (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4 text-primary" />
                Ubicacion seleccionada
              </p>
              <p className="text-sm text-muted-foreground">{value.fullAddress}</p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
              </p>
            </div>
            <Button disabled={disabled} onClick={() => onChange(null)} size="icon" type="button" variant="ghost">
              <X className="h-4 w-4" />
              <span className="sr-only">Quitar ubicacion</span>
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Selecciona una direccion desde Google Maps.</p>
        )}
      </div>

      <Button disabled={disabled} onClick={() => setOpen(true)} type="button" variant="outline">
        <MapPin className="h-4 w-4" />
        {value ? "Cambiar ubicacion" : "Buscar ubicacion"}
      </Button>

      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent className="overflow-hidden p-0 sm:max-w-3xl">
          <DialogHeader className="bg-background px-6 pb-4 pt-6">
            <DialogTitle>Selecciona tu ubicacion</DialogTitle>
            <DialogDescription>
              Busca una direccion, ajusta el mapa y confirma el punto central.
            </DialogDescription>
          </DialogHeader>

          <div className="relative min-h-[420px] overflow-hidden bg-muted" style={{ height: "min(70vh, 560px)" }}>
            <div className="absolute inset-0" ref={mapContainerRef} />
            {(isMapLoading || !apiKey) && (
              <div className="absolute inset-0 grid place-items-center bg-background/70">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            )}

            <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full">
              <MapPin className="h-12 w-12 fill-primary text-primary drop-shadow-lg" />
            </div>
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-3 w-6 -translate-x-1/2 rounded-full bg-black/25 blur-[1px]" />

            <div className="absolute left-4 right-4 top-4 z-20 space-y-2">
              <div className="flex gap-2 rounded-2xl bg-background/95 p-2 shadow-lg backdrop-blur">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-11 pl-9"
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setSelectedLocation(null);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void search(query, { focusFirst: true, showToast: true });
                      }
                    }}
                    placeholder="Ej. Zona 10, Guatemala City"
                    value={query}
                  />
                </div>
                <Button
                  disabled={isSearching}
                  onClick={() => void search(query, { focusFirst: true, showToast: true })}
                  type="button"
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Buscar
                </Button>
              </div>

              {(feedback || mapError) && (
                <div className="rounded-2xl border bg-background/95 px-4 py-3 text-sm text-muted-foreground shadow-lg backdrop-blur">
                  {feedback ?? mapError}
                </div>
              )}

              {results.length > 0 && (
                <div className="max-h-44 max-w-2xl overflow-y-auto rounded-xl border bg-background/95 p-1.5 shadow-xl backdrop-blur">
                  {results.map((place) => (
                    <button
                      className="flex w-full gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent"
                      key={`${place.formattedAddress}-${place.location.latitude}-${place.location.longitude}`}
                      onClick={() => select(place)}
                      type="button"
                    >
                      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted">
                        <Search className="h-4 w-4 text-muted-foreground" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{place.displayName.text}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{place.formattedAddress}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 shadow-lg"
              disabled={isSearching}
              onClick={confirmLocation}
              type="button"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              Confirmar ubicacion
            </Button>

            <Button
              className="absolute bottom-6 right-6 z-20 rounded-full shadow-lg"
              disabled={isSearching}
              onClick={useCurrentLocation}
              size="icon"
              type="button"
              variant="secondary"
            >
              <LocateFixed className="h-4 w-4" />
              <span className="sr-only">Usar mi ubicacion actual</span>
            </Button>

            <div className="absolute bottom-6 left-6 z-20 rounded-full bg-background/90 px-3 py-2 text-xs tabular-nums text-muted-foreground shadow backdrop-blur">
              <Crosshair className="mr-1 inline h-3.5 w-3.5" />
              {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
            </div>
          </div>

          <DialogFooter className="bg-background px-6 py-4">
            <Button onClick={() => setOpen(false)} type="button" variant="outline">
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
