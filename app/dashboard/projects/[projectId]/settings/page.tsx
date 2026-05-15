import { notFound, redirect } from "next/navigation";

import { getSession } from "@/app/actions/auth";
import { getProjectContent } from "@/app/actions/content";
import { ProjectFormPage } from "@/components/projects/project-form-card";

import { isSuperAdminRole } from "../../project-components";

export default async function ProjectSettingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const session = await getSession();

  if (!isSuperAdminRole(session?.platformRole)) {
    redirect("/dashboard");
  }

  const { projectId } = await params;
  const result = await getProjectContent(projectId);

  if (result.status !== "success") {
    notFound();
  }

  const project = result.data.selectedProject;
  if (!project) {
    notFound();
  }

  return (
    <ProjectFormPage
      backHref={`/dashboard/projects/${projectId}`}
      backLabel="Volver al proyecto"
      breadcrumbCurrent={project.name}
      breadcrumbHref="/dashboard"
      breadcrumbParentLabel="Proyectos"
      cancelHref={`/dashboard/projects/${projectId}`}
      description="Ajusta metadatos del sitio visibles en el panel. Solo los super administradores pueden ver y editar esta sección."
      footerHelper="Los cambios se guardan en la API y afectan a todos los usuarios con acceso a este proyecto."
      mode="edit"
      project={project}
      projectId={projectId}
      submitLabel="Guardar cambios"
      title="Configuración del proyecto"
    />
  );
}
