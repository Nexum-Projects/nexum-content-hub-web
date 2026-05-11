"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import baseAxios from "../baseAxios";
import type { ProjectMemberRole } from "./types";

function asString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export async function updateProjectMember(projectId: string, memberId: string, formData: FormData) {
  const userId = asString(formData, "userId");
  const role = asString(formData, "role") as ProjectMemberRole | undefined;
  const isActiveRaw = asString(formData, "isActive");

  if (!userId || !role) {
    redirect(`/dashboard/projects/${projectId}/members/${memberId}/edit`);
  }

  const isActive = isActiveRaw !== "false";

  await baseAxios.put(`/admin/projects/${projectId}/members/${memberId}`, {
    userId,
    role,
    isActive,
  });

  revalidatePath(`/dashboard/projects/${projectId}/members`);
  revalidatePath(`/dashboard/projects/${projectId}/members/${memberId}`);
  redirect(`/dashboard/projects/${projectId}/members/${memberId}`);
}
