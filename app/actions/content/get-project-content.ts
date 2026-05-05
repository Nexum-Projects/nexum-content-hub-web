"use server";

import { isAxiosError } from "axios";

import baseAxios from "../baseAxios";
import type { ActionResponse } from "../types";
import type { Award, Banner, DashboardData, DataResponse, EventItem, MenuProduct, Project } from "./types";
import { parseApiError } from "@/utils/helpers/parse-api-error";

async function list<T>(url: string) {
  const response = await baseAxios.get<DataResponse<T>>(url, {
    params: { pagination: false },
  });

  return response.data.data ?? [];
}

export default async function getProjectContent(projectId: string): ActionResponse<DashboardData> {
  try {
    const [projectResponse, banners, products, events, awards] = await Promise.all([
      baseAxios.get<{ data: Project }>(`/admin/projects/${projectId}`),
      list<Banner>(`/admin/projects/${projectId}/banners`),
      list<MenuProduct>(`/admin/projects/${projectId}/menu-products`),
      list<EventItem>(`/admin/projects/${projectId}/events`),
      list<Award>(`/admin/projects/${projectId}/awards`),
    ]);

    return {
      status: "success",
      data: {
        projects: [projectResponse.data.data],
        selectedProject: projectResponse.data.data,
        banners,
        products,
        events,
        awards,
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
