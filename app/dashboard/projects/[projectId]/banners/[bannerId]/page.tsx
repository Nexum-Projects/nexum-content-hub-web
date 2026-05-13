import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import { getBannerDetail } from "@/app/actions/content/get-resource-detail";
import { publishBadge } from "@/components/resource-lists/entity-badges";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTimeGuatemala } from "@/lib/datetime-guatemala";
import { humanizeBannerButtonVariant } from "@/utils/helpers/humanize-enum";
import { sanitizeHtmlForDisplay } from "@/utils/helpers/sanitize-html-display";

export default async function BannerDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; bannerId: string }>;
}) {
  const { projectId, bannerId } = await params;
  const res = await getBannerDetail(projectId, bannerId);
  if (res.status === "error") {
    notFound();
  }
  const b = res.data;
  const previewHtml =
    sanitizeHtmlForDisplay(b.description) || "<p class=\"text-white/80\">Descripcion del banner aqui</p>";
  const previewButtons = (b.buttons ?? [])
    .slice()
    .sort((a, c) => (a.sortOrder ?? 0) - (c.sortOrder ?? 0));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Link className="font-medium text-primary hover:underline" href={`/dashboard/projects/${projectId}/banners`}>
              Banners
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">Detalle</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-7">{b.title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Contenido del carrusel de la landing page, alineado con el formulario de creacion.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="rounded-lg" variant="outline">
            <Link href={`/dashboard/projects/${projectId}/banners`}>
              <ArrowLeft className="h-4 w-4" />
              Volver a banners
            </Link>
          </Button>
          <Button asChild className="rounded-lg">
            <Link href={`/dashboard/projects/${projectId}/banners/${bannerId}/edit`}>
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
              <CardDescription>Contenido base que aparece en el banner.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Titulo</p>
                <p className="mt-1 text-base font-semibold">{b.title}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Descripcion</p>
                {sanitizeHtmlForDisplay(b.description) ? (
                  <div
                    className="mt-2 text-sm leading-6 text-muted-foreground [&_a]:text-primary [&_a]:underline [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(b.description) }}
                  />
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Sin descripcion.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Imagen del banner</CardTitle>
              <CardDescription>Visual principal del carrusel.</CardDescription>
            </CardHeader>
            <CardContent>
              {b.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="max-h-96 w-full rounded-xl border border-border object-cover"
                  src={b.imageUrl}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Sin imagen.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Botones</CardTitle>
              <CardDescription>Llamadas a la accion configuradas para este banner.</CardDescription>
            </CardHeader>
            <CardContent>
              {previewButtons.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin botones configurados.</p>
              ) : (
                <ul className="space-y-3">
                  {previewButtons.map((btn, index) => (
                    <li className="rounded-lg border border-border p-3" key={btn.id ?? `${btn.url}-${index}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{btn.label?.trim() || "Sin texto"}</span>
                        <Badge variant={btn.variant === "SECONDARY" ? "secondary" : "default"}>
                          {humanizeBannerButtonVariant(btn.variant)}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{btn.url?.trim() || "—"}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publicacion y orden</CardTitle>
              <CardDescription>Visibilidad y posicion en el listado.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Orden</p>
                <p className="mt-1 tabular-nums text-sm">{b.sortOrder ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estado</p>
                <div className="mt-2">{publishBadge(b.isPublished)}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha de creacion</p>
                <p className="mt-1 tabular-nums text-sm">{formatDateTimeGuatemala(b.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ultima actualizacion</p>
                <p className="mt-1 tabular-nums text-sm">{formatDateTimeGuatemala(b.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Vista previa</CardTitle>
              <CardDescription>Asi se vera el banner en la landing page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative min-h-[420px] overflow-hidden rounded-xl border bg-slate-950 text-white">
                {b.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="absolute inset-0 h-full w-full object-cover" src={b.imageUrl} />
                ) : (
                  <div className="absolute inset-0 grid place-items-center bg-[linear-gradient(135deg,#0f172a,#2563eb)] text-white/75">
                    <p className="text-sm">Sin imagen</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-r from-slate-950/90 via-slate-950/45 to-transparent" />
                <div className="relative flex min-h-[420px] max-w-md flex-col justify-center p-8">
                  <Badge className="mb-4 w-fit bg-primary/80 text-white">Titulo del banner</Badge>
                  <h2 className="text-3xl font-semibold leading-tight">{b.title}</h2>
                  <div
                    className="mt-3 text-sm leading-6 text-white/85 [&_a]:underline [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                  <div className="mt-6 flex flex-wrap gap-2">
                    {previewButtons.length ? (
                      previewButtons.map((button, index) => (
                        <Button
                          key={`${button.label ?? "btn"}-${index}`}
                          type="button"
                          variant={button.variant === "SECONDARY" ? "secondary" : "default"}
                        >
                          {button.label?.trim() || "Texto del boton"}
                        </Button>
                      ))
                    ) : (
                      <Button type="button">Texto del boton</Button>
                    )}
                  </div>
                </div>
              </div>

              <Alert>
                <AlertTitle>Estado</AlertTitle>
                <AlertDescription className="flex flex-wrap items-center gap-2">
                  {publishBadge(b.isPublished)}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
