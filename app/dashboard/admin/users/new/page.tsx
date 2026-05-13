import { redirect } from "next/navigation";

import { getSession } from "@/app/actions/auth";
import { getProjects } from "@/app/actions/content";
import type { Project } from "@/app/actions/content/types";
import { AdminUserCreateForm } from "@/components/admin/admin-user-forms";
import { AdminUserPageHeader } from "@/components/admin/admin-user-page-header";
import { isAdminRole } from "../../../projects/project-components";

export default async function NewUserPage() {
  const session = await getSession();

  if (!isAdminRole(session?.platformRole)) {
    redirect("/dashboard");
  }

  const isSuperAdmin = session?.platformRole === "SUPER_ADMIN";
  let projects: Project[] = [];
  if (isSuperAdmin) {
    const projectsRes = await getProjects();
    if (projectsRes.status === "success") {
      projects = projectsRes.data;
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <AdminUserPageHeader
        backHref="/dashboard/admin/users"
        backLabel="Volver a usuarios"
        breadcrumbCurrent="Nuevo usuario"
        breadcrumbHref="/dashboard/admin/users"
        description="Crea una cuenta de acceso al panel: define nombre visible, correo, contraseña, foto opcional y permisos."
        title="Nuevo usuario"
      />

      <AdminUserCreateForm projects={projects} showProjectAssignment={isSuperAdmin} />
    </div>
  );
}
