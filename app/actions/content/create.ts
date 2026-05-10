"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAxiosError } from "axios";

import baseAxios from "../baseAxios";
import type { ActionResponse } from "../types";
import { Storage } from "../storage";
import { guatemalaLocalInputToUtcIso } from "@/lib/datetime-guatemala";
import { parseApiError } from "@/utils/helpers/parse-api-error";

function asString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function asBooleanWithDefault(formData: FormData, key: string, defaultValue: boolean) {
  return formData.has(key) ? asBoolean(formData, key) : defaultValue;
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

/** Fecha/hora introducida en el panel como civil en America/Guatemala → ISO UTC para el API. */
function asOffsetDateTime(formData: FormData, key: string) {
  const value = asString(formData, key);
  if (!value) {
    return undefined;
  }

  return guatemalaLocalInputToUtcIso(value);
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

async function uploadEventImage(projectId: string, formData: FormData) {
  return uploadImageFile(projectId, formData, "EVENTS", asString(formData, "title"));
}

async function uploadAwardImage(projectId: string, formData: FormData) {
  return uploadImageFile(projectId, formData, "AWARDS", asString(formData, "title"));
}

async function uploadUserAvatar(formData: FormData, subFolder: string) {
  const file = formData.get("avatarFile");
  if (file instanceof File && file.name && file.size > 0) {
    const { path } = await Storage.upload({
      file,
      folder: "USERS",
      name: asString(formData, "name") ?? file.name,
      subFolder,
    });
    const { publicUrl } = await Storage.getPublicUrl(path);

    return publicUrl;
  }

  return undefined;
}

async function nextSortOrder(projectId: string, resource: "banners" | "menu-products" | "events" | "awards") {
  const response = await baseAxios.get<{ data?: Array<{ sortOrder?: number | null }> }>(`/admin/projects/${projectId}/${resource}`, {
    params: {
      order: "ASC",
      orderBy: "sortOrder",
      pagination: false,
    },
  });
  const items = response.data.data ?? [];
  const maxSortOrder = items.reduce((max, item) => {
    const value = typeof item.sortOrder === "number" ? item.sortOrder : -1;
    return Math.max(max, value);
  }, -1);

  return maxSortOrder + 1;
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
    sortOrder: asNumber(formData, "sortOrder") ?? await nextSortOrder(projectId, "banners"),
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
  const priceCents = asPriceCents(formData, "price");

  return {
    name: asString(formData, "name"),
    description: asString(formData, "description"),
    imageUrl: await uploadProductImage(projectId, formData),
    type: asString(formData, "type") ?? "DRINK",
    ...(typeof priceCents === "number" ? { priceCents } : {}),
    isAvailable: true,
    isActive: true,
    isPublished: asBoolean(formData, "isPublished"),
    isFeatured: asBoolean(formData, "isFeatured"),
    sortOrder: asNumber(formData, "sortOrder") ?? await nextSortOrder(projectId, "menu-products"),
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
  await baseAxios.post(`/admin/projects/${projectId}/events`, await eventPayload(projectId, formData));

  revalidatePath(`/dashboard/projects/${projectId}/events`);
  redirect(`/dashboard/projects/${projectId}/events`);
}

async function eventPayload(projectId: string, formData: FormData) {
  const priceCents = asPriceCents(formData, "price");
  const capacity = asNumber(formData, "capacity");

  return {
    title: asString(formData, "title"),
    description: asString(formData, "description"),
    imageUrl: await uploadEventImage(projectId, formData),
    startDate: asOffsetDateTime(formData, "startDate"),
    endDate: asOffsetDateTime(formData, "endDate"),
    location: asString(formData, "location"),
    ...(typeof capacity === "number" ? { capacity } : {}),
    ...(typeof priceCents === "number" ? { priceCents } : {}),
    status: asString(formData, "status") ?? "ACTIVE",
    isActive: true,
    isPublished: asBoolean(formData, "isPublished"),
    isFeatured: asBoolean(formData, "isFeatured"),
    sortOrder: asNumber(formData, "sortOrder") ?? await nextSortOrder(projectId, "events"),
  };
}

export async function createEventFromForm(projectId: string, formData: FormData): ActionResponse<null> {
  try {
    await baseAxios.post(`/admin/projects/${projectId}/events`, await eventPayload(projectId, formData));
    revalidatePath(`/dashboard/projects/${projectId}/events`);

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

export async function createAward(projectId: string, formData: FormData) {
  await baseAxios.post(`/admin/projects/${projectId}/awards`, await awardPayload(projectId, formData));

  revalidatePath(`/dashboard/projects/${projectId}/awards`);
  redirect(`/dashboard/projects/${projectId}/awards`);
}

async function awardPayload(projectId: string, formData: FormData) {
  return {
    title: asString(formData, "title"),
    description: asString(formData, "description"),
    imageUrl: await uploadAwardImage(projectId, formData),
    sourceName: asString(formData, "sourceName"),
    sourceUrl: asString(formData, "sourceUrl"),
    awardedAt: asOffsetDateTime(formData, "awardedAt"),
    isActive: true,
    isPublished: asBoolean(formData, "isPublished"),
    isFeatured: asBoolean(formData, "isFeatured"),
    sortOrder: asNumber(formData, "sortOrder") ?? await nextSortOrder(projectId, "awards"),
  };
}

export async function createAwardFromForm(projectId: string, formData: FormData): ActionResponse<null> {
  try {
    await baseAxios.post(`/admin/projects/${projectId}/awards`, await awardPayload(projectId, formData));
    revalidatePath(`/dashboard/projects/${projectId}/awards`);

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

function mutationError(error: unknown): Awaited<ActionResponse<null>> {
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

async function bannerUpdatePayload(projectId: string, formData: FormData) {
  return {
    ...(await bannerPayload(projectId, formData)),
    isActive: asBooleanWithDefault(formData, "isActive", true),
    sortOrder: asNumber(formData, "sortOrder") ?? 0,
  };
}

async function productUpdatePayload(projectId: string, formData: FormData) {
  const priceCents = asPriceCents(formData, "price");

  return {
    name: asString(formData, "name"),
    description: asString(formData, "description"),
    imageUrl: await uploadProductImage(projectId, formData),
    type: asString(formData, "type") ?? "DRINK",
    priceCents: typeof priceCents === "number" ? priceCents : null,
    isAvailable: asBooleanWithDefault(formData, "isAvailable", true),
    isActive: asBooleanWithDefault(formData, "isActive", true),
    isPublished: asBoolean(formData, "isPublished"),
    isFeatured: asBoolean(formData, "isFeatured"),
    sortOrder: asNumber(formData, "sortOrder") ?? 0,
  };
}

async function eventUpdatePayload(projectId: string, formData: FormData) {
  const capacity = asNumber(formData, "capacity");
  const priceCents = asPriceCents(formData, "price");

  return {
    title: asString(formData, "title"),
    description: asString(formData, "description"),
    imageUrl: await uploadEventImage(projectId, formData),
    startDate: asOffsetDateTime(formData, "startDate"),
    endDate: asOffsetDateTime(formData, "endDate") ?? null,
    location: asString(formData, "location") ?? null,
    capacity: typeof capacity === "number" ? capacity : null,
    priceCents: typeof priceCents === "number" ? priceCents : null,
    status: asString(formData, "status") ?? "ACTIVE",
    isActive: asBooleanWithDefault(formData, "isActive", true),
    isPublished: asBoolean(formData, "isPublished"),
    isFeatured: asBoolean(formData, "isFeatured"),
    sortOrder: asNumber(formData, "sortOrder") ?? 0,
  };
}

async function awardUpdatePayload(projectId: string, formData: FormData) {
  return {
    title: asString(formData, "title"),
    description: asString(formData, "description"),
    imageUrl: await uploadAwardImage(projectId, formData),
    sourceName: asString(formData, "sourceName") ?? null,
    sourceUrl: asString(formData, "sourceUrl") ?? null,
    awardedAt: asOffsetDateTime(formData, "awardedAt") ?? null,
    isActive: asBooleanWithDefault(formData, "isActive", true),
    isPublished: asBoolean(formData, "isPublished"),
    isFeatured: asBoolean(formData, "isFeatured"),
    sortOrder: asNumber(formData, "sortOrder") ?? 0,
  };
}

export async function updateBannerFromForm(projectId: string, bannerId: string, formData: FormData): ActionResponse<null> {
  try {
    await baseAxios.put(`/admin/projects/${projectId}/banners/${bannerId}`, await bannerUpdatePayload(projectId, formData));
    revalidatePath(`/dashboard/projects/${projectId}/banners`);
    revalidatePath(`/dashboard/projects/${projectId}/banners/${bannerId}`);
    revalidatePath(`/dashboard/projects/${projectId}/banners/${bannerId}/edit`);

    return { status: "success", data: null };
  } catch (error) {
    return mutationError(error);
  }
}

export async function updateProductFromForm(projectId: string, productId: string, formData: FormData): ActionResponse<null> {
  try {
    await baseAxios.put(`/admin/projects/${projectId}/menu-products/${productId}`, await productUpdatePayload(projectId, formData));
    revalidatePath(`/dashboard/projects/${projectId}/products`);
    revalidatePath(`/dashboard/projects/${projectId}/products/${productId}`);
    revalidatePath(`/dashboard/projects/${projectId}/products/${productId}/edit`);

    return { status: "success", data: null };
  } catch (error) {
    return mutationError(error);
  }
}

export async function updateEventFromForm(projectId: string, eventId: string, formData: FormData): ActionResponse<null> {
  try {
    await baseAxios.put(`/admin/projects/${projectId}/events/${eventId}`, await eventUpdatePayload(projectId, formData));
    revalidatePath(`/dashboard/projects/${projectId}/events`);
    revalidatePath(`/dashboard/projects/${projectId}/events/${eventId}`);
    revalidatePath(`/dashboard/projects/${projectId}/events/${eventId}/edit`);

    return { status: "success", data: null };
  } catch (error) {
    return mutationError(error);
  }
}

export async function updateAwardFromForm(projectId: string, awardId: string, formData: FormData): ActionResponse<null> {
  try {
    await baseAxios.put(`/admin/projects/${projectId}/awards/${awardId}`, await awardUpdatePayload(projectId, formData));
    revalidatePath(`/dashboard/projects/${projectId}/awards`);
    revalidatePath(`/dashboard/projects/${projectId}/awards/${awardId}`);
    revalidatePath(`/dashboard/projects/${projectId}/awards/${awardId}/edit`);

    return { status: "success", data: null };
  } catch (error) {
    return mutationError(error);
  }
}

export async function createUser(formData: FormData) {
  const avatarUrl = (await uploadUserAvatar(formData, "pending")) ?? undefined;

  await baseAxios.post("/admin/users", {
    name: asString(formData, "name"),
    email: asString(formData, "email"),
    password: asString(formData, "password"),
    platformRole: asString(formData, "platformRole") ?? "USER",
    avatarUrl,
    isActive: true,
  });

  revalidatePath("/dashboard/admin/users");
  redirect("/dashboard/admin/users");
}

export async function updateUser(userId: string, formData: FormData) {
  const uploaded = await uploadUserAvatar(formData, userId);
  const avatarUrl = uploaded ?? asString(formData, "existingAvatarUrl");

  await baseAxios.put(`/admin/users/${userId}`, {
    name: asString(formData, "name"),
    email: asString(formData, "email"),
    password: asString(formData, "password"),
    platformRole: asString(formData, "platformRole") ?? "USER",
    avatarUrl,
    isActive: asBoolean(formData, "isActive"),
  });

  revalidatePath("/dashboard/admin/users");
  revalidatePath(`/dashboard/admin/users/${userId}`);
  redirect(`/dashboard/admin/users/${userId}`);
}
