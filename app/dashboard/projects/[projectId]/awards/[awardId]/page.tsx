import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Award as AwardIcon, ExternalLink, ImagePlus, Pencil, Star } from "lucide-react";

import { getAwardDetail } from "@/app/actions/content/get-resource-detail";
import { featuredBadge, publishBadge } from "@/components/resource-lists/entity-badges";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateGuatemala, formatDateTimeGuatemala } from "@/lib/datetime-guatemala";
import { sanitizeHtmlForDisplay } from "@/utils/helpers/sanitize-html-display";

function formatAwardDate(value?: string | null) {
  if (!value?.trim()) {
    return "—";
  }
  const shown = formatDateGuatemala(value);
  return shown === "—" ? "—" : shown;
}

export default async function AwardDetailPage({ params }: { params: Promise<{ projectId: string; awardId: string }> }) {
  const { projectId, awardId } = await params;
  const res = await getAwardDetail(projectId, awardId);
  if (res.status === "error") {
    notFound();
  }
  const a = res.data;
  const previewHtml =
    sanitizeHtmlForDisplay(a.description) || "<p>Descripcion breve del reconocimiento.</p>";
  const sourceUrl = a.sourceUrl?.trim();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Link className="font-medium text-primary hover:underline" href={`/dashboard/projects/${projectId}/awards`}>
              Logros / Premios
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">Detalle</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-7">{a.title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Informacion principal, imagen, fuente y publicacion, como en el formulario de creacion.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="rounded-lg" variant="outline">
            <Link href={`/dashboard/projects/${projectId}/awards`}>
              <ArrowLeft className="h-4 w-4" />
              Volver a logros
            </Link>
          </Button>
          <Button asChild className="rounded-lg">
            <Link href={`/dashboard/projects/${projectId}/awards/${awardId}/edit`}>
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
              <CardDescription>Contenido del reconocimiento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Titulo</p>
                <p className="mt-1 font-semibold">{a.title}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {publishBadge(a.isPublished)}
                {featuredBadge(a.isFeatured)}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Descripcion</p>
                {sanitizeHtmlForDisplay(a.description) ? (
                  <div
                    className="mt-2 text-sm leading-6 text-muted-foreground [&_a]:text-primary [&_a]:underline [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(a.description) }}
                  />
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Sin descripcion.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Imagen del reconocimiento</CardTitle>
              <CardDescription>Arte o foto del premio.</CardDescription>
            </CardHeader>
            <CardContent>
              {a.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="aspect-4/3 max-h-96 w-full rounded-xl border border-border object-cover"
                  src={a.imageUrl}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Sin imagen.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fuente y fecha</CardTitle>
              <CardDescription>Origen del reconocimiento y orden.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fuente</p>
                <p className="mt-1 text-sm">{a.sourceName?.trim() || "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">URL fuente</p>
                {sourceUrl ? (
                  <a className="mt-1 block text-sm text-primary underline hover:no-underline" href={sourceUrl} rel="noopener noreferrer" target="_blank">
                    {sourceUrl}
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">—</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha del reconocimiento</p>
                <p className="mt-1 tabular-nums text-sm">{formatAwardDate(a.awardedAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Orden</p>
                <p className="mt-1 tabular-nums text-sm">{a.sortOrder ?? "—"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publicacion</CardTitle>
              <CardDescription>Visibilidad en la landing page.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Publicado</p>
                <div className="mt-2">{publishBadge(a.isPublished)}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Destacado</p>
                <div className="mt-2">{featuredBadge(a.isFeatured)}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha de creacion</p>
                <p className="mt-1 tabular-nums text-sm">{formatDateTimeGuatemala(a.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ultima actualizacion</p>
                <p className="mt-1 tabular-nums text-sm">{formatDateTimeGuatemala(a.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Vista previa</CardTitle>
              <CardDescription>Asi se vera el logro dentro de la landing page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-xl border bg-card">
                <div className="relative aspect-4/3 bg-muted">
                  {a.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" className="h-full w-full object-cover" src={a.imageUrl} />
                  ) : (
                    <div className="grid h-full place-items-center bg-[linear-gradient(135deg,#0f172a,#2563eb)] text-white/75">
                      <div className="text-center">
                        <ImagePlus className="mx-auto h-10 w-10" />
                        <p className="mt-2 text-sm">Imagen del logro</p>
                      </div>
                    </div>
                  )}
                  {a.isFeatured && (
                    <Badge className="absolute left-3 top-3 bg-amber-500 text-white">
                      <Star className="h-3 w-3 fill-current" />
                      Destacado
                    </Badge>
                  )}
                </div>
                <div className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={a.isPublished ? "success" : "warning"}>{a.isPublished ? "Publicado" : "Borrador"}</Badge>
                    <Badge variant="secondary">
                      <AwardIcon className="h-3 w-3" />
                      Reconocimiento
                    </Badge>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{a.title}</h2>
                    <div
                      className="mt-2 text-sm leading-6 text-muted-foreground [&_a]:text-primary [&_a]:underline [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <p>{formatAwardDate(a.awardedAt)}</p>
                    <p className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-primary" />
                      {a.sourceName?.trim() || "Fuente por definir"}
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertTitle>Consejo</AlertTitle>
                <AlertDescription>
                  Mantén la fuente y la fecha claras para que el reconocimiento sea facil de validar en sitio publico.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
