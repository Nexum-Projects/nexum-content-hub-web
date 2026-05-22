import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, ImagePlus, MapPin, Navigation, Pencil } from "lucide-react";

import { getLocationDetail } from "@/app/actions/content/get-resource-detail";
import { publishBadge } from "@/components/resource-lists/entity-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTimeGuatemala } from "@/lib/datetime-guatemala";
import { sanitizeHtmlForDisplay } from "@/utils/helpers/sanitize-html-display";

function googleMapsHref(latitude: number, longitude: number) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; locationId: string }>;
}) {
  const { projectId, locationId } = await params;
  const res = await getLocationDetail(projectId, locationId);
  if (res.status === "error") {
    notFound();
  }

  const location = res.data;
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  const mapHref = googleMapsHref(latitude, longitude);
  const descriptionHtml = sanitizeHtmlForDisplay(location.description);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild className="rounded-lg" variant="outline">
            <Link href={`/dashboard/projects/${projectId}/locations`}>
              <ArrowLeft className="h-4 w-4" />
              Volver a ubicaciones
            </Link>
          </Button>
          <Button asChild className="rounded-lg">
            <Link href={`/dashboard/projects/${projectId}/locations?edit=${locationId}`}>
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Link className="font-medium text-primary hover:underline" href={`/dashboard/projects/${projectId}/locations`}>
              Ubicaciones
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">Detalle</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-7">{location.title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Direccion completa, coordenadas, imagen y visibilidad de la ubicacion.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.9fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informacion principal</CardTitle>
              <CardDescription>Datos visibles de la ubicacion dentro del proyecto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Titulo</p>
                <p className="mt-1 font-semibold">{location.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Descripcion</p>
                {descriptionHtml ? (
                  <div
                    className="mt-2 text-sm leading-6 text-muted-foreground [&_a]:text-primary [&_a]:underline [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                  />
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Sin descripcion.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Direccion y coordenadas</CardTitle>
              <CardDescription>Informacion guardada desde el selector de mapa.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Direccion completa</p>
                <p className="mt-1 text-sm">{location.fullAddress}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Latitud</p>
                <p className="mt-1 tabular-nums text-sm">{latitude.toFixed(7)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Longitud</p>
                <p className="mt-1 tabular-nums text-sm">{longitude.toFixed(7)}</p>
              </div>
              <div className="md:col-span-2">
                <Button asChild className="rounded-lg" variant="outline">
                  <a href={mapHref} rel="noopener noreferrer" target="_blank">
                    <ExternalLink className="h-4 w-4" />
                    Abrir en Google Maps
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Imagen</CardTitle>
              <CardDescription>Imagen opcional asociada a la ubicacion.</CardDescription>
            </CardHeader>
            <CardContent>
              {location.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="aspect-video max-h-96 w-full rounded-xl border border-border object-cover"
                  src={location.imageUrl}
                />
              ) : (
                <div className="grid min-h-56 place-items-center rounded-xl border border-dashed bg-muted/40 text-center text-muted-foreground">
                  <div>
                    <ImagePlus className="mx-auto h-10 w-10" />
                    <p className="mt-2 text-sm">Sin imagen asignada.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publicacion</CardTitle>
              <CardDescription>Estado, orden y auditoria basica.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Publicado</p>
                <div className="mt-2">{publishBadge(location.isPublished)}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Orden</p>
                <p className="mt-1 tabular-nums text-sm">{location.sortOrder ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha de creacion</p>
                <p className="mt-1 tabular-nums text-sm">{formatDateTimeGuatemala(location.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ultima actualizacion</p>
                <p className="mt-1 tabular-nums text-sm">{formatDateTimeGuatemala(location.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card className="overflow-hidden">
            <div className="relative aspect-video bg-muted">
              {location.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" className="h-full w-full object-cover" src={location.imageUrl} />
              ) : (
                <div className="grid h-full place-items-center bg-[linear-gradient(135deg,#0f172a,#2563eb)] text-white/80">
                  <MapPin className="h-12 w-12" />
                </div>
              )}
            </div>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={location.isPublished ? "success" : "warning"}>{location.isPublished ? "Publicado" : "Borrador"}</Badge>
                <Badge variant="secondary">
                  <MapPin className="h-3 w-3" />
                  Ubicacion
                </Badge>
              </div>
              <div>
                <h2 className="text-xl font-semibold">{location.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{location.fullAddress}</p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
                <p className="flex items-center gap-2 font-medium text-foreground">
                  <Navigation className="h-4 w-4 text-primary" />
                  Coordenadas
                </p>
                <p className="mt-1 tabular-nums">{latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
