"use server";

import { isAxiosError } from "axios";

import baseAxios from "../baseAxios";
import type { ActionResponse } from "../types";
import type { Award, Banner, EventItem, MenuProduct, ProjectLocation, ProjectMember, User } from "./types";
import { parseApiError } from "@/utils/helpers/parse-api-error";

async function getDetail<T>(url: string): ActionResponse<T> {
  try {
    const response = await baseAxios.get<{ data: T }>(url);
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

export async function getBannerDetail(projectId: string, bannerId: string): ActionResponse<Banner> {
  return getDetail<Banner>(`/admin/projects/${projectId}/banners/${bannerId}`);
}

export async function getMenuProductDetail(projectId: string, productId: string): ActionResponse<MenuProduct> {
  return getDetail<MenuProduct>(`/admin/projects/${projectId}/menu-products/${productId}`);
}

export async function getEventDetail(projectId: string, eventId: string): ActionResponse<EventItem> {
  return getDetail<EventItem>(`/admin/projects/${projectId}/events/${eventId}`);
}

export async function getAwardDetail(projectId: string, awardId: string): ActionResponse<Award> {
  return getDetail<Award>(`/admin/projects/${projectId}/awards/${awardId}`);
}

export async function getLocationDetail(projectId: string, locationId: string): ActionResponse<ProjectLocation> {
  return getDetail<ProjectLocation>(`/admin/projects/${projectId}/locations/${locationId}`);
}

export async function getUserDetail(userId: string): ActionResponse<User> {
  return getDetail<User>(`/admin/users/${userId}`);
}

export async function getProjectMemberDetail(projectId: string, memberId: string): ActionResponse<ProjectMember> {
  return getDetail<ProjectMember>(`/admin/projects/${projectId}/members/${memberId}`);
}
