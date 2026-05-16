import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { fetchMediaForReorder } from "@/app/actions/content";
import getProjectSummary from "@/app/actions/content/get-project-summary";
import { MediaReorderClient } from "@/components/reorder/media-reorder-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { fallbackProjects } from "../../../fallback-data";

export default async function MediaOrderPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [projectRes, mediaRes] = await Promise.all([
    getProjectSummary(projectId),
    fetchMediaForReorder(projectId),
  ]);
  const project = projectRes.status === "success" ? projectRes.data : fallbackProjects[0];
  const media = mediaRes.status === "success" ? mediaRes.data : [];
  const error = mediaRes.status === "error" ? mediaRes.errors[0]?.message ?? "No se pudo cargar la lista." : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-4">
        <Button asChild className="rounded-lg" variant="outline">
          <Link href={`/dashboard/projects/${projectId}/media`}>
            <ArrowLeft className="h-4 w-4" />
            Volver a medios
          </Link>
        </Button>
        <div>
          <p className="text-sm text-muted-foreground">Medios</p>
          <h1 className="mt-2 text-2xl font-semibold leading-7">Ordenar medios</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Reordena visualmente la biblioteca de {project.name}. El primer elemento aparece antes donde se consuma esta lista.
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Lista ordenable</CardTitle>
          <CardDescription>Arrastra las tarjetas y guarda cuando el orden este listo.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>
          ) : (
            <MediaReorderClient items={media} projectId={projectId} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
