import { notFound, redirect } from "next/navigation";

import { getSession } from "@/app/actions/auth";
import { getProjectMembers, getProjects, getUserDetail } from "@/app/actions/content";
import type { Project, ProjectMemberRole } from "@/app/actions/content/types";
import { AdminUserEditForm } from "@/components/admin/admin-user-forms";
import { AdminUserPageHeader } from "@/components/admin/admin-user-page-header";
import { resolveAvatarUrl } from "@/lib/utils";
import { isAdminRole } from "../../../../projects/project-components";

export default async function UserEditPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await getSession();
  if (!isAdminRole(session?.platformRole)) {
    redirect("/dashboard");
  }

  const { userId } = await params;
  const res = await getUserDetail(userId);
  if (res.status === "error") {
    notFound();
  }

  const user = res.data;
  const displayName = user.name?.trim() || user.email || "Usuario";
  const existingAvatarUrl = resolveAvatarUrl(user);

  const isSuperAdmin = session?.platformRole === "SUPER_ADMIN";
  let projects: Project[] = [];
  let projectMemberships: Array<{ memberId: string; projectId: string; role: ProjectMemberRole }> = [];
  if (isSuperAdmin) {
    const projectsRes = await getProjects();
    if (projectsRes.status === "success") {
      projects = projectsRes.data;
    }
    const memberResults = await Promise.all(projects.map((project) => getProjectMembers(project.id)));
    projectMemberships = memberResults.flatMap((result, index) => {
      if (result.status === "error") {
        return [];
      }
      const projectId = projects[index]?.id;
      return result.data
        .filter((member) => member.userId === userId)
        .map((member) => ({
          memberId: member.id,
          projectId: member.projectId ?? projectId,
          role: member.role,
        }));
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <AdminUserPageHeader
        backHref={`/dashboard/admin/users/${userId}`}
        backLabel="Volver al detalle"
        breadcrumbCurrent="Editar"
        breadcrumbHref="/dashboard/admin/users"
        description="Actualiza datos de la cuenta, contraseña opcional, foto de perfil y estado de acceso."
        title={`Editar · ${displayName}`}
      />

      <AdminUserEditForm
        existingAvatarUrl={existingAvatarUrl}
        initialProjectMemberships={projectMemberships}
        projects={projects}
        showProjectAssignment={isSuperAdmin}
        user={user}
      />
    </div>
  );
}
