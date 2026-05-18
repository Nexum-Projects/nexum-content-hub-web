"use server";

import { isAxiosError } from "axios";

import baseAxios from "../baseAxios";
import type { ActionResponse } from "../types";
import { parseApiError } from "@/utils/helpers/parse-api-error";

export type ProjectDashboardSummary = {
  banners: number;
  products: number;
  events: number;
  awards: number;
};

export default async function getProjectDashboardSummary(projectId: string): ActionResponse<ProjectDashboardSummary> {
  try {
    const response = await baseAxios.get<{ data: ProjectDashboardSummary }>(
      `/admin/projects/${projectId}/dashboard/summary`,
    );

    return { status: "success", data: response.data.data };
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
