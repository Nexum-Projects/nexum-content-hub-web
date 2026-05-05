import Link from "next/link";
import { notFound } from "next/navigation";

import { getBannerDetail } from "@/app/actions/content/get-resource-detail";
import { publishBadge } from "@/components/resource-lists/entity-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button asChild className="rounded-lg" size="sm" variant="outline">
          <Link href={`/dashboard/projects/${projectId}/banners`}>Volver al listado</Link>
        </Button>
        <Button asChild className="rounded-lg" size="sm">
          <Link href={`/dashboard/projects/${projectId}/banners/${bannerId}/edit`}>Editar</Link>
        </Button>
      </div>
      <Card className="rounded-xl border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">{b.title}</CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm leading-5 text-muted-foreground">
            {publishBadge(b.isPublished)}
            <span className="tabular-nums text-muted-foreground">Alta: {b.createdAt?.slice(0, 10) ?? "—"}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {b.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="max-h-64 w-full max-w-md rounded-xl border border-border object-cover" src={b.imageUrl} />
          ) : null}
          {b.description ? (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {b.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Sin descripcion.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
