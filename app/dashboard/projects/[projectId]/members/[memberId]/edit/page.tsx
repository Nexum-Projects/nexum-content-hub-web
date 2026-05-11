import Link from "next/link";
import { notFound } from "next/navigation";

import { getProjectMemberDetail, getUsers } from "@/app/actions/content";
import { AdminUserPageHeader } from "@/components/admin/admin-user-page-header";
import { ProjectMemberEditForm } from "@/components/project-members/project-member-edit-form";

export default async function ProjectMemberEditPage({
  params,
}: {
  params: Promise<{ projectId: string; memberId: string }>;
}) {
  const { projectId, memberId } = await params;

  const [memberRes, usersRes] = await Promise.all([getProjectMemberDetail(projectId, memberId), getUsers()]);

  if (memberRes.status === "error") {
    notFound();
  }

  const member = memberRes.data;
  const users =
    usersRes.status === "success"
      ? [...usersRes.data].sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }))
      : [];

  const displayLabel = member.userId ? `Miembro · ${member.userId.slice(0, 8)}…` : "Editar miembro";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <AdminUserPageHeader
        backHref={`/dashboard/projects/${projectId}/members/${memberId}`}
        backLabel="Volver al detalle"
        breadcrumbCurrent="Editar"
        breadcrumbHref={`/dashboard/projects/${projectId}/members`}
        breadcrumbParentLabel="Miembros"
        description="Actualiza el usuario vinculado, el rol dentro del proyecto y si la membresía está activa."
        title={displayLabel}
      />

      <p className="text-sm text-muted-foreground">
        <Link className="font-medium text-primary hover:underline" href={`/dashboard/projects/${projectId}/members`}>
          Lista de miembros
        </Link>
      </p>

      <ProjectMemberEditForm member={member} projectId={projectId} users={users} />
    </div>
  );
}
