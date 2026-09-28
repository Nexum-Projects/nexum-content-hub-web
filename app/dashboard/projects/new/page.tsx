import { redirect } from "next/navigation";

import { getSession } from "@/app/actions/auth";
import { getPlans } from "@/app/actions/content/plans";
import { ProjectFormPage } from "@/components/projects/project-form-card";

import { isSuperAdminRole } from "../project-components";

export default async function NewProjectPage() {
  const session = await getSession();

  if (!isSuperAdminRole(session?.platformRole)) {
    redirect("/dashboard");
  }

  const plans = await getPlans();

  return (
    <ProjectFormPage
      backHref="/dashboard"
      backLabel="Volver a proyectos"
      breadcrumbCurrent="Nuevo proyecto"
      breadcrumbHref="/dashboard"
      breadcrumbParentLabel="Proyectos"
      cancelHref="/dashboard"
      description="Registra un proyecto: nombre, dominio opcional, plan, logo (imagen) e icono SVG para el panel."
      footerHelper="Tras crear el proyecto aparecerá en la lista principal y podrás asignar contenido."
      mode="create"
      plans={plans.status === "success" ? plans.data : []}
      submitLabel="Crear proyecto"
      title="Nuevo proyecto"
    />
  );
}
