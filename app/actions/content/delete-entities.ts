"use server";

import { revalidatePath } from "next/cache";
import { isAxiosError } from "axios";

import baseAxios from "../baseAxios";
import { Storage } from "../storage";
import type { ActionResponse } from "../types";
import { parseApiError } from "@/utils/helpers/parse-api-error";

type StorageBackedResource = {
  imageUrl?: string | null;
  avatarUrl?: string | null;
  avatar_url?: string | null;
};

async function removeStorageObjectByUrl(url?: string | null) {
  if (!url) {
    return;
  }

  try {
    await Storage.removeByPublicUrl(url);
  } catch (error) {
    console.warn("No se pudo eliminar el archivo de Supabase Storage.", error);
  }
}

export async function deleteBanner(projectId: string, bannerId: string): ActionResponse<null> {
  try {
    const response = await baseAxios.delete<{ data?: StorageBackedResource }>(`/admin/projects/${projectId}/banners/${bannerId}`);
    await removeStorageObjectByUrl(response.data.data?.imageUrl);
    revalidatePath(`/dashboard/projects/${projectId}/banners`);
    return { status: "success", data: null };
  } catch (error) {
    return errorDeleteResponse(error);
  }
}

export async function deleteMenuProduct(projectId: string, productId: string): ActionResponse<null> {
  try {
    const response = await baseAxios.delete<{ data?: StorageBackedResource }>(`/admin/projects/${projectId}/menu-products/${productId}`);
    await removeStorageObjectByUrl(response.data.data?.imageUrl);
    revalidatePath(`/dashboard/projects/${projectId}/products`);
    return { status: "success", data: null };
  } catch (error) {
    return errorDeleteResponse(error);
  }
}

export async function deleteEvent(projectId: string, eventId: string): ActionResponse<null> {
  try {
    const response = await baseAxios.delete<{ data?: StorageBackedResource }>(`/admin/projects/${projectId}/events/${eventId}`);
    await removeStorageObjectByUrl(response.data.data?.imageUrl);
    revalidatePath(`/dashboard/projects/${projectId}/events`);
    return { status: "success", data: null };
  } catch (error) {
    return errorDeleteResponse(error);
  }
}

export async function deleteAward(projectId: string, awardId: string): ActionResponse<null> {
  try {
    const response = await baseAxios.delete<{ data?: StorageBackedResource }>(`/admin/projects/${projectId}/awards/${awardId}`);
    await removeStorageObjectByUrl(response.data.data?.imageUrl);
    revalidatePath(`/dashboard/projects/${projectId}/awards`);
    return { status: "success", data: null };
  } catch (error) {
    return errorDeleteResponse(error);
  }
}

export async function deleteUser(userId: string): ActionResponse<null> {
  try {
    const response = await baseAxios.delete<{ data?: StorageBackedResource }>(`/admin/users/${userId}`);
    const user = response.data.data;
    await removeStorageObjectByUrl(user?.avatarUrl ?? user?.avatar_url);
    revalidatePath("/dashboard/admin/users");
    revalidatePath(`/dashboard/admin/users/${userId}`);
    return { status: "success", data: null };
  } catch (error) {
    return errorDeleteResponse(error);
  }
}

export async function deleteProjectMember(projectId: string, memberId: string): ActionResponse<null> {
  try {
    await baseAxios.delete(`/admin/projects/${projectId}/members/${memberId}`);
    revalidatePath(`/dashboard/projects/${projectId}/members`);
    revalidatePath(`/dashboard/projects/${projectId}/members/${memberId}`);
    return { status: "success", data: null };
  } catch (error) {
    return errorDeleteResponse(error);
  }
}

function errorDeleteResponse(error: unknown): Extract<Awaited<ActionResponse<null>>, { status: "error" }> {
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
