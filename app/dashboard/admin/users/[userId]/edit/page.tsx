import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getSession } from "@/app/actions/auth";
import { getUserDetail, updateUser } from "@/app/actions/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import { humanizePlatformRole } from "@/utils/helpers/humanize-enum";
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
  const action = updateUser.bind(null, userId);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild className="rounded-lg" size="sm" variant="outline">
        <Link href={`/dashboard/admin/users/${userId}`}>Volver al detalle</Link>
      </Button>

      <Card className="rounded-xl border border-border shadow-sm">
        <CardHeader>
          <CardTitle>Editar usuario</CardTitle>
          <CardDescription>Actualizacion mediante `PUT /admin/users/{'{id}'}`.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre">
              <Input defaultValue={user.name} name="name" required />
            </Field>
            <Field label="Correo">
              <Input defaultValue={user.email} name="email" required type="email" />
            </Field>
            <Field label="Password (opcional)">
              <Input minLength={6} name="password" placeholder="Dejar vacio para mantener actual" type="password" />
            </Field>
            <Field label="Rol">
              <Select defaultValue={user.platformRole ?? "USER"} name="platformRole">
                <option value="USER">{humanizePlatformRole("USER")}</option>
                <option value="SUPER_ADMIN">{humanizePlatformRole("SUPER_ADMIN")}</option>
              </Select>
            </Field>
            <Field className="sm:col-span-2" label="Avatar URL">
              <Input defaultValue={user.avatarUrl ?? user.avatar_url ?? ""} name="avatarUrl" placeholder="https://..." type="url" />
            </Field>

            <label className="sm:col-span-2 flex items-center gap-2 text-sm text-muted-foreground">
              <input className="h-4 w-4 rounded border-input accent-primary" defaultChecked={user.isActive !== false} name="isActive" type="checkbox" />
              Usuario activo
            </label>

            <div className="flex justify-end sm:col-span-2">
              <Button type="submit">Guardar cambios</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
