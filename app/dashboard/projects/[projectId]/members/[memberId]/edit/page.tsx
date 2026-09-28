import Link from "next/link";
import { notFound } from "next/navigation";

import { getSession } from "@/app/actions/auth";
import { getProjectMemberDetail, getUserDetail } from "@/app/actions/content";
import { getMemberPermissions, getMyPermissions } from "@/app/actions/content/permissions";
import { AdminUserPageHeader } from "@/components/admin/admin-user-page-header";
import { MemberPermissionsForm } from "@/components/project-members/member-permissions-form";
import { ProjectMemberEditForm } from "@/components/project-members/project-member-edit-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CMS_RESOURCES } from "@/lib/cms-resources";
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
  // El owner (y el super admin) recibe todo el plan en `me/permissions`: sus claves son los recursos del plan.
  const [memberPermissions, planPermissions] =
    member.role === "OWNER"
      ? [null, null]
      : await Promise.all([getMemberPermissions(projectId, memberId), getMyPermissions(projectId)]);
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
        description="Actualiza el rol y los permisos por sección de esta persona dentro del proyecto."
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

      {member.role === "OWNER" ? (
        <p className="text-sm text-muted-foreground">El propietario tiene acceso total a las secciones del plan.</p>
      ) : memberPermissions?.status === "success" && planPermissions?.status === "success" ? (
        <MemberPermissionsForm
          initialPermissions={memberPermissions.data}
          memberId={memberId}
          planResources={CMS_RESOURCES.filter((resource) => planPermissions.data[resource] !== undefined)}
          projectId={projectId}
        />
      ) : (
        <Alert className="border-warning/30 bg-warning/10">
          <AlertTitle>No se cargaron los permisos</AlertTitle>
          <AlertDescription>
            {(memberPermissions?.status === "error" ? memberPermissions.errors[0]?.message : undefined) ??
              (planPermissions?.status === "error" ? planPermissions.errors[0]?.message : undefined) ??
              "Error del API."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
