import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { fetchActionButtonsForReorder, getProjectSummary } from "@/app/actions/content";
import { ActionButtonsReorderClient } from "@/components/reorder/action-buttons-reorder-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function ActionButtonsOrderPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [projectResult, buttonsResult] = await Promise.all([
    getProjectSummary(projectId),
    fetchActionButtonsForReorder(projectId),
  ]);
  const projectName = projectResult.status === "success" ? projectResult.data.name : "Proyecto";
  const buttons = buttonsResult.status === "success" ? buttonsResult.data : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button asChild variant="outline">
        <Link href={`/dashboard/projects/${projectId}/action-buttons`}>
          <ArrowLeft className="h-4 w-4" />
          Volver a botones
        </Link>
      </Button>
      <Card className="rounded-xl border bg-card shadow-sm">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">{projectName}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Ordenar botones de accion</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Arrastra los botones para definir el orden en que apareceran en la landing page.
          </p>
        </CardContent>
      </Card>
      {buttonsResult.status === "error" ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {buttonsResult.errors[0]?.message}
        </p>
      ) : null}
      <ActionButtonsReorderClient items={buttons} projectId={projectId} />
    </div>
  );
}
