import Link from "next/link";
import { notFound } from "next/navigation";

import { getEventDetail } from "@/app/actions/content/get-resource-detail";
import { eventStatusBadge, featuredBadge } from "@/components/resource-lists/entity-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EventDetailPage({ params }: { params: Promise<{ projectId: string; eventId: string }> }) {
  const { projectId, eventId } = await params;
  const res = await getEventDetail(projectId, eventId);
  if (res.status === "error") {
    notFound();
  }
  const e = res.data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button asChild className="rounded-lg" size="sm" variant="outline">
          <Link href={`/dashboard/projects/${projectId}/events`}>Volver al listado</Link>
        </Button>
        <Button asChild className="rounded-lg" size="sm">
          <Link href={`/dashboard/projects/${projectId}/events/${eventId}/edit`}>Editar</Link>
        </Button>
      </div>
      <Card className="rounded-xl border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">{e.title}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            {eventStatusBadge(e.status)}
            {featuredBadge(e.isFeatured)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Inicio:</span> {e.startDate?.slice(0, 16) ?? "—"}
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Ubicacion:</span> {e.location ?? "—"}
          </p>
          {e.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="max-h-64 w-full max-w-md rounded-xl border border-border object-cover" src={e.imageUrl} />
          ) : null}
          {e.description ? (
            <p className="whitespace-pre-wrap text-muted-foreground">
              {e.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
