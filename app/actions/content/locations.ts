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

const LOG_PREFIX = "[locations-action]";

function logLocationError(step: string, error: unknown, context?: Record<string, unknown>) {
  if (isAxiosError(error)) {
    console.error(LOG_PREFIX, step, {
      ...context,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      response: error.response?.data,
      message: error.message,
    });
    return;
  }

  console.error(LOG_PREFIX, step, {
    ...context,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}

function mutationError<T>(error: unknown, step: string, context?: Record<string, unknown>): Extract<Awaited<ActionResponse<T>>, { status: "error" }> {
  logLocationError(step, error, context);

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

function summarizeFormData(formData: FormData) {
  const imageFile = formData.get("imageFile");
  return {
    title: asString(formData, "title"),
    hasDescription: Boolean(asString(formData, "description")),
    hasImage: imageFile instanceof File && imageFile.size > 0,
    imageSize: imageFile instanceof File ? imageFile.size : 0,
    latitude: asNumber(formData, "latitude"),
    longitude: asNumber(formData, "longitude"),
    hasFullAddress: Boolean(asString(formData, "fullAddress")),
    isPublished: asBoolean(formData, "isPublished"),
  };
}

function safeRevalidate(projectId: string, locationId?: string) {
  try {
    revalidate(projectId, locationId);
  } catch (error) {
    console.warn(LOG_PREFIX, "revalidate failed", { projectId, locationId, error });
  }
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
  const summary = summarizeFormData(formData);
  console.info(LOG_PREFIX, "create:start", { projectId, ...summary });

  try {
    let imageUrl: string | null = null;
    try {
      imageUrl = (await uploadLocationImage(projectId, formData)) ?? null;
      console.info(LOG_PREFIX, "create:image", { projectId, uploaded: Boolean(imageUrl) });
    } catch (error) {
      return mutationError<ProjectLocation>(error, "create:image-upload", { projectId, ...summary });
    }

    const payload = buildPayload(formData, imageUrl);
    console.info(LOG_PREFIX, "create:payload", {
      projectId,
      title: payload.title,
      hasImage: Boolean(payload.imageUrl),
      latitude: payload.latitude,
      longitude: payload.longitude,
      isPublished: payload.isPublished,
    });

    const response = await baseAxios.post<{ data: ProjectLocation }>(`/admin/projects/${projectId}/locations`, payload);
    const location = response.data?.data;

    if (!location?.id) {
      console.error(LOG_PREFIX, "create:invalid-response", {
        projectId,
        status: response.status,
        body: response.data,
      });
      return {
        status: "error",
        errors: [
          {
            title: "Respuesta invalida del API",
            message: "El servidor no devolvio la ubicacion creada. Revisa los logs del backend.",
            statusCode: response.status,
          },
        ],
      };
    }

    console.info(LOG_PREFIX, "create:success", { projectId, locationId: location.id });
    safeRevalidate(projectId);
    return { status: "success", data: location };
  } catch (error) {
    return mutationError<ProjectLocation>(error, "create", { projectId, ...summary });
  }
}

export async function updateLocationFromForm(
  projectId: string,
  locationId: string,
  formData: FormData,
): ActionResponse<ProjectLocation> {
  const summary = summarizeFormData(formData);
  console.info(LOG_PREFIX, "update:start", { projectId, locationId, ...summary });

  try {
    const previousImageUrl = asString(formData, "previousImageUrl") ?? null;
    const nextUploadedImageUrl = await uploadLocationImage(projectId, formData);
    const removeImage = asBoolean(formData, "removeImage");
    const imageUrl = removeImage ? null : nextUploadedImageUrl ?? previousImageUrl;
    const payload = buildPayload(formData, imageUrl);
    const response = await baseAxios.put<{ data: ProjectLocation }>(`/admin/projects/${projectId}/locations/${locationId}`, payload);
    const location = response.data?.data;

    if (!location?.id) {
      console.error(LOG_PREFIX, "update:invalid-response", {
        projectId,
        locationId,
        status: response.status,
        body: response.data,
      });
      return {
        status: "error",
        errors: [
          {
            title: "Respuesta invalida del API",
            message: "El servidor no devolvio la ubicacion actualizada.",
            statusCode: response.status,
          },
        ],
      };
    }

    if ((removeImage || nextUploadedImageUrl) && previousImageUrl) {
      await removeStorageImage(previousImageUrl);
    }

    console.info(LOG_PREFIX, "update:success", { projectId, locationId: location.id });
    safeRevalidate(projectId, locationId);
    return { status: "success", data: location };
  } catch (error) {
    return mutationError<ProjectLocation>(error, "update", { projectId, locationId, ...summary });
  }
}

export async function publishLocation(projectId: string, locationId: string): ActionResponse<ProjectLocation> {
  try {
    const response = await baseAxios.put<{ data: ProjectLocation }>(`/admin/projects/${projectId}/locations/${locationId}/publish`);
    safeRevalidate(projectId, locationId);
    return { status: "success", data: response.data.data };
  } catch (error) {
    return mutationError<ProjectLocation>(error, "publish", { projectId, locationId });
  }
}

export async function unpublishLocation(projectId: string, locationId: string): ActionResponse<ProjectLocation> {
  try {
    const response = await baseAxios.put<{ data: ProjectLocation }>(`/admin/projects/${projectId}/locations/${locationId}/unpublish`);
    safeRevalidate(projectId, locationId);
    return { status: "success", data: response.data.data };
  } catch (error) {
    return mutationError<ProjectLocation>(error, "unpublish", { projectId, locationId });
  }
}

export async function deactivateLocation(projectId: string, locationId: string): ActionResponse<ProjectLocation> {
  try {
    const response = await baseAxios.delete<{ data: ProjectLocation }>(`/admin/projects/${projectId}/locations/${locationId}`);
    await removeStorageImage(response.data.data.imageUrl);
    safeRevalidate(projectId, locationId);
    return { status: "success", data: response.data.data };
  } catch (error) {
    return mutationError<ProjectLocation>(error, "deactivate", { projectId, locationId });
  }
}
