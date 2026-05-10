import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { fetchBannersForReorder } from "@/app/actions/content";
import getProjectSummary from "@/app/actions/content/get-project-summary";
import { BannersReorderClient } from "@/components/reorder/banners-reorder-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { fallbackProjects } from "../../../fallback-data";

export default async function BannersOrderPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [projectRes, bannersRes] = await Promise.all([
    getProjectSummary(projectId),
    fetchBannersForReorder(projectId),
  ]);
  const project = projectRes.status === "success" ? projectRes.data : fallbackProjects[0];
  const banners = bannersRes.status === "success" ? bannersRes.data : [];
  const error = bannersRes.status === "error" ? bannersRes.errors[0]?.message ?? "No se pudo cargar la lista." : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Banners</p>
          <h1 className="mt-2 text-2xl font-semibold leading-7">Ordenar banners</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Reordena visualmente los banners de {project.name}. El primer elemento aparece antes en la landing page.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/dashboard/projects/${projectId}/banners`}>
            <ArrowLeft className="h-4 w-4" />
            Volver a banners
          </Link>
        </Button>
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
            <BannersReorderClient items={banners} projectId={projectId} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
