import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { fetchProductCategoriesForReorder } from "@/app/actions/content";
import getProjectSummary from "@/app/actions/content/get-project-summary";
import { CategoriesReorderClient } from "@/components/reorder/categories-reorder-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { fallbackProjects } from "../../../fallback-data";

export default async function CategoriesOrderPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [projectRes, categoriesRes] = await Promise.all([
    getProjectSummary(projectId),
    fetchProductCategoriesForReorder(projectId),
  ]);
  const project = projectRes.status === "success" ? projectRes.data : fallbackProjects[0];
  const categories = categoriesRes.status === "success" ? categoriesRes.data : [];
  const error = categoriesRes.status === "error" ? categoriesRes.errors[0]?.message ?? "No se pudo cargar la lista." : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-4">
        <Button asChild className="rounded-lg" variant="outline">
          <Link href={`/dashboard/projects/${projectId}/categories`}>
            <ArrowLeft className="h-4 w-4" />
            Volver a categorias
          </Link>
        </Button>
        <div>
          <p className="text-sm text-muted-foreground">Categorias</p>
          <h1 className="mt-2 text-2xl font-semibold leading-7">Ordenar categorias</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Reordena las categorias de {project.name}. El primer elemento aparece antes en la landing.
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
            <CategoriesReorderClient items={categories} projectId={projectId} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
