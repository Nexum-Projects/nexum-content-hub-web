"use client";

import { useMemo } from "react";

import { updateProjectMember } from "@/app/actions/content/update-project-member";
import type { ProjectMember } from "@/app/actions/content/types";
import { ProjectMemberFormFooter } from "@/components/project-members/project-member-form-footer";
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
  userName,
  userEmail,
}: {
  projectId: string;
  member: ProjectMember;
  userName: string;
  userEmail?: string;
}) {
  const action = useMemo(() => updateProjectMember.bind(null, projectId, member.id), [projectId, member.id]);

  return (
    <form action={action} className="space-y-4">
      {member.userId ? <input name="userId" type="hidden" value={member.userId} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Rol en el proyecto</CardTitle>
          <CardDescription>El usuario vinculado no se puede cambiar desde aquí.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Usuario</p>
            <p className="text-sm font-semibold">{userName}</p>
            {userEmail?.trim() ? <p className="text-sm text-muted-foreground">{userEmail.trim()}</p> : null}
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
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-2 border-t pt-5">
          <ProjectMemberFormFooter
            cancelHref={`/dashboard/projects/${projectId}/members`}
            submitDisabled={!member.userId}
          />
        </CardFooter>
      </Card>
    </form>
  );
}
