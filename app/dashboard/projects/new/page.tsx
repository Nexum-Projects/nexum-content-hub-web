import { redirect } from "next/navigation";

import { getSession } from "@/app/actions/auth";
import { ProjectFormPage } from "@/components/projects/project-form-card";

import { isSuperAdminRole } from "../project-components";

export default async function NewProjectPage() {
  const session = await getSession();

  if (!isSuperAdminRole(session?.platformRole)) {
    redirect("/dashboard");
  }

  return (
    <ProjectFormPage
      backHref="/dashboard"
      backLabel="Volver a proyectos"
      breadcrumbCurrent="Nuevo proyecto"
      breadcrumbHref="/dashboard"
      breadcrumbParentLabel="Proyectos"
      cancelHref="/dashboard"
      description="Registra un proyecto: nombre, dominio opcional, logo (imagen) e icono SVG para el panel."
      footerHelper="Tras crear el proyecto aparecerá en la lista principal y podrás asignar contenido."
      mode="create"
      submitLabel="Crear proyecto"
      title="Nuevo proyecto"
    />
  );
}
