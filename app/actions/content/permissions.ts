"use server";

import { revalidatePath } from "next/cache";
import { isAxiosError } from "axios";

import baseAxios from "../baseAxios";
import type { ActionResponse } from "../types";
import type { ResourcePermissions } from "@/lib/cms-resources";
import { parseApiError } from "@/utils/helpers/parse-api-error";

function mutationError<T>(error: unknown): Extract<Awaited<ActionResponse<T>>, { status: "error" }> {
  if (isAxiosError(error) && error.response) {
    const humanizedError = parseApiError(error.response.data);
    return {
      status: "error",
      errors: [
        {
          title: humanizedError.title,
          message: humanizedError.description,
          statusCode: error.response.status,
        },
      ],
    };
  }

  const humanizedError = parseApiError(error);
  return {
    status: "error",
    errors: [{ title: humanizedError.title, message: humanizedError.description }],
  };
}

/** Permisos efectivos del usuario en el proyecto; owner y super admin reciben todo el plan en `WRITE`. */
export async function getMyPermissions(projectId: string): ActionResponse<ResourcePermissions> {
  try {
    const response = await baseAxios.get<{ data: ResourcePermissions }>(`/admin/projects/${projectId}/me/permissions`);
    return { status: "success", data: response.data.data ?? {} };
  } catch (error) {
    return mutationError<ResourcePermissions>(error);
  }
}

export async function getMemberPermissions(projectId: string, memberId: string): ActionResponse<ResourcePermissions> {
  try {
    const response = await baseAxios.get<{ data: ResourcePermissions }>(
      `/admin/projects/${projectId}/members/${memberId}/permissions`,
    );
    return { status: "success", data: response.data.data ?? {} };
  } catch (error) {
    return mutationError<ResourcePermissions>(error);
  }
}

/** Reemplaza todos los permisos del miembro (los recursos ausentes quedan sin acceso). */
export async function replaceMemberPermissions(
  projectId: string,
  memberId: string,
  permissions: ResourcePermissions,
): ActionResponse<null> {
  try {
    await baseAxios.put(`/admin/projects/${projectId}/members/${memberId}/permissions`, { permissions });
    revalidatePath(`/dashboard/projects/${projectId}/members/${memberId}`);
    revalidatePath(`/dashboard/projects/${projectId}/members/${memberId}/edit`);
    return { status: "success", data: null };
  } catch (error) {
    return mutationError<null>(error);
  }
}
