"use server";

import { redirect } from "next/navigation";

import { getSession } from "@/app/actions/auth";

import getProjectMembers from "./get-project-members";

/**
 * Solo pueden gestionar miembros del proyecto los SUPER_ADMIN de plataforma
 * o usuarios con rol de proyecto OWNER o ADMIN (misma regla que `ProjectAccessMode.MANAGE` en el API).
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
