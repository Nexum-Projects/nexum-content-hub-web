import Link from "next/link";
import { notFound } from "next/navigation";

import { getMenuProductDetail } from "@/app/actions/content/get-resource-detail";
import { featuredBadge, productTypeBadge, publishBadge } from "@/components/resource-lists/entity-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/app/dashboard/projects/project-components";

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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button asChild className="rounded-lg" size="sm" variant="outline">
          <Link href={`/dashboard/projects/${projectId}/products`}>Volver al listado</Link>
        </Button>
        <Button asChild className="rounded-lg" size="sm">
          <Link href={`/dashboard/projects/${projectId}/products/${productId}/edit`}>Editar</Link>
        </Button>
      </div>
      <Card className="rounded-xl border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">{p.name}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            {productTypeBadge(p.type)}
            {publishBadge(p.isPublished)}
            {featuredBadge(p.isFeatured)}
            <span className="text-foreground">{formatPrice(p.priceCents)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="max-h-64 w-full max-w-md rounded-xl border border-border object-cover" src={p.imageUrl} />
          ) : null}
          {p.description ? (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {p.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Sin descripcion.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
