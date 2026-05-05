import { Suspense } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";

import { fetchMenuProductsPage } from "@/app/actions/content/fetch-paginated-lists";
import getProjectSummary from "@/app/actions/content/get-project-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductsListClient } from "@/components/project-lists/products-list-client";
import { ProjectListPanelSkeleton } from "@/components/project-lists/project-list-panel-skeleton";
import { DEFAULT_LIST_LIMIT, type RawSearchParams } from "@/lib/project-list-query";

import { fallbackProjects } from "../../fallback-data";

function emptyMeta() {
  return {
    page: 1,
    limit: DEFAULT_LIST_LIMIT,
    totalObjects: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { projectId } = await params;
  const sp = await searchParams;

  const [projectRes, listRes] = await Promise.all([
    getProjectSummary(projectId),
    fetchMenuProductsPage(projectId, sp),
  ]);

  const project = projectRes.status === "success" ? projectRes.data : fallbackProjects[0];
  const products = listRes.status === "success" ? listRes.data.items : [];
  const meta = listRes.status === "success" ? listRes.data.meta : emptyMeta();
  const listError = listRes.status === "error" ? listRes.errors[0]?.message ?? "No se pudo cargar la lista." : null;
  const createHref = `/dashboard/projects/${projectId}/products/new`;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Menu / Productos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Comida y bebida para {project.name}.</p>
          <p className="mt-3 text-sm font-medium text-primary">{meta.totalObjects} resultados</p>
        </div>
        <Button asChild className="h-10 shrink-0 rounded-lg shadow-sm">
          <Link href={createHref}>
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Link>
        </Button>
      </section>

      <Card className="rounded-xl border border-border shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg">Listado</CardTitle>
          <CardDescription className="text-sm">Busqueda, filtros, orden y paginacion.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<ProjectListPanelSkeleton />}>
            <ProductsListClient
              createHref={createHref}
              listError={listError}
              meta={meta}
              products={products}
              projectId={projectId}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
