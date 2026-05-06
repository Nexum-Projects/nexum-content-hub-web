"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAxiosError } from "axios";

import baseAxios from "../baseAxios";
import type { ActionResponse } from "../types";
import { Storage } from "../storage";
import { parseApiError } from "@/utils/helpers/parse-api-error";

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

  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function asPriceCents(formData: FormData, key: string) {
  const value = asNumber(formData, key);
  return typeof value === "number" ? Math.round(value * 100) : undefined;
}

function asOffsetDateTime(formData: FormData, key: string) {
  const value = asString(formData, key);
  if (!value) {
    return undefined;
  }

  return value.length === 16 ? `${value}:00Z` : value;
}

type ImageStorageFolder = "BANNERS" | "PRODUCTS" | "EVENTS" | "AWARDS" | "PROJECTS" | "MEDIA";

async function uploadImageFile(projectId: string, formData: FormData, folder: ImageStorageFolder, fallbackName?: string) {
  const explicitUrl = asString(formData, "imageUrl");
  if (explicitUrl) {
    return explicitUrl;
  }

  const file = formData.get("imageFile");
  if (file instanceof File && file.name) {
    const { path } = await Storage.upload({
      file,
      folder,
      name: fallbackName ?? asString(formData, "title") ?? asString(formData, "name") ?? file.name,
      subFolder: projectId,
    });
    const { publicUrl } = await Storage.getPublicUrl(path);

    return publicUrl;
  }

  return undefined;
}

async function uploadBannerImage(projectId: string, formData: FormData) {
  return uploadImageFile(projectId, formData, "BANNERS", asString(formData, "title"));
}

async function uploadProductImage(projectId: string, formData: FormData) {
  return uploadImageFile(projectId, formData, "PRODUCTS", asString(formData, "name"));
}

async function bannerPayload(projectId: string, formData: FormData) {
  const buttonLabel = asString(formData, "buttonLabel");
  const buttonUrl = asString(formData, "buttonUrl");
  const buttonsJson = asString(formData, "buttonsJson");
  let buttons: Array<Record<string, unknown>> = [];

  if (buttonsJson) {
    try {
      const parsed = JSON.parse(buttonsJson);
      if (Array.isArray(parsed)) {
        buttons = parsed;
      }
    } catch {
      buttons = [];
    }
  } else if (buttonLabel && buttonUrl) {
    buttons = [
      {
        label: buttonLabel,
        url: buttonUrl,
        variant: asString(formData, "buttonVariant") ?? "PRIMARY",
        target: asString(formData, "buttonTarget") ?? "_self",
        isActive: true,
        sortOrder: 0,
      },
    ];
  }

  return {
    title: asString(formData, "title"),
    description: asString(formData, "description"),
    imageUrl: await uploadBannerImage(projectId, formData),
    isActive: true,
    isPublished: asBoolean(formData, "isPublished"),
    sortOrder: asNumber(formData, "sortOrder") ?? 0,
    buttons,
  };
}

