"use server";

import { revalidatePath } from "next/cache";
import { isAxiosError } from "axios";

import baseAxios from "../baseAxios";
import { Storage } from "../storage";
import type { ActionResponse } from "../types";
import type { ProjectLocation } from "./types";
import { parseApiError } from "@/utils/helpers/parse-api-error";

const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function asString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function asNumber(formData: FormData, key: string) {
  const value = asString(formData, key);
  if (!value) {
    return undefined;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

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

function validateLocationImage(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const allowedByExt = ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp";
  const allowedByType = IMAGE_MIME_TYPES.has(file.type);

  if (!allowedByExt && !allowedByType) {
    throw new Error("La imagen debe ser JPG, PNG o WEBP.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("La imagen no debe superar 5MB.");
  }
}

async function uploadLocationImage(projectId: string, formData: FormData) {
  const file = formData.get("imageFile");
  if (!(file instanceof File) || !file.name || file.size === 0) {
    return undefined;
  }

  validateLocationImage(file);
  const { path } = await Storage.upload({
    file,
    folder: "LOCATIONS",
    name: asString(formData, "title") ?? file.name,
    subFolder: projectId,
  });
  const { publicUrl } = await Storage.getPublicUrl(path);
  return publicUrl;
}

async function removeStorageImage(publicUrl?: string | null) {
  if (!publicUrl) {
    return;
  }

  try {
    await Storage.removeByPublicUrl(publicUrl);
  } catch (error) {
    console.warn("No se pudo eliminar la imagen de ubicacion en Supabase Storage.", error);
  }
}

function buildPayload(formData: FormData, imageUrl: string | null | undefined) {
  const title = asString(formData, "title");
  const latitude = asNumber(formData, "latitude");
  const longitude = asNumber(formData, "longitude");
  const fullAddress = asString(formData, "fullAddress");

  if (!title) {
    throw new Error("Ingresa el titulo de la ubicacion.");
  }
  if (latitude === undefined || longitude === undefined || !fullAddress) {
    throw new Error("Selecciona una ubicacion valida en el mapa.");
  }

  return {
    title,
    description: asString(formData, "description") ?? null,
    imageUrl,
    latitude,
    longitude,
    fullAddress,
    isActive: true,
    isPublished: asBoolean(formData, "isPublished"),
  };
}

function revalidate(projectId: string, locationId?: string) {
  revalidatePath(`/dashboard/projects/${projectId}/locations`);
  revalidatePath(`/dashboard/projects/${projectId}/locations/order`);
  if (locationId) {
    revalidatePath(`/dashboard/projects/${projectId}/locations/${locationId}`);
  }
}

export async function createLocationFromForm(projectId: string, formData: FormData): ActionResponse<ProjectLocation> {
  try {
    const imageUrl = (await uploadLocationImage(projectId, formData)) ?? null;
    const payload = buildPayload(formData, imageUrl);
    const response = await baseAxios.post<{ data: ProjectLocation }>(`/admin/projects/${projectId}/locations`, payload);

    revalidate(projectId);
    return { status: "success", data: response.data.data };
  } catch (error) {
    return mutationError<ProjectLocation>(error);
  }
}

export async function updateLocationFromForm(
  projectId: string,
  locationId: string,
  formData: FormData,
): ActionResponse<ProjectLocation> {
  try {
    const previousImageUrl = asString(formData, "previousImageUrl") ?? null;
    const nextUploadedImageUrl = await uploadLocationImage(projectId, formData);
    const removeImage = asBoolean(formData, "removeImage");
    const imageUrl = removeImage ? null : nextUploadedImageUrl ?? previousImageUrl;
    const payload = buildPayload(formData, imageUrl);
    const response = await baseAxios.put<{ data: ProjectLocation }>(`/admin/projects/${projectId}/locations/${locationId}`, payload);

    if ((removeImage || nextUploadedImageUrl) && previousImageUrl) {
      await removeStorageImage(previousImageUrl);
    }

    revalidate(projectId, locationId);
    return { status: "success", data: response.data.data };
  } catch (error) {
    return mutationError<ProjectLocation>(error);
  }
}

export async function publishLocation(projectId: string, locationId: string): ActionResponse<ProjectLocation> {
  try {
    const response = await baseAxios.put<{ data: ProjectLocation }>(`/admin/projects/${projectId}/locations/${locationId}/publish`);
    revalidate(projectId, locationId);
    return { status: "success", data: response.data.data };
  } catch (error) {
    return mutationError<ProjectLocation>(error);
  }
}

export async function unpublishLocation(projectId: string, locationId: string): ActionResponse<ProjectLocation> {
  try {
    const response = await baseAxios.put<{ data: ProjectLocation }>(`/admin/projects/${projectId}/locations/${locationId}/unpublish`);
    revalidate(projectId, locationId);
    return { status: "success", data: response.data.data };
  } catch (error) {
    return mutationError<ProjectLocation>(error);
  }
}

export async function deactivateLocation(projectId: string, locationId: string): ActionResponse<ProjectLocation> {
  try {
    const response = await baseAxios.delete<{ data: ProjectLocation }>(`/admin/projects/${projectId}/locations/${locationId}`);
    await removeStorageImage(response.data.data.imageUrl);
    revalidate(projectId, locationId);
    return { status: "success", data: response.data.data };
  } catch (error) {
    return mutationError<ProjectLocation>(error);
  }
}
