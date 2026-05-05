import Link from "next/link";
import { notFound } from "next/navigation";

import { getAwardDetail } from "@/app/actions/content/get-resource-detail";
import { featuredBadge, publishBadge } from "@/components/resource-lists/entity-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AwardDetailPage({ params }: { params: Promise<{ projectId: string; awardId: string }> }) {
  const { projectId, awardId } = await params;
  const res = await getAwardDetail(projectId, awardId);
  if (res.status === "error") {
    notFound();
  }
  const a = res.data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button asChild className="rounded-lg" size="sm" variant="outline">
          <Link href={`/dashboard/projects/${projectId}/awards`}>Volver al listado</Link>
        </Button>
        <Button asChild className="rounded-lg" size="sm">
          <Link href={`/dashboard/projects/${projectId}/awards/${awardId}/edit`}>Editar</Link>
        </Button>
      </div>
      <Card className="rounded-xl border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">{a.title}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            {publishBadge(a.isPublished)}
            {featuredBadge(a.isFeatured)}
            <span className="text-muted-foreground">Fuente: {a.sourceName ?? "—"}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Fecha premio:</span> {a.awardedAt?.slice(0, 10) ?? "—"}
          </p>
          {a.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="max-h-64 w-full max-w-md rounded-xl border border-border object-cover" src={a.imageUrl} />
          ) : null}
          {a.description ? (
            <p className="whitespace-pre-wrap text-muted-foreground">
              {a.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
