"use server";

import { isAxiosError } from "axios";

import baseAxios from "../baseAxios";
import type { ActionResponse } from "../types";
import type { DataResponse, ProjectMember } from "./types";
import { parseApiError } from "@/utils/helpers/parse-api-error";

export default async function getProjectMembers(projectId: string): ActionResponse<ProjectMember[]> {
  try {
    const response = await baseAxios.get<DataResponse<ProjectMember>>(`/admin/projects/${projectId}/members`);

    return {
      status: "success",
      data: response.data.data ?? [],
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
