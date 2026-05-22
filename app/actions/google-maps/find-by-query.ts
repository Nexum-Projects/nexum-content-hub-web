"use server";

import axios, { isAxiosError } from "axios";

import type { ActionResponse } from "@/app/actions/types";
import { env } from "@/utils/env";
import type { GoogleMapsGeocodingResponse, GoogleMapsQueryResult } from "./types";

type PlacesSearchResponse = {
  places?: {
    formattedAddress?: string;
    location?: {
      latitude?: number;
      longitude?: number;
    };
    displayName?: {
      text?: string;
      languageCode?: string;
    };
  }[];
};

async function findByGeocode(query: string): Promise<GoogleMapsQueryResult> {
  const response = await axios.get<GoogleMapsGeocodingResponse>(env.GOOGLE_MAPS_API_URL!, {
    params: {
      address: query,
      language: "es",
      key: env.GOOGLE_MAPS_KEY,
    },
  });

  return {
    status: response.data.status,
    places: (response.data.results ?? []).map((result) => ({
      formattedAddress: result.formatted_address,
      location: {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
      },
      displayName: {
        text: result.formatted_address.split(",")[0] ?? result.formatted_address,
        languageCode: "es",
      },
    })),
  };
}

function normalizePlaces(places: PlacesSearchResponse["places"]): GoogleMapsQueryResult["places"] {
  return (places ?? [])
    .filter((place) => place.formattedAddress && place.location?.latitude != null && place.location?.longitude != null)
    .map((place) => ({
      formattedAddress: place.formattedAddress!,
      location: {
        latitude: place.location!.latitude!,
        longitude: place.location!.longitude!,
      },
      displayName: {
        text: place.displayName?.text ?? place.formattedAddress!,
        languageCode: place.displayName?.languageCode ?? "es",
      },
    }));
}

async function findByPlaces(query: string): Promise<GoogleMapsQueryResult | null> {
  if (!env.GOOGLE_MAPS_SEARCH_API_URL) {
    return null;
  }

  const response = await axios.post<PlacesSearchResponse>(
    `${env.GOOGLE_MAPS_SEARCH_API_URL}?key=${env.GOOGLE_MAPS_KEY}`,
    {
      textQuery: query,
      languageCode: "es",
      maxResultCount: 5,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location",
      },
    },
  );

  const places = normalizePlaces(response.data.places);
  if (places.length === 0) {
    return null;
  }

  return {
    status: "OK",
    places,
  };
}

export async function findLocationByQuery(query: string): ActionResponse<GoogleMapsQueryResult> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return {
      status: "error",
      errors: [{ title: "Busqueda requerida", message: "Ingresa una direccion para buscar." }],
    };
  }
  if (!env.GOOGLE_MAPS_KEY || !env.GOOGLE_MAPS_API_URL) {
    return {
      status: "error",
      errors: [
        {
          title: "Google Maps no configurado",
          message: "Faltan GOOGLE_MAPS_KEY o GOOGLE_MAPS_API_URL.",
        },
      ],
    };
  }

  try {
    try {
      const placesResult = await findByPlaces(normalizedQuery);
      if (placesResult) {
        return {
          status: "success",
          data: placesResult,
        };
      }
    } catch {
      // Places is optional here; Geocoding keeps the picker usable without place search enabled.
    }

    return {
      status: "success",
      data: await findByGeocode(normalizedQuery),
    };
  } catch (error) {
    const message =
      isAxiosError(error) && error.response?.data?.error_message
        ? error.response.data.error_message
        : "No se pudo buscar la ubicacion.";

    return {
      status: "error",
      errors: [{ title: "Error de Google Maps", message }],
    };
  }
}
