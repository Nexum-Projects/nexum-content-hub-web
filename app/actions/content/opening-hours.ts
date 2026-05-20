"use server";

import { revalidatePath } from "next/cache";
import { isAxiosError } from "axios";

import baseAxios from "../baseAxios";
import type { ActionResponse } from "../types";
import type { OpeningHour } from "./types";
import { parseApiError } from "@/utils/helpers/parse-api-error";

export type OpeningHourWritePayload = {
  day: OpeningHour["day"];
  startTime: string;
  endTime: string;
  isActive?: boolean;
  isPublished?: boolean;
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

function revalidate(projectId: string, hourId?: string) {
  revalidatePath(`/dashboard/projects/${projectId}/opening-hours`);
  if (hourId) {
    revalidatePath(`/dashboard/projects/${projectId}/opening-hours/${hourId}`);
  }
}

export async function createOpeningHour(projectId: string, payload: OpeningHourWritePayload): ActionResponse<OpeningHour> {
  try {
    const response = await baseAxios.post<{ data: OpeningHour }>(`/admin/projects/${projectId}/opening-hours`, payload);
    revalidate(projectId);
    return { status: "success", data: response.data.data };
  } catch (error) {
    return mutationError<OpeningHour>(error);
  }
}

export async function updateOpeningHour(projectId: string, hourId: string, payload: OpeningHourWritePayload): ActionResponse<OpeningHour> {
  try {
    const response = await baseAxios.put<{ data: OpeningHour }>(`/admin/projects/${projectId}/opening-hours/${hourId}`, payload);
    revalidate(projectId, hourId);
    return { status: "success", data: response.data.data };
  } catch (error) {
    return mutationError<OpeningHour>(error);
  }
}

export async function publishOpeningHour(projectId: string, hourId: string): ActionResponse<OpeningHour> {
  try {
    const response = await baseAxios.put<{ data: OpeningHour }>(`/admin/projects/${projectId}/opening-hours/${hourId}/publish`);
    revalidate(projectId, hourId);
    return { status: "success", data: response.data.data };
  } catch (error) {
    return mutationError<OpeningHour>(error);
  }
}

export async function unpublishOpeningHour(projectId: string, hourId: string): ActionResponse<OpeningHour> {
  try {
    const response = await baseAxios.put<{ data: OpeningHour }>(`/admin/projects/${projectId}/opening-hours/${hourId}/unpublish`);
    revalidate(projectId, hourId);
    return { status: "success", data: response.data.data };
  } catch (error) {
    return mutationError<OpeningHour>(error);
  }
}

export async function deactivateOpeningHour(projectId: string, hourId: string): ActionResponse<OpeningHour> {
  try {
    const response = await baseAxios.delete<{ data: OpeningHour }>(`/admin/projects/${projectId}/opening-hours/${hourId}`);
    revalidate(projectId, hourId);
    return { status: "success", data: response.data.data };
  } catch (error) {
    return mutationError<OpeningHour>(error);
  }
}
