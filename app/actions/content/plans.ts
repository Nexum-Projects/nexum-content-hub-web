"use server";

import { revalidatePath } from "next/cache";
import { isAxiosError } from "axios";

import baseAxios from "../baseAxios";
import type { ActionResponse } from "../types";
import type { Plan, PlanPayload } from "./types";
import type { CmsResource } from "@/lib/cms-resources";
import { parseApiError } from "@/utils/helpers/parse-api-error";

const PLANS_PATH = "/dashboard/admin/plans";

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

/** Planes activos (solo SUPER_ADMIN). */
export async function getPlans(): ActionResponse<Plan[]> {
  try {
    const response = await baseAxios.get<{ data?: Plan[] }>("/admin/plans");
    return { status: "success", data: response.data.data ?? [] };
  } catch (error) {
    return mutationError<Plan[]>(error);
  }
}

export async function getPlan(planId: string): ActionResponse<Plan> {
  try {
    const response = await baseAxios.get<{ data: Plan }>(`/admin/plans/${planId}`);
    return { status: "success", data: response.data.data };
  } catch (error) {
    return mutationError<Plan>(error);
  }
}

/** Catálogo de recursos que un plan puede habilitar. */
export async function getCmsResources(): ActionResponse<CmsResource[]> {
  try {
    const response = await baseAxios.get<{ data?: CmsResource[] }>("/admin/resources");
    return { status: "success", data: response.data.data ?? [] };
  } catch (error) {
    return mutationError<CmsResource[]>(error);
  }
}

export async function createPlan(payload: PlanPayload): ActionResponse<null> {
  try {
    await baseAxios.post("/admin/plans", payload);
    revalidatePath(PLANS_PATH);
    return { status: "success", data: null };
  } catch (error) {
    return mutationError<null>(error);
  }
}

export async function updatePlan(planId: string, payload: PlanPayload): ActionResponse<null> {
  try {
    await baseAxios.put(`/admin/plans/${planId}`, payload);
    revalidatePath(PLANS_PATH);
    revalidatePath(`${PLANS_PATH}/${planId}/edit`);
    return { status: "success", data: null };
  } catch (error) {
    return mutationError<null>(error);
  }
}

/** Borrado lógico; el API responde 409 si un proyecto activo usa el plan. */
export async function deletePlan(planId: string): ActionResponse<null> {
  try {
    await baseAxios.delete(`/admin/plans/${planId}`);
    revalidatePath(PLANS_PATH);
    return { status: "success", data: null };
  } catch (error) {
    return mutationError<null>(error);
  }
}
