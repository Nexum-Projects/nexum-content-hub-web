"use server";

import { revalidatePath } from "next/cache";
import { isAxiosError } from "axios";

import baseAxios from "../baseAxios";
import type { ActionResponse } from "../types";
import { Storage } from "../storage";
import type { MediaItem } from "./types";
import { parseApiError } from "@/utils/helpers/parse-api-error";
import { MAX_SERVER_ACTION_IMAGE_BYTES, MAX_SERVER_ACTION_IMAGE_LABEL } from "@/lib/upload-limits";

type MediaType = MediaItem["type"];

const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function asString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function mediaErrorResponse<T>(error: unknown): Extract<Awaited<ActionResponse<T>>, { status: "error" }> {
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

function validateMediaImage(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const allowedByExt = ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp";
  const allowedByType = IMAGE_MIME_TYPES.has(file.type);

  if (!allowedByExt && !allowedByType) {
    throw new Error("La imagen debe ser JPG, PNG o WEBP.");
  }
  if (file.size > MAX_SERVER_ACTION_IMAGE_BYTES) {
    throw new Error(`La imagen no debe superar ${MAX_SERVER_ACTION_IMAGE_LABEL} en produccion.`);
  }
}

async function resolveMediaValue(projectId: string, formData: FormData, type: MediaType) {
  if (type === "VIDEO") {
    const value = asString(formData, "value");
    if (!value) {
      throw new Error("Ingresa la URL del video.");
    }
    return value;
  }

  const file = formData.get("imageFile");
  if (file instanceof File && file.name && file.size > 0) {
    validateMediaImage(file);
    const { path } = await Storage.upload({
      file,
      folder: "MEDIA",
      name: asString(formData, "name") ?? file.name,
      subFolder: projectId,
    });
    const { publicUrl } = await Storage.getPublicUrl(path);
    return publicUrl;
  }

  throw new Error("Selecciona una imagen para subirla a la biblioteca.");
}

export async function createMediaFromForm(projectId: string, formData: FormData): ActionResponse<MediaItem> {
  try {
    const type = asString(formData, "type") as MediaType | undefined;
    if (type !== "IMAGE" && type !== "VIDEO") {
      throw new Error("Selecciona un tipo de medio valido.");
    }

    const value = await resolveMediaValue(projectId, formData, type);
    const response = await baseAxios.post<{ data: MediaItem }>(`/admin/projects/${projectId}/media`, {
      type,
      value,
      isPublic: asBoolean(formData, "isPublic"),
      isActive: true,
    });

    revalidatePath(`/dashboard/projects/${projectId}/media`);
    revalidatePath(`/dashboard/projects/${projectId}/media/order`);
    return { status: "success", data: response.data.data };
  } catch (error) {
    return mediaErrorResponse<MediaItem>(error);
  }
}

export async function publishMedia(projectId: string, mediaId: string): ActionResponse<MediaItem> {
  try {
    const response = await baseAxios.put<{ data: MediaItem }>(`/admin/projects/${projectId}/media/${mediaId}/publish`);
    revalidatePath(`/dashboard/projects/${projectId}/media`);
    return { status: "success", data: response.data.data };
  } catch (error) {
    return mediaErrorResponse<MediaItem>(error);
  }
}

export async function unpublishMedia(projectId: string, mediaId: string): ActionResponse<MediaItem> {
  try {
    const response = await baseAxios.put<{ data: MediaItem }>(`/admin/projects/${projectId}/media/${mediaId}/unpublish`);
    revalidatePath(`/dashboard/projects/${projectId}/media`);
    return { status: "success", data: response.data.data };
  } catch (error) {
    return mediaErrorResponse<MediaItem>(error);
  }
}

export async function deactivateMedia(projectId: string, mediaId: string): ActionResponse<MediaItem> {
  try {
    const response = await baseAxios.delete<{ data: MediaItem }>(`/admin/projects/${projectId}/media/${mediaId}`);
    const media = response.data.data;
    if (media.type === "IMAGE") {
      try {
        await Storage.removeByPublicUrl(media.value);
      } catch (error) {
        console.warn("No se pudo eliminar el archivo de media en Supabase Storage.", error);
      }
    }
    revalidatePath(`/dashboard/projects/${projectId}/media`);
    revalidatePath(`/dashboard/projects/${projectId}/media/order`);
    return { status: "success", data: media };
  } catch (error) {
    return mediaErrorResponse<MediaItem>(error);
  }
}
