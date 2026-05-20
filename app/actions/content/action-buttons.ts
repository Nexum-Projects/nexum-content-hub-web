"use server";

import { revalidatePath } from "next/cache";
import { isAxiosError } from "axios";

import baseAxios from "../baseAxios";
import type { ActionResponse } from "../types";
import type { ActionButton } from "./types";
import { parseApiError } from "@/utils/helpers/parse-api-error";

export type ActionButtonWritePayload = {
  type: ActionButton["type"];
  value: string;
  isActive?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
};

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

function revalidate(projectId: string, buttonId?: string) {
  revalidatePath(`/dashboard/projects/${projectId}/action-buttons`);
  revalidatePath(`/dashboard/projects/${projectId}/action-buttons/order`);
  if (buttonId) {
    revalidatePath(`/dashboard/projects/${projectId}/action-buttons/${buttonId}`);
  }
}

export async function createActionButton(projectId: string, payload: ActionButtonWritePayload): ActionResponse<ActionButton> {
  try {
    const response = await baseAxios.post<{ data: ActionButton }>(`/admin/projects/${projectId}/action-buttons`, payload);
    revalidate(projectId);
    return { status: "success", data: response.data.data };
  } catch (error) {
    return mutationError<ActionButton>(error);
  }
}

export async function updateActionButton(projectId: string, buttonId: string, payload: ActionButtonWritePayload): ActionResponse<ActionButton> {
  try {
    const response = await baseAxios.put<{ data: ActionButton }>(`/admin/projects/${projectId}/action-buttons/${buttonId}`, payload);
    revalidate(projectId, buttonId);
    return { status: "success", data: response.data.data };
  } catch (error) {
    return mutationError<ActionButton>(error);
  }
}

export async function publishActionButton(projectId: string, buttonId: string): ActionResponse<ActionButton> {
  try {
    const response = await baseAxios.put<{ data: ActionButton }>(`/admin/projects/${projectId}/action-buttons/${buttonId}/publish`);
    revalidate(projectId, buttonId);
    return { status: "success", data: response.data.data };
  } catch (error) {
    return mutationError<ActionButton>(error);
  }
}

export async function unpublishActionButton(projectId: string, buttonId: string): ActionResponse<ActionButton> {
  try {
    const response = await baseAxios.put<{ data: ActionButton }>(`/admin/projects/${projectId}/action-buttons/${buttonId}/unpublish`);
    revalidate(projectId, buttonId);
    return { status: "success", data: response.data.data };
  } catch (error) {
    return mutationError<ActionButton>(error);
  }
}

export async function deactivateActionButton(projectId: string, buttonId: string): ActionResponse<ActionButton> {
  try {
    const response = await baseAxios.delete<{ data: ActionButton }>(`/admin/projects/${projectId}/action-buttons/${buttonId}`);
    revalidate(projectId, buttonId);
    return { status: "success", data: response.data.data };
  } catch (error) {
    return mutationError<ActionButton>(error);
  }
}