export async function createProject(formData: FormData) {
  await baseAxios.post("/admin/projects", {
    name: asString(formData, "name"),
    slug: asString(formData, "slug"),
    domain: asString(formData, "domain"),
    logoUrl: asString(formData, "logoUrl"),
    avatarUrl: asString(formData, "avatarUrl"),
    isActive: true,
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function createBanner(projectId: string, formData: FormData) {
  await baseAxios.post(`/admin/projects/${projectId}/banners`, await bannerPayload(projectId, formData));

  revalidatePath(`/dashboard/projects/${projectId}/banners`);
  redirect(`/dashboard/projects/${projectId}/banners`);
}

export async function createBannerFromForm(projectId: string, formData: FormData): ActionResponse<null> {
  try {
    await baseAxios.post(`/admin/projects/${projectId}/banners`, await bannerPayload(projectId, formData));
    revalidatePath(`/dashboard/projects/${projectId}/banners`);

    return {
      status: "success",
      data: null,
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

export async function createProduct(projectId: string, formData: FormData) {
  await baseAxios.post(`/admin/projects/${projectId}/menu-products`, await productPayload(projectId, formData));

  revalidatePath(`/dashboard/projects/${projectId}/products`);
  redirect(`/dashboard/projects/${projectId}/products`);
}

async function productPayload(projectId: string, formData: FormData) {
  return {
    name: asString(formData, "name"),
    slug: asString(formData, "slug"),
    description: asString(formData, "description"),
    imageUrl: await uploadProductImage(projectId, formData),
    type: asString(formData, "type") ?? "DRINK",
    priceCents: asPriceCents(formData, "price"),
    isAvailable: true,
    isActive: true,
    isPublished: asBoolean(formData, "isPublished"),
    isFeatured: asBoolean(formData, "isFeatured"),
    sortOrder: asNumber(formData, "sortOrder") ?? 0,
  };
}

export async function createProductFromForm(projectId: string, formData: FormData): ActionResponse<null> {
  try {
    await baseAxios.post(`/admin/projects/${projectId}/menu-products`, await productPayload(projectId, formData));
    revalidatePath(`/dashboard/projects/${projectId}/products`);

    return {
      status: "success",
      data: null,
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

export async function createEvent(projectId: string, formData: FormData) {
  await baseAxios.post(`/admin/projects/${projectId}/events`, {
    title: asString(formData, "title"),
    slug: asString(formData, "slug"),
    description: asString(formData, "description"),
    imageUrl: asString(formData, "imageUrl"),
    startDate: asOffsetDateTime(formData, "startDate"),
    endDate: asOffsetDateTime(formData, "endDate"),
    location: asString(formData, "location"),
    capacity: asNumber(formData, "capacity"),
    priceCents: asPriceCents(formData, "price"),
    status: asString(formData, "status") ?? "DRAFT",
    isActive: true,
    isPublished: asBoolean(formData, "isPublished"),
    isFeatured: asBoolean(formData, "isFeatured"),
    sortOrder: asNumber(formData, "sortOrder") ?? 0,
  });

  revalidatePath(`/dashboard/projects/${projectId}/events`);
  redirect(`/dashboard/projects/${projectId}/events`);
}

export async function createAward(projectId: string, formData: FormData) {
  await baseAxios.post(`/admin/projects/${projectId}/awards`, {
    title: asString(formData, "title"),
    description: asString(formData, "description"),
    imageUrl: asString(formData, "imageUrl"),
    sourceName: asString(formData, "sourceName"),
    sourceUrl: asString(formData, "sourceUrl"),
    awardedAt: asOffsetDateTime(formData, "awardedAt"),
    isActive: true,
    isPublished: asBoolean(formData, "isPublished"),
    isFeatured: asBoolean(formData, "isFeatured"),
    sortOrder: asNumber(formData, "sortOrder") ?? 0,
  });

  revalidatePath(`/dashboard/projects/${projectId}/awards`);
  redirect(`/dashboard/projects/${projectId}/awards`);
}

export async function createUser(formData: FormData) {
  await baseAxios.post("/admin/users", {
    name: asString(formData, "name"),
    email: asString(formData, "email"),
    password: asString(formData, "password"),
    platformRole: asString(formData, "platformRole") ?? "USER",
    avatarUrl: asString(formData, "avatarUrl"),
    isActive: true,
  });

  revalidatePath("/dashboard/admin/users");
  redirect("/dashboard/admin/users");
}

export async function updateUser(userId: string, formData: FormData) {
  await baseAxios.put(`/admin/users/${userId}`, {
    name: asString(formData, "name"),
    email: asString(formData, "email"),
    password: asString(formData, "password"),
    platformRole: asString(formData, "platformRole") ?? "USER",
    avatarUrl: asString(formData, "avatarUrl"),
    isActive: asBoolean(formData, "isActive"),
  });

  revalidatePath("/dashboard/admin/users");
  revalidatePath(`/dashboard/admin/users/${userId}`);
  redirect(`/dashboard/admin/users/${userId}`);
}
