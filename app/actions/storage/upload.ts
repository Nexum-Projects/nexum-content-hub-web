"use server";

import { getSupabaseEnv } from "@/utils/env";
import { normalizeText } from "@/utils/helpers/normalize-text";
import { createAdminClient } from "@/utils/supabase/admin";

type StorageFolder = "BANNERS" | "PRODUCTS" | "EVENTS" | "AWARDS" | "PROJECTS" | "MEDIA" | "USERS" | "LOCATIONS";
const STORAGE_ROOT_FOLDER = "nexum-content-hub";

type UploadParams = {
  file: File;
  folder: StorageFolder;
  name?: string;
  subFolder: string;
};

export async function upload({ file, folder, name, subFolder }: UploadParams) {
  if (!file.name || file.size === 0) {
    throw new Error("No se recibio una imagen valida para subir a Supabase Storage.");
  }

  const { SUPABASE_STORAGE_BUCKET_NAME } = getSupabaseEnv();
  const supabase = createAdminClient();
  const normalizedName = normalizeText({
    text: name || file.name,
    isFileName: !name,
  });
  const extension = getFileExtension(file);
  const filePath = [
    STORAGE_ROOT_FOLDER,
    folder.toLowerCase(),
    normalizeText(subFolder) || "general",
    `${normalizedName || "imagen"}-${Date.now()}.${extension}`,
  ].join("/");

  const { data, error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET_NAME).upload(filePath, file, {
    cacheControl: "3600",
    contentType: file.type || undefined,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function getFileExtension(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();

  if (fromName && ["jpg", "jpeg", "png", "webp", "svg"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }

  if (file.type === "image/svg+xml") {
    return "svg";
  }

  const fromMime = file.type.split("/").pop()?.toLowerCase();
  if (fromMime === "svg+xml") {
    return "svg";
  }

  return fromMime === "jpeg" ? "jpg" : fromMime || "bin";
}
