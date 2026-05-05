import { redirect } from "next/navigation";

import { getSession } from "@/app/actions/auth";
import { createProject } from "@/app/actions/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import { isAdminRole } from "../project-components";

export default async function NewProjectPage() {
  const session = await getSession();

  if (!isAdminRole(session?.platformRole)) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section>
        <h1 className="text-2xl font-semibold leading-7">Nuevo proyecto</h1>
        <p className="mt-1 text-sm text-muted-foreground">Crea una landing o sitio administrable en Nexum Content Hub.</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Datos del proyecto</CardTitle>
          <CardDescription>Basado en el modelo `Project` de la API.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createProject} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre">
              <Input name="name" placeholder="Cafe de Reyes" required />
            </Field>
            <Field label="Slug">
              <Input name="slug" placeholder="cafe-de-reyes" required />
            </Field>
            <Field label="Dominio">
              <Input name="domain" placeholder="cafedereyes.com" />
            </Field>
            <Field label="Logo URL">
              <Input name="logoUrl" placeholder="https://..." />
            </Field>
            <Field className="sm:col-span-2" label="Avatar URL">
              <Input name="avatarUrl" placeholder="https://... (imagen del proyecto en tarjetas)" type="url" />
            </Field>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="submit">Crear proyecto</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
