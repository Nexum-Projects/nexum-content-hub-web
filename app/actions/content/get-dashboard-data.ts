"use server";

import { isAxiosError } from "axios";

import baseAxios from "../baseAxios";
import type { ActionResponse } from "../types";
import type { Award, Banner, DashboardData, DataResponse, EventItem, MenuProduct, Project } from "./types";
import { parseApiError } from "@/utils/helpers/parse-api-error";

async function list<T>(url: string) {
  const response = await baseAxios.get<DataResponse<T>>(url, {
    params: {
      pagination: false,
    },
  });

  return response.data.data ?? [];
}

export default async function getDashboardData(): ActionResponse<DashboardData> {
  try {
    const projects = await list<Project>("/admin/projects");
    const selectedProject = projects[0] ?? null;

    if (!selectedProject) {
      return {
        status: "success",
        data: {
          projects,
          selectedProject,
          banners: [],
          products: [],
          events: [],
          awards: [],
        },
      };
    }

    const [banners, products, events, awards] = await Promise.all([
      list<Banner>(`/admin/projects/${selectedProject.id}/banners`),
      list<MenuProduct>(`/admin/projects/${selectedProject.id}/menu-products`),
      list<EventItem>(`/admin/projects/${selectedProject.id}/events`),
      list<Award>(`/admin/projects/${selectedProject.id}/awards`),
    ]);

    return {
      status: "success",
      data: {
        projects,
        selectedProject,
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
