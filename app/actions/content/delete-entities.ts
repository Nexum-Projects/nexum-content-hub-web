"use server";

import { revalidatePath } from "next/cache";
import { isAxiosError } from "axios";

import baseAxios from "../baseAxios";
import type { ActionResponse } from "../types";
import { parseApiError } from "@/utils/helpers/parse-api-error";

export async function deleteBanner(projectId: string, bannerId: string): ActionResponse<null> {
  try {
    await baseAxios.delete(`/admin/projects/${projectId}/banners/${bannerId}`);
    revalidatePath(`/dashboard/projects/${projectId}/banners`);
    return { status: "success", data: null };
  } catch (error) {
    return errorDeleteResponse(error);
  }
}

export async function deleteMenuProduct(projectId: string, productId: string): ActionResponse<null> {
  try {
    await baseAxios.delete(`/admin/projects/${projectId}/menu-products/${productId}`);
    revalidatePath(`/dashboard/projects/${projectId}/products`);
    return { status: "success", data: null };
  } catch (error) {
    return errorDeleteResponse(error);
  }
}

export async function deleteEvent(projectId: string, eventId: string): ActionResponse<null> {
  try {
    await baseAxios.delete(`/admin/projects/${projectId}/events/${eventId}`);
    revalidatePath(`/dashboard/projects/${projectId}/events`);
    return { status: "success", data: null };
  } catch (error) {
    return errorDeleteResponse(error);
  }
}

export async function deleteAward(projectId: string, awardId: string): ActionResponse<null> {
  try {
    await baseAxios.delete(`/admin/projects/${projectId}/awards/${awardId}`);
    revalidatePath(`/dashboard/projects/${projectId}/awards`);
    return { status: "success", data: null };
  } catch (error) {
    return errorDeleteResponse(error);
  }
}

export async function deleteUser(userId: string): ActionResponse<null> {
  try {
    await baseAxios.delete(`/admin/users/${userId}`);
    revalidatePath("/dashboard/admin/users");
    revalidatePath(`/dashboard/admin/users/${userId}`);
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
