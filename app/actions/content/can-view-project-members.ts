"use server";

import { redirect } from "next/navigation";

import { getSession } from "@/app/actions/auth";

import getProjectMembers from "./get-project-members";

/**
 * Solo pueden gestionar miembros del proyecto los SUPER_ADMIN de plataforma o el OWNER del proyecto
 * (`ProjectAccessMode.MANAGE` en el API). Se decide por el resultado de `GET /members`: al resto le responde 403.
 */
export async function canViewProjectMembers(projectId: string): Promise<boolean> {
  const session = await getSession();
  if (!session) {
    return false;
  }
  if (session.platformRole === "SUPER_ADMIN") {
    return true;
  }
  const res = await getProjectMembers(projectId);
  return res.status === "success";
}

export async function assertCanViewProjectMembers(projectId: string): Promise<void> {
  const ok = await canViewProjectMembers(projectId);
  if (!ok) {
    redirect(`/dashboard/projects/${projectId}`);
  }
}
