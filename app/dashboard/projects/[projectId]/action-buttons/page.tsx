import Link from "next/link";
import { GripVertical, MousePointerClick } from "lucide-react";

import { fetchActionButtonsPage, getProjectSummary } from "@/app/actions/content";
import type { RawSearchParams } from "@/lib/project-list-query";
import { ActionButtonsListClient } from "@/components/project-lists/action-buttons-list-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function ActionButtonsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams?: Promise<RawSearchParams>;
}) {
  const { projectId } = await params;
  const sp = (await searchParams) ?? {};
  const [projectResult, buttonsResult] = await Promise.all([
    getProjectSummary(projectId),
    fetchActionButtonsPage(projectId, sp),
  ]);
  const projectName = projectResult.status === "success" ? projectResult.data.name : "Proyecto";
  const buttons = buttonsResult.status === "success" ? buttonsResult.data.items : [];
  const meta =
    buttonsResult.status === "success"
      ? buttonsResult.data.meta
      : { page: 1, limit: 10, totalObjects: 0, totalPages: 1, hasPreviousPage: false, hasNextPage: false };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Card className="rounded-xl border bg-card shadow-sm">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{projectName}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Botones de accion</h1>
            <p className="mt-1 text-sm text-muted-foreground">Administra accesos rapidos como redes, correo y navegación.</p>
            <p className="mt-3 text-sm font-medium text-primary">{meta.totalObjects} resultados</p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/dashboard/projects/${projectId}/action-buttons/order`}>
              <GripVertical className="h-4 w-4" />
              Ordenar botones
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <MousePointerClick className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Listado</h2>
            <p className="text-sm text-muted-foreground">Filtros, paginacion y acciones por registro.</p>
          </div>
        </div>
        <ActionButtonsListClient
          buttons={buttons}
          listError={buttonsResult.status === "error" ? buttonsResult.errors[0]?.message : null}
          meta={meta}
          projectId={projectId}
        />
      </Card>
    </div>
  );
}
