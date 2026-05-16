import Link from "next/link";
import { ArrowLeft, Contact } from "lucide-react";

import { getSession } from "@/app/actions/auth";
import { getProjectMembers, getProjectSummary, getUsers } from "@/app/actions/content";
import type { ProjectMember, User } from "@/app/actions/content/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignProjectMemberDialog } from "@/components/project-members/assign-project-member-dialog";
import { ProjectMembersListClient } from "@/components/project-members/project-members-list-client";
import { fallbackProjects } from "../../fallback-data";

export default async function ProjectMembersPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  const [session, projectRes, membersRes, usersRes] = await Promise.all([
    getSession(),
    getProjectSummary(projectId),
    getProjectMembers(projectId),
    getUsers(),
  ]);

  const isSuperAdmin = session?.platformRole === "SUPER_ADMIN";
  const project = projectRes.status === "success" ? projectRes.data : fallbackProjects[0];
  const members: ProjectMember[] = membersRes.status === "success" ? membersRes.data : [];
  const listError = membersRes.status === "error" ? membersRes.errors[0]?.message ?? "No se pudo cargar el equipo." : null;

  const usersById = new Map<string, User>();
  if (usersRes.status === "success") {
    for (const u of usersRes.data) {
      usersById.set(u.id, u);
    }
  }

  const assignedUserIds = new Set(members.map((m) => m.userId).filter(Boolean) as string[]);
  const assignCandidates =
    usersRes.status === "success"
      ? usersRes.data.filter((u) => u.isActive !== false && !assignedUserIds.has(u.id))
      : [];

  const rows = members.map((member) => ({
    member,
    user: member.userId ? usersById.get(member.userId) ?? null : null,
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {membersRes.status === "error" ? (
        <Card className="border-warning/40 bg-warning/10">
          <CardContent className="p-4 text-sm text-warning">
            No se pudo cargar la lista de miembros: {listError}
          </CardContent>
        </Card>
      ) : null}

      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Contact className="h-4 w-4 text-primary" aria-hidden />
            <span>Equipo del proyecto</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold leading-7">Miembros</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Usuarios con acceso a <span className="font-medium text-foreground">{project.name}</span>. Roles del proyecto:{' '}
            <span className="font-medium">propietario</span>, <span className="font-medium">administrador</span> o{' '}
            <span className="font-medium">marketing</span>.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {isSuperAdmin ? (
            <AssignProjectMemberDialog
              candidates={assignCandidates}
              projectId={projectId}
              usersLoaded={usersRes.status === "success"}
            />
          ) : null}
          <Button asChild className="h-10 shrink-0 rounded-lg shadow-sm" variant="outline">
            <Link href={`/dashboard/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4" />
              Volver al dashboard
            </Link>
          </Button>
        </div>
      </section>

      {usersRes.status === "error" && members.length > 0 ? (
        <Alert className="border-warning/30 bg-warning/10">
          <AlertTitle>Datos de usuario limitados</AlertTitle>
          <AlertDescription>
            No se pudieron cargar los usuarios de la plataforma para enriquecer nombres y correos en la tabla. Puede seguir
            gestionando miembros por ID.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectMembersListClient projectId={projectId} rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
