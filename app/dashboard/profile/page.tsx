import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getAuthenticatedUserId, getSession } from "@/app/actions/auth";
import { getUserDetail } from "@/app/actions/content";
import type { User } from "@/app/actions/content/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTimeGuatemala } from "@/lib/datetime-guatemala";
import { resolveAvatarUrl } from "@/lib/utils";
import { humanizePlatformRole } from "@/utils/helpers/humanize-enum";
import { isAdminRole } from "../projects/project-components";

type ProfileSource = User | (Pick<User, "id" | "name" | "email"> & {
  platformRole?: string | null;
  isActive?: boolean;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  emailVerifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
});

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  /** Id para GET /api/admin/users/:id — viene del access token y/o refresh (sub, id, userId…). */
  const userId = await getAuthenticatedUserId();
  const canEditInAdmin = isAdminRole(session.platformRole);

  let user: User | null = null;
  if (userId) {
    const res = await getUserDetail(userId);
    if (res.status === "success") {
      user = res.data;
    }
  }

  const merged: ProfileSource =
    user ??
    ({
      id: userId ?? "—",
      name: session.name ?? "—",
      email: session.email ?? "—",
      platformRole: session.platformRole,
      isActive: session.isActive !== false,
      avatarUrl: session.avatarUrl ?? null,
      avatar_url: session.avatar_url ?? null,
      emailVerifiedAt: null,
      createdAt: undefined,
    } as ProfileSource);

  const avatar = resolveAvatarUrl(merged);
  const isActive = merged.isActive !== false;
  const roleLabel = humanizePlatformRole(merged.platformRole);
  const adminBadge = isAdminRole(merged.platformRole);
  /** Solo alertar si es admin: deben poder usar GET /admin/users/:id. Los USER suelen recibir 403 y es normal usar solo el JWT. */
  const apiUnavailable = !user && Boolean(userId) && canEditInAdmin;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Link className="font-medium text-primary hover:underline" href="/dashboard">
              Inicio
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">Mi perfil</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-7">{merged.name}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Datos de tu cuenta en el panel Nexum Content Hub.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="rounded-lg" variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>
          {canEditInAdmin && userId ? (
            <Button asChild className="rounded-lg">
              <Link href={`/dashboard/admin/users/${userId}/edit`}>Editar perfil</Link>
            </Button>
          ) : null}
        </div>
      </header>

      {apiUnavailable ? (
        <Alert className="border-warning/30 bg-warning/10">
          <AlertTitle>No se pudo cargar el detalle desde la API</AlertTitle>
          <AlertDescription>
            Se muestran los datos guardados en tu sesión (JWT). Suele deberse a un fallo temporal del API o a que el identificador del usuario en el token no coincide con el del servidor.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.9fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información principal</CardTitle>
              <CardDescription>Nombre y correo asociados a tu cuenta.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                <p className="mt-1 text-base font-semibold">{merged.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Correo electrónico</p>
                <p className="mt-1 text-sm">{merged.email}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Foto de perfil</CardTitle>
              <CardDescription>Imagen que se muestra en el menú lateral y en esta vista.</CardDescription>
            </CardHeader>
            <CardContent>
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL remota del CMS
                <img
                  alt=""
                  className="max-h-96 w-full rounded-xl border border-border object-cover"
                  src={avatar}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Sin imagen configurada.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cuenta y acceso</CardTitle>
              <CardDescription>Rol, estado y fechas registradas en el sistema.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rol</p>
                <div className="mt-2">
                  <Badge variant={adminBadge ? "default" : "secondary"}>{roleLabel}</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Estado</p>
                <div className="mt-2">
                  {isActive ? (
                    <Badge variant="success">Activo</Badge>
                  ) : (
                    <Badge variant="destructive">Inactivo</Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Correo verificado</p>
                <p className="mt-1 tabular-nums text-sm">
                  {merged.emailVerifiedAt ? formatDateTimeGuatemala(merged.emailVerifiedAt) : "No verificado"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha de creación</p>
                <p className="mt-1 tabular-nums text-sm">{formatDateTimeGuatemala(merged.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Última actualización</p>
                <p className="mt-1 tabular-nums text-sm">
                  {formatDateTimeGuatemala("updatedAt" in merged ? merged.updatedAt : undefined)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Vista previa</CardTitle>
              <CardDescription>Así se muestra tu identidad en el panel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center rounded-xl border bg-muted/30 p-8">
                <div className="relative grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-3xl font-semibold text-primary-foreground shadow-inner ring-2 ring-border">
                  {avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" className="absolute inset-0 h-full w-full object-cover" src={avatar} />
                  ) : (
                    String(merged.name || "?").slice(0, 1).toUpperCase()
                  )}
                </div>
                <p className="mt-4 text-center text-base font-semibold">{merged.name}</p>
                <p className="mt-1 text-center text-sm text-muted-foreground">{merged.email}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Badge variant={adminBadge ? "default" : "secondary"}>{roleLabel}</Badge>
                  {isActive ? <Badge variant="success">Activo</Badge> : <Badge variant="destructive">Inactivo</Badge>}
                </div>
              </div>

              <Alert>
                <AlertTitle>Estado de la cuenta</AlertTitle>
                <AlertDescription className="flex flex-wrap items-center gap-2">
                  {isActive ? (
                    <Badge variant="success">Puede iniciar sesión</Badge>
                  ) : (
                    <Badge variant="destructive">Acceso suspendido</Badge>
                  )}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
