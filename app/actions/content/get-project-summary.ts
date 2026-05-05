"use server";

import { isAxiosError } from "axios";

import baseAxios from "../baseAxios";
import type { ActionResponse } from "../types";
import type { Project } from "./types";
import { parseApiError } from "@/utils/helpers/parse-api-error";

export type ProjectSummary = Pick<Project, "id" | "name"> & {
  avatarUrl?: string | null;
  avatar_url?: string | null;
};

export default async function getProjectSummary(projectId: string): ActionResponse<ProjectSummary> {
  try {
    const response = await baseAxios.get<{ data: Project }>(`/admin/projects/${projectId}`);

    const p = response.data.data;
    return {
      status: "success",
      data: {
        id: p.id,
        name: p.name,
        avatarUrl: p.avatarUrl,
        avatar_url: p.avatar_url,
      },
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
