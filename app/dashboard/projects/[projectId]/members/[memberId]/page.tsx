import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import { getSession } from "@/app/actions/auth";
import { getProjectMemberDetail, getUserDetail } from "@/app/actions/content";
import type { ProjectMember } from "@/app/actions/content/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTimeGuatemala } from "@/lib/datetime-guatemala";
import { resolveAvatarUrl } from "@/lib/utils";
import { humanizePlatformRole, humanizeProjectMemberRole } from "@/utils/helpers/humanize-enum";
import { isAdminRole } from "@/app/dashboard/projects/project-components";

function roleBadgeVariant(role: ProjectMember["role"]): "default" | "secondary" | "outline" {
  switch (role) {
    case "OWNER":
      return "default";
    case "ADMIN":
      return "secondary";
    default:
      return "outline";
  }
}

export default async function ProjectMemberDetailPage({
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

  /** Solo administradores de plataforma pueden ver datos del usuario y cargar el perfil completo. */
  const userRes =
    canAdminUsers && userId ? await getUserDetail(userId) : null;
  const platformUser = userRes?.status === "success" ? userRes.data : null;
  const avatar = platformUser ? resolveAvatarUrl(platformUser) : null;
  const displayName = platformUser?.name?.trim() ?? (userId ? `Usuario ${userId.slice(0, 8)}…` : "Sin usuario vinculado");
  const roleLabel = humanizeProjectMemberRole(member.role);
  const memberActive = member.isActive !== false;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Link className="font-medium text-primary hover:underline" href={`/dashboard/projects/${projectId}/members`}>
              Miembros
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">Detalle</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-7">{displayName}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {canAdminUsers
                ? "Rol y estado de esta persona dentro del proyecto. Los datos de cuenta son los del usuario de plataforma."
                : "Rol y estado de esta persona dentro del proyecto."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="rounded-lg" variant="outline">
            <Link href={`/dashboard/projects/${projectId}/members`}>
              <ArrowLeft className="h-4 w-4" />
              Volver a miembros
            </Link>
          </Button>
          <Button asChild className="rounded-lg">
            <Link href={`/dashboard/projects/${projectId}/members/${memberId}/edit`}>
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </header>

      {canAdminUsers && userId && userRes && userRes.status === "error" ? (
        <Alert className="border-warning/30 bg-warning/10">
          <AlertTitle>No se cargó el usuario de plataforma</AlertTitle>
          <AlertDescription>{userRes.errors[0]?.message ?? "Permisos o error del API."}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.9fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Membresía en el proyecto</CardTitle>
              <CardDescription>Rol y estado respecto a este proyecto.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rol en el proyecto</p>
                <div className="mt-2">
                  <Badge variant={roleBadgeVariant(member.role)}>{roleLabel}</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estado</p>
                <div className="mt-2">
                  {memberActive ? <Badge variant="success">Activo</Badge> : <Badge variant="destructive">Inactivo</Badge>}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alta en el proyecto</p>
                <p className="mt-1 tabular-nums text-sm">{formatDateTimeGuatemala(member.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Última actualización</p>
                <p className="mt-1 tabular-nums text-sm">{formatDateTimeGuatemala(member.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {canAdminUsers && platformUser ? (
            <Card>
              <CardHeader>
                <CardTitle>Usuario de la plataforma</CardTitle>
                <CardDescription>Datos del perfil compartidos con el resto del panel.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                  <p className="mt-1 text-base font-semibold">{platformUser.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Correo</p>
                  <p className="mt-1 text-sm">{platformUser.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rol de plataforma</p>
                  <div className="mt-2">
                    <Badge variant={platformUser.platformRole === "SUPER_ADMIN" ? "default" : "secondary"}>
                      {humanizePlatformRole(platformUser.platformRole)}
                    </Badge>
                  </div>
                </div>
                {userId ? (
                  <Button asChild variant="outline">
                    <Link href={`/dashboard/admin/users/${userId}`}>Abrir en administración de usuarios</Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Vista previa</CardTitle>
              <CardDescription>Identidad de la persona en el proyecto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center rounded-xl border bg-muted/30 p-8">
                <div className="relative grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-3xl font-semibold text-primary-foreground shadow-inner ring-2 ring-border">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" className="absolute inset-0 h-full w-full object-cover" src={avatar} />
                  ) : (
                    String(displayName).slice(0, 1).toUpperCase()
                  )}
                </div>
                <p className="mt-4 text-center text-base font-semibold">{displayName}</p>
                {canAdminUsers && platformUser?.email ? (
                  <p className="mt-1 text-center text-sm text-muted-foreground">{platformUser.email}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Badge variant={roleBadgeVariant(member.role)}>{roleLabel}</Badge>
                  {memberActive ? <Badge variant="success">Activo</Badge> : <Badge variant="destructive">Inactivo</Badge>}
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
