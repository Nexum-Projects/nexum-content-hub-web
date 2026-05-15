import Link from "next/link";
import { notFound } from "next/navigation";

import { getSession } from "@/app/actions/auth";
import { getProjectMemberDetail, getUserDetail } from "@/app/actions/content";
import { AdminUserPageHeader } from "@/components/admin/admin-user-page-header";
import { ProjectMemberEditForm } from "@/components/project-members/project-member-edit-form";
import { isAdminRole } from "@/app/dashboard/projects/project-components";

export default async function ProjectMemberEditPage({
  params,
}: {
  params: Promise<{ projectId: string; memberId: string }>;
}) {
  const { projectId, memberId } = await params;
  const session = await getSession();
  const canAdminUsers = isAdminRole(session?.platformRole);

  const memberRes = await getProjectMemberDetail(projectId, memberId);

  if (memberRes.status === "error") {
    notFound();
  }

  const member = memberRes.data;
  const userId = member.userId?.trim();
  const userRes = canAdminUsers && userId ? await getUserDetail(userId) : null;
  const platformUser = userRes?.status === "success" ? userRes.data : null;
  const displayLabel =
    platformUser?.name?.trim() ?? (userId ? `Usuario ${userId.slice(0, 8)}…` : "Editar miembro");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <AdminUserPageHeader
        backAlign="left"
        backHref={`/dashboard/projects/${projectId}/members/${memberId}`}
        backLabel="Volver al detalle"
        breadcrumbCurrent="Editar"
        breadcrumbHref={`/dashboard/projects/${projectId}/members`}
        breadcrumbParentLabel="Miembros"
        description="Actualiza el rol de esta persona dentro del proyecto."
        title={displayLabel}
      />

      <p className="text-sm text-muted-foreground">
        <Link className="font-medium text-primary hover:underline" href={`/dashboard/projects/${projectId}/members`}>
          Lista de miembros
        </Link>
      </p>

      <ProjectMemberEditForm
        member={member}
        projectId={projectId}
        userEmail={platformUser?.email}
        userName={displayLabel}
      />
    </div>
  );
}
