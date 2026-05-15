"use client";

import { useMemo } from "react";

import { updateProjectMember } from "@/app/actions/content/update-project-member";
import type { ProjectMember, User } from "@/app/actions/content/types";
import { ProjectMemberFormFooter } from "@/components/project-members/project-member-form-footer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { humanizeProjectMemberRole } from "@/utils/helpers/humanize-enum";

const selectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm ring-offset-background",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
);

export function ProjectMemberEditForm({
  projectId,
  member,
  users,
}: {
  projectId: string;
  member: ProjectMember;
  users: User[];
}) {
  const action = useMemo(() => updateProjectMember.bind(null, projectId, member.id), [projectId, member.id]);

  return (
    <form action={action} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Datos de la membresía</CardTitle>
          <CardDescription>Usuario de la plataforma, rol dentro del proyecto y estado de la membresía.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {!users.length ? (
            <Alert className="border-warning/30 bg-warning/10">
              <AlertTitle>No hay usuarios disponibles</AlertTitle>
              <AlertDescription>
                No se pudo cargar el listado de usuarios de la plataforma. No es posible reasignar el usuario hasta que exista al menos una opción.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="userId">
                Usuario de la plataforma <span className="text-destructive">*</span>
              </label>
              <select
                className={selectClassName}
                defaultValue={member.userId ?? ""}
                disabled={!users.length}
                id="userId"
                name="userId"
                required
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="role">
                Rol en el proyecto <span className="text-destructive">*</span>
              </label>
              <select className={selectClassName} defaultValue={member.role} id="role" name="role" required>
                <option value="OWNER">{humanizeProjectMemberRole("OWNER")}</option>
                <option value="ADMIN">{humanizeProjectMemberRole("ADMIN")}</option>
                <option value="MARKETING">{humanizeProjectMemberRole("MARKETING")}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="isActive">
                Estado en el proyecto <span className="text-destructive">*</span>
              </label>
              <select
                className={selectClassName}
                defaultValue={member.isActive === false ? "false" : "true"}
                id="isActive"
                name="isActive"
                required
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-2 border-t pt-5">
          <ProjectMemberFormFooter
            cancelHref={`/dashboard/projects/${projectId}/members`}
            submitDisabled={!users.length}
          />
        </CardFooter>
      </Card>
    </form>
  );
}
