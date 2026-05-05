import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getSession } from "@/app/actions/auth";
import { getUserDetail } from "@/app/actions/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { humanizePlatformRole } from "@/utils/helpers/humanize-enum";
import { resolveAvatarUrl } from "@/lib/utils";
import { isAdminRole } from "../../../projects/project-components";

export default async function UserDetailPage({
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
  const avatar = resolveAvatarUrl(user);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button asChild className="rounded-lg" size="sm" variant="outline">
          <Link href="/dashboard/admin/users">Volver al listado</Link>
        </Button>
        <Button asChild className="rounded-lg" size="sm">
          <Link href={`/dashboard/admin/users/${user.id}/edit`}>Editar</Link>
        </Button>
      </div>

      <Card className="rounded-xl border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Detalle de usuario</CardTitle>
          <CardDescription>Informacion proveniente de `GET /admin/users/{'{id}'}`.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-lg font-semibold text-primary-foreground">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL remota del CMS
                <img alt={`Avatar de ${user.name}`} className="absolute inset-0 h-full w-full object-cover" src={avatar} />
              ) : (
                String(user.name).slice(0, 1).toUpperCase()
              )}
            </div>
            <div>
              <p className="text-lg font-semibold">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Rol</p>
              <p className="mt-1 text-sm">{humanizePlatformRole(user.platformRole)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</p>
              <p className="mt-1 text-sm">{user.isActive === false ? "Inactivo" : "Activo"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Creado</p>
              <p className="mt-1 text-sm">{user.createdAt ? new Date(user.createdAt).toLocaleString("es-GT") : "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email verificado</p>
              <p className="mt-1 text-sm">{user.emailVerifiedAt ? new Date(user.emailVerifiedAt).toLocaleString("es-GT") : "No verificado"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
