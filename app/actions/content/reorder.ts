"use server";

import { revalidatePath } from "next/cache";
import { isAxiosError } from "axios";

import baseAxios from "../baseAxios";
import type { ActionResponse } from "../types";
import { parseApiError } from "@/utils/helpers/parse-api-error";

type ReorderItem = {
  id: string;
  sortOrder: number;
};

async function reorder(url: string, items: ReorderItem[]): ActionResponse<null> {
  try {
    await baseAxios.put(url, { items });

    return {
      status: "success",
      data: null,
    };
  } catch (error) {
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
}

export async function reorderMenuProducts(projectId: string, items: ReorderItem[]): ActionResponse<null> {
  const result = await reorder(`/admin/projects/${projectId}/menu-products/reorder`, items);

  if (result.status === "success") {
    revalidatePath(`/dashboard/projects/${projectId}/products`);
    revalidatePath(`/dashboard/projects/${projectId}/products/order`);
  }

  return result;
}

export async function reorderEvents(projectId: string, items: ReorderItem[]): ActionResponse<null> {
  const result = await reorder(`/admin/projects/${projectId}/events/reorder`, items);

  if (result.status === "success") {
    revalidatePath(`/dashboard/projects/${projectId}/events`);
    revalidatePath(`/dashboard/projects/${projectId}/events/order`);
  }

  return result;
}

export async function reorderAwards(projectId: string, items: ReorderItem[]): ActionResponse<null> {
  const result = await reorder(`/admin/projects/${projectId}/awards/reorder`, items);

  if (result.status === "success") {
    revalidatePath(`/dashboard/projects/${projectId}/awards`);
    revalidatePath(`/dashboard/projects/${projectId}/awards/order`);
  }

  return result;
}

export async function reorderBanners(projectId: string, items: ReorderItem[]): ActionResponse<null> {
  const result = await reorder(`/admin/projects/${projectId}/banners/reorder`, items);

  if (result.status === "success") {
    revalidatePath(`/dashboard/projects/${projectId}/banners`);
    revalidatePath(`/dashboard/projects/${projectId}/banners/order`);
  }

  return result;
}

export async function reorderMedia(projectId: string, items: ReorderItem[]): ActionResponse<null> {
  const result = await reorder(`/admin/projects/${projectId}/media/reorder`, items);

  if (result.status === "success") {
    revalidatePath(`/dashboard/projects/${projectId}/media`);
    revalidatePath(`/dashboard/projects/${projectId}/media/order`);
  }

  return result;
}

export async function reorderActionButtons(projectId: string, items: ReorderItem[]): ActionResponse<null> {
  const result = await reorder(`/admin/projects/${projectId}/action-buttons/reorder`, items);

  if (result.status === "success") {
    revalidatePath(`/dashboard/projects/${projectId}/action-buttons`);
    revalidatePath(`/dashboard/projects/${projectId}/action-buttons/order`);
  }

  return result;
}
