import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ImagePlus, Star } from "lucide-react";

import { formatPrice } from "@/app/dashboard/projects/project-components";
import { getMenuProductDetail } from "@/app/actions/content/get-resource-detail";
import { featuredBadge, productTypeBadge, publishBadge } from "@/components/resource-lists/entity-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { sanitizeHtmlForDisplay } from "@/utils/helpers/sanitize-html-display";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; productId: string }>;
}) {
  const { projectId, productId } = await params;
  const res = await getMenuProductDetail(projectId, productId);
  if (res.status === "error") {
    notFound();
  }
  const p = res.data;
  const previewHtml =
    sanitizeHtmlForDisplay(p.description) || "<p>Descripcion breve del producto.</p>";
  const priceLabel = formatPrice(p.priceCents);
  const priceDefined = p.priceCents != null && Number.isFinite(p.priceCents);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Link className="font-medium text-primary hover:underline" href={`/dashboard/projects/${projectId}/products`}>
              Menu / Productos
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">Detalle</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-7">{p.name}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Misma estructura que el formulario de alta: informacion principal, imagen y publicacion.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="rounded-lg" variant="outline">
            <Link href={`/dashboard/projects/${projectId}/products`}>
              <ArrowLeft className="h-4 w-4" />
              Volver a productos
            </Link>
          </Button>
          <Button asChild className="rounded-lg">
            <Link href={`/dashboard/projects/${projectId}/products/${productId}/edit`}>Editar</Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.9fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informacion principal</CardTitle>
              <CardDescription>Nombre, tipo y descripcion del articulo del menu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                  <p className="mt-1 font-semibold">{p.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Slug</p>
                  <p className="mt-1 font-mono text-sm">{p.slug?.trim() || "—"}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {productTypeBadge(p.type)}
                {publishBadge(p.isPublished)}
                {featuredBadge(p.isFeatured)}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Precio</p>
                <p
                  className={
                    priceDefined ? "mt-1 text-lg font-semibold text-primary" : "mt-1 text-base font-medium text-muted-foreground"
                  }
                >
                  {priceLabel}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Descripcion</p>
                {sanitizeHtmlForDisplay(p.description) ? (
                  <div
                    className="mt-2 text-sm leading-6 text-muted-foreground [&_a]:text-primary [&_a]:underline [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(p.description) }}
                  />
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Sin descripcion.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Imagen del producto</CardTitle>
              <CardDescription>Foto mostrada en el menu.</CardDescription>
            </CardHeader>
            <CardContent>
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="aspect-4/3 max-h-96 w-full rounded-xl border border-border object-cover"
                  src={p.imageUrl}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Sin imagen.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publicacion y orden</CardTitle>
              <CardDescription>Control de visibilidad y orden en listados.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Orden</p>
                <p className="mt-1 tabular-nums text-sm">{p.sortOrder ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Disponible</p>
                <p className="mt-1 text-sm">{p.isAvailable === false ? "No" : "Si"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha de creacion</p>
                <p className="mt-1 tabular-nums text-sm">{p.createdAt?.slice(0, 10) ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ultima actualizacion</p>
                <p className="mt-1 tabular-nums text-sm">{p.updatedAt?.slice(0, 10) ?? "—"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Vista previa</CardTitle>
              <CardDescription>Asi se vera el producto dentro del menu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-xl border bg-card">
                <div className="relative aspect-4/3 bg-muted">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" className="h-full w-full object-cover" src={p.imageUrl} />
                  ) : (
                    <div className="grid h-full place-items-center bg-[linear-gradient(135deg,#0f172a,#2563eb)] text-white/75">
                      <div className="text-center">
                        <ImagePlus className="mx-auto h-10 w-10" />
                        <p className="mt-2 text-sm">Imagen del producto</p>
                      </div>
                    </div>
                  )}
                  {p.isFeatured && (
                    <Badge className="absolute left-3 top-3 bg-amber-500 text-white">
                      <Star className="h-3 w-3 fill-current" />
                      Destacado
                    </Badge>
                  )}
                </div>
                <div className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    {productTypeBadge(p.type)}
                    {publishBadge(p.isPublished)}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{p.name}</h2>
                    <div
                      className="mt-2 text-sm leading-6 text-muted-foreground [&_a]:text-primary [&_a]:underline [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  </div>
                  <p
                    className={
                      priceDefined ? "text-lg font-semibold text-primary" : "text-base font-medium text-muted-foreground"
                    }
                  >
                    {priceLabel}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
