import { getSession } from "@/app/actions/auth";
import { getProjects } from "@/app/actions/content";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectCard } from "./projects/project-card";
import { CreateProjectCard, isAdminRole, isSuperAdminRole } from "./projects/project-components";
import { fallbackProjects } from "./projects/fallback-data";

export default async function DashboardPage() {
  const [session, result] = await Promise.all([getSession(), getProjects()]);
  const isAdmin = isAdminRole(session?.platformRole);
  const isSuperAdmin = isSuperAdminRole(session?.platformRole);
  const projects = result.status === "success" && result.data.length ? result.data : fallbackProjects;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {result.status === "error" && (
        <Card className="border-warning/40 bg-warning/10">
          <CardContent className="p-4 text-sm text-warning">
            {result.errors[0]?.title}: {result.errors[0]?.message}. Se muestra una vista previa local mientras el backend esta disponible.
          </CardContent>
        </Card>
      )}

      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold leading-7">Proyectos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin
              ? "Administra todos los proyectos desde un solo lugar."
              : "Estos son los proyectos que tienes asignados."}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {projects.map((project, index) => (
          <ProjectCard index={index} key={project.id} project={project} />
        ))}
        {isSuperAdmin && <CreateProjectCard />}
      </section>
    </div>
  );
}
