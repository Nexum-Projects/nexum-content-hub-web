import { redirect } from "next/navigation";

import { getSession } from "@/app/actions/auth";
import { createUser } from "@/app/actions/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import { humanizePlatformRole } from "@/utils/helpers/humanize-enum";
import { isAdminRole } from "../../../projects/project-components";

export default async function NewUserPage() {
  const session = await getSession();

  if (!isAdminRole(session?.platformRole)) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section>
        <h1 className="text-2xl font-semibold leading-7">Nuevo usuario</h1>
        <p className="mt-1 text-sm text-muted-foreground">Campos de `UpsertUserDTO`.</p>
      </section>
      <Card>
        <CardHeader><CardTitle>Datos del usuario</CardTitle><CardDescription>Nombre, correo, password y rol de plataforma.</CardDescription></CardHeader>
        <CardContent>
          <form action={createUser} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre"><Input name="name" required /></Field>
            <Field label="Correo"><Input name="email" required type="email" /></Field>
            <Field label="Password"><Input minLength={6} name="password" required type="password" /></Field>
            <Field label="Rol">
              <Select defaultValue="USER" name="platformRole">
                <option value="USER">{humanizePlatformRole("USER")}</option>
                <option value="SUPER_ADMIN">{humanizePlatformRole("SUPER_ADMIN")}</option>
              </Select>
            </Field>
            <Field className="sm:col-span-2" label="Avatar URL">
              <Input name="avatarUrl" placeholder="https://... (foto de perfil)" type="url" />
            </Field>
            <div className="flex justify-end sm:col-span-2"><Button type="submit">Crear usuario</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
