"use server";

import { revalidatePath } from "next/cache";
import { isAxiosError } from "axios";

import baseAxios from "../baseAxios";
import type { ActionResponse } from "../types";
import type { ProductCategory } from "./types";
import { parseApiError } from "@/utils/helpers/parse-api-error";
import type { MenuProductType, MenuSection } from "@/lib/menu-product-type";

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

function categoriesPath(projectId: string) {
  return `/dashboard/projects/${projectId}/categories`;
}

export async function fetchProductCategories(
  projectId: string,
  catalogKind?: MenuProductType,
): ActionResponse<ProductCategory[]> {
  try {
    const response = await baseAxios.get<{ data?: ProductCategory[] }>(
      `/admin/projects/${projectId}/product-categories`,
      {
        params: {
          pagination: false,
          orderBy: "sortOrder",
          order: "ASC",
          ...(catalogKind ? { catalogKind } : {}),
        },
      },
    );
    return { status: "success", data: response.data.data ?? [] };
  } catch (error) {
    return mutationError<ProductCategory[]>(error);
  }
}

export async function getProductCategoryDetail(
  projectId: string,
  categoryId: string,
): ActionResponse<ProductCategory> {
  try {
    const response = await baseAxios.get<{ data: ProductCategory }>(
      `/admin/projects/${projectId}/product-categories/${categoryId}`,
    );
    return { status: "success", data: response.data.data };
  } catch (error) {
    return mutationError<ProductCategory>(error);
  }
}

type CategoryPayload = {
  name: string;
  catalogKind: MenuProductType;
  menuSection?: MenuSection | null;
  description?: string | null;
  isPublished?: boolean;
};

export async function createProductCategory(
  projectId: string,
  payload: CategoryPayload,
): ActionResponse<null> {
  try {
    await baseAxios.post(`/admin/projects/${projectId}/product-categories`, payload);
    revalidatePath(categoriesPath(projectId));
    revalidatePath(`/dashboard/projects/${projectId}/products`);
    return { status: "success", data: null };
  } catch (error) {
    return mutationError<null>(error);
  }
}

export async function updateProductCategory(
  projectId: string,
  categoryId: string,
  payload: CategoryPayload,
): ActionResponse<null> {
  try {
    await baseAxios.put(`/admin/projects/${projectId}/product-categories/${categoryId}`, payload);
    revalidatePath(categoriesPath(projectId));
    revalidatePath(`${categoriesPath(projectId)}/${categoryId}/edit`);
    revalidatePath(`/dashboard/projects/${projectId}/products`);
    return { status: "success", data: null };
  } catch (error) {
    return mutationError<null>(error);
  }
}
