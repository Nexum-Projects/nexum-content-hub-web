import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { fetchLocationsForReorder, getProjectSummary } from "@/app/actions/content";
import { LocationsReorderClient } from "@/components/reorder/locations-reorder-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function LocationsOrderPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [projectResult, locationsResult] = await Promise.all([
    getProjectSummary(projectId),
    fetchLocationsForReorder(projectId),
  ]);
  const projectName = projectResult.status === "success" ? projectResult.data.name : "Proyecto";
  const locations = locationsResult.status === "success" ? locationsResult.data : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button asChild variant="outline">
        <Link href={`/dashboard/projects/${projectId}/locations`}>
          <ArrowLeft className="h-4 w-4" />
          Volver a ubicaciones
        </Link>
      </Button>
      <Card className="rounded-xl border bg-card shadow-sm">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">{projectName}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Ordenar ubicaciones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Arrastra las ubicaciones para definir el orden en que apareceran en la landing page.
          </p>
        </CardContent>
      </Card>
      {locationsResult.status === "error" ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {locationsResult.errors[0]?.message}
        </p>
      ) : null}
      <LocationsReorderClient items={locations} projectId={projectId} />
    </div>
  );
}
