import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, ImagePlus, MapPin, Pencil, Star } from "lucide-react";

import { formatPrice } from "@/app/dashboard/projects/project-components";
import { getEventDetail } from "@/app/actions/content/get-resource-detail";
import { eventStatusBadge, featuredBadge } from "@/components/resource-lists/entity-badges";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTimeGuatemala } from "@/lib/datetime-guatemala";
import { humanizeEventStatus } from "@/utils/helpers/humanize-enum";
import { sanitizeHtmlForDisplay } from "@/utils/helpers/sanitize-html-display";

export default async function EventDetailPage({ params }: { params: Promise<{ projectId: string; eventId: string }> }) {
  const { projectId, eventId } = await params;
  const res = await getEventDetail(projectId, eventId);
  if (res.status === "error") {
    notFound();
  }
  const e = res.data;
  const previewHtml =
    sanitizeHtmlForDisplay(e.description) || "<p>Descripcion breve del evento.</p>";
  const statusLabel = humanizeEventStatus(e.status ?? "ACTIVE");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Link className="font-medium text-primary hover:underline" href={`/dashboard/projects/${projectId}/events`}>
              Eventos
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">Detalle</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-7">{e.title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Fechas, ubicacion, imagen y publicacion, organizados como en el formulario de creacion.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="rounded-lg" variant="outline">
            <Link href={`/dashboard/projects/${projectId}/events`}>
              <ArrowLeft className="h-4 w-4" />
              Volver a eventos
            </Link>
          </Button>
          <Button asChild className="rounded-lg">
            <Link href={`/dashboard/projects/${projectId}/events/${eventId}/edit`}>
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.9fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informacion principal</CardTitle>
              <CardDescription>Contenido base del evento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Titulo</p>
                  <p className="mt-1 font-semibold">{e.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Slug</p>
                  <p className="mt-1 font-mono text-sm">{e.slug?.trim() || "—"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Descripcion</p>
                {sanitizeHtmlForDisplay(e.description) ? (
                  <div
                    className="mt-2 text-sm leading-6 text-muted-foreground [&_a]:text-primary [&_a]:underline [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(e.description) }}
                  />
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Sin descripcion.</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {eventStatusBadge(e.status)}
                {featuredBadge(e.isFeatured)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Imagen del evento</CardTitle>
              <CardDescription>Visual principal del evento.</CardDescription>
            </CardHeader>
            <CardContent>
              {e.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="aspect-video max-h-96 w-full rounded-xl border border-border object-cover"
                  src={e.imageUrl}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Sin imagen.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fecha, lugar y cupo</CardTitle>
              <CardDescription>Cuando ocurre y datos para el visitante.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inicio</p>
                <p className="mt-1 text-sm tabular-nums">{formatDateTimeGuatemala(e.startDate)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fin</p>
                <p className="mt-1 text-sm tabular-nums">{formatDateTimeGuatemala(e.endDate)}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Ubicacion</p>
                <p className="mt-1 text-sm">{e.location?.trim() || "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Capacidad / cupo</p>
                <p className="mt-1 text-sm tabular-nums">{typeof e.capacity === "number" ? e.capacity : "Sin cupo definido"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Precio</p>
                <p className="mt-1 text-sm">{formatPrice(e.priceCents)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publicacion y orden</CardTitle>
              <CardDescription>Visibilidad y orden en el sitio.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Orden</p>
                <p className="mt-1 tabular-nums text-sm">{e.sortOrder ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Publicado</p>
                <p className="mt-1 text-sm">{e.isPublished ? "Si" : "No"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estado administrativo</p>
                <p className="mt-1 text-sm">{statusLabel}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha de creacion</p>
                <p className="mt-1 tabular-nums text-sm">{formatDateTimeGuatemala(e.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ultima actualizacion</p>
                <p className="mt-1 tabular-nums text-sm">{formatDateTimeGuatemala(e.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Vista previa</CardTitle>
              <CardDescription>Asi puede verse el evento en la landing page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-xl border bg-card">
                <div className="relative aspect-video bg-muted">
                  {e.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" className="h-full w-full object-cover" src={e.imageUrl} />
                  ) : (
                    <div className="grid h-full place-items-center bg-[linear-gradient(135deg,#0f172a,#2563eb)] text-white/75">
                      <div className="text-center">
                        <ImagePlus className="mx-auto h-10 w-10" />
                        <p className="mt-2 text-sm">Imagen del evento</p>
                      </div>
                    </div>
                  )}
                  {e.isFeatured && (
                    <Badge className="absolute left-3 top-3 bg-amber-500 text-white">
                      <Star className="h-3 w-3 fill-current" />
                      Destacado
                    </Badge>
                  )}
                </div>
                <div className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={e.isPublished ? "success" : "warning"}>{e.isPublished ? "Publicado" : "Borrador"}</Badge>
                    <Badge variant="secondary">{statusLabel}</Badge>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{e.title}</h2>
                    <div
                      className="mt-2 text-sm leading-6 text-muted-foreground [&_a]:text-primary [&_a]:underline [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      {formatDateTimeGuatemala(e.startDate)}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {e.location?.trim() || "Ubicacion por definir"}
                    </p>
                    <p>
                      {formatPrice(e.priceCents)}
                      {typeof e.capacity === "number" ? ` · Cupo ${e.capacity}` : ""}
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertTitle>Estado visual</AlertTitle>
                <AlertDescription>
                  El estado administrativo ({statusLabel}) y la publicacion pueden gestionarse por separado al editar el evento.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
