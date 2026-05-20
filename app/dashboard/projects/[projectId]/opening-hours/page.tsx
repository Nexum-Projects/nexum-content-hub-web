import { Clock } from "lucide-react";

import { fetchOpeningHoursPage, getProjectSummary } from "@/app/actions/content";
import type { RawSearchParams } from "@/lib/project-list-query";
import { OpeningHoursListClient } from "@/components/project-lists/opening-hours-list-client";
import { Card, CardContent } from "@/components/ui/card";

export default async function OpeningHoursPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams?: Promise<RawSearchParams>;
}) {
  const { projectId } = await params;
  const sp = (await searchParams) ?? {};
  const [projectResult, hoursResult] = await Promise.all([
    getProjectSummary(projectId),
    fetchOpeningHoursPage(projectId, sp),
  ]);
  const projectName = projectResult.status === "success" ? projectResult.data.name : "Proyecto";
  const hours = hoursResult.status === "success" ? hoursResult.data.items : [];
  const meta =
    hoursResult.status === "success"
      ? hoursResult.data.meta
      : { page: 1, limit: 10, totalObjects: 0, totalPages: 1, hasPreviousPage: false, hasNextPage: false };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Card className="rounded-xl border bg-card shadow-sm">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">{projectName}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Horario de atencion</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configura los dias y rangos visibles en la landing page.</p>
          <p className="mt-3 text-sm font-medium text-primary">{meta.totalObjects} resultados</p>
        </CardContent>
      </Card>

      <Card className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Horarios</h2>
            <p className="text-sm text-muted-foreground">Filtros, paginacion y acciones por registro.</p>
          </div>
        </div>
        <OpeningHoursListClient
          hours={hours}
          listError={hoursResult.status === "error" ? hoursResult.errors[0]?.message : null}
          meta={meta}
          projectId={projectId}
        />
      </Card>
    </div>
  );
}
