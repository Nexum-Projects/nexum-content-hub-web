"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAxiosError } from "axios";

import getSession from "../auth/getSession";
import baseAxios from "../baseAxios";
import { ADMIN_PROJECTS_PATH, adminProjectDetailPath } from "./admin-projects-api";
import type { ActionResponse } from "../types";
import type { ProjectMemberRole, User } from "./types";
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

const MAX_PROJECT_RASTER_BYTES = 5 * 1024 * 1024;
const MAX_PROJECT_SVG_BYTES = 2 * 1024 * 1024;
const PROJECT_RASTER_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

function isRasterProjectFile(file: File) {
  if (file.size > MAX_PROJECT_RASTER_BYTES) {
    return false;
  }
  if (PROJECT_RASTER_MIMES.has(file.type)) {
    return true;
  }
  return !file.type && /\.(jpe?g|png|webp)$/i.test(file.name);
}

function isSvgProjectIconFile(file: File) {
  if (file.size > MAX_PROJECT_SVG_BYTES) {
    return false;
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "svg") {
    return false;
  }
  return !file.type || file.type === "image/svg+xml" || (file.type === "application/octet-stream" && ext === "svg");
}

async function uploadOptionalProjectLogo(formData: FormData, subFolder: string) {
  const file = formData.get("logoFile");
  if (!(file instanceof File) || file.size === 0) {
    return asString(formData, "existingLogoUrl");
  }
  if (!isRasterProjectFile(file)) {
    throw new Error("El logo debe ser JPG, PNG o WEBP y no superar 5MB.");
  }
  const { path } = await Storage.upload({
    file,
    folder: "PROJECTS",
    name: asString(formData, "name") ?? file.name,
    subFolder,
  });
  const { publicUrl } = await Storage.getPublicUrl(path);

  return publicUrl;
}

async function uploadOptionalProjectIconSvg(formData: FormData, subFolder: string) {
  const file = formData.get("iconFile");
  if (!(file instanceof File) || file.size === 0) {
    return asString(formData, "existingAvatarUrl");
  }
  if (!isSvgProjectIconFile(file)) {
    throw new Error("El icono debe ser un archivo SVG y no superar 2MB.");
  }
  const { path } = await Storage.upload({
    file,
    folder: "PROJECTS",
    name: `${asString(formData, "name") ?? "icon"}-icon`,
    subFolder,
  });
  const { publicUrl } = await Storage.getPublicUrl(path);

  return publicUrl;
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
  const session = await getSession();
  if (session?.platformRole !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const subFolder = "pending";
  const logoUrl = await uploadOptionalProjectLogo(formData, subFolder);
  const avatarUrl = await uploadOptionalProjectIconSvg(formData, subFolder);

  await baseAxios.post(ADMIN_PROJECTS_PATH, {
    name: asString(formData, "name"),
    domain: asString(formData, "domain"),
    logoUrl,
    avatarUrl,
    isActive: true,
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/**
 * Persiste cambios de configuración del proyecto. Llama a
 * {@code ProjectController#update}: {@code PUT /api/admin/projects/{id}}.
 * No redirige: el cliente debe navegar o recargar tras éxito para reflejar datos.
 */
export async function updateProject(projectId: string, formData: FormData) {
  const session = await getSession();
  if (session?.platformRole !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const logoUrl = await uploadOptionalProjectLogo(formData, projectId);
  const avatarUrl = await uploadOptionalProjectIconSvg(formData, projectId);

  await baseAxios.put(adminProjectDetailPath(projectId), {
    name: asString(formData, "name"),
    domain: asString(formData, "domain"),
    logoUrl,
    avatarUrl,
    isActive: true,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath(`/dashboard/projects/${projectId}/settings`);
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

const PROJECT_MEMBER_ROLES: readonly ProjectMemberRole[] = ["OWNER", "ADMIN", "MARKETING"];

type ProjectMembershipInput = {
  projectId: string;
  role: ProjectMemberRole;
};

type ExistingProjectMembershipInput = {
  projectId: string;
  memberId: string;
};

function parseAssignProjectRole(formData: FormData): ProjectMemberRole {
  const r = asString(formData, "assignProjectRole");
  if (r && (PROJECT_MEMBER_ROLES as readonly string[]).includes(r)) {
    return r as ProjectMemberRole;
  }
  return "MARKETING";
}

function isProjectMemberRole(value: unknown): value is ProjectMemberRole {
  return typeof value === "string" && (PROJECT_MEMBER_ROLES as readonly string[]).includes(value);
}

function parseProjectMemberships(formData: FormData): ProjectMembershipInput[] {
  const membershipsJson = asString(formData, "projectMembershipsJson");
  if (membershipsJson) {
    try {
      const parsed = JSON.parse(membershipsJson);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .map((item): ProjectMembershipInput | null => {
          if (!item || typeof item !== "object") {
            return null;
          }
          const projectId = typeof item.projectId === "string" ? item.projectId.trim() : "";
          const role = (item as { role?: unknown }).role;
          if (!projectId || !isProjectMemberRole(role)) {
            return null;
          }
          return { projectId, role };
        })
        .filter((item): item is ProjectMembershipInput => Boolean(item));
    } catch {
      return [];
    }
  }

  const role = parseAssignProjectRole(formData);
  return formData
    .getAll("assignProjectId")
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((projectId) => ({ projectId, role }));
}

function parseExistingProjectMemberships(formData: FormData): ExistingProjectMembershipInput[] {
  const existingJson = asString(formData, "existingProjectMembershipsJson");
  if (!existingJson) {
    return [];
  }

  try {
    const parsed = JSON.parse(existingJson);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item): ExistingProjectMembershipInput | null => {
        if (!item || typeof item !== "object") {
          return null;
        }
        const projectId = typeof item.projectId === "string" ? item.projectId.trim() : "";
        const memberId = typeof item.memberId === "string" ? item.memberId.trim() : "";
        if (!projectId || !memberId) {
          return null;
        }
        return { projectId, memberId };
      })
      .filter((item): item is ExistingProjectMembershipInput => Boolean(item));
  } catch {
    return [];
  }
}

/**
 * Crea o actualiza membresía vía POST /admin/projects/:projectId/members (upsert en el API).
 * Solo debe invocarse cuando la sesión es SUPER_ADMIN.
 */
async function assignUserToProjectsFromForm(userId: string, formData: FormData): Promise<string[]> {
  const memberships = parseProjectMemberships(formData);
  const existingMemberships = parseExistingProjectMemberships(formData);
  const selectedProjectIds = new Set(memberships.map((item) => item.projectId));
  const errors: string[] = [];

  for (const existing of existingMemberships) {
    if (selectedProjectIds.has(existing.projectId)) {
      continue;
    }

    try {
      await baseAxios.delete(`/admin/projects/${existing.projectId}/members/${existing.memberId}`);
      revalidatePath(`/dashboard/projects/${existing.projectId}/members`);
    } catch (error) {
      let msg = "Error desconocido";
      if (isAxiosError(error) && error.response) {
        msg = parseApiError(error.response.data).description;
      } else {
        msg = parseApiError(error).description;
      }
      errors.push(`${existing.projectId}: ${msg}`);
    }
  }

  for (const membership of memberships) {
    try {
      await baseAxios.post(`/admin/projects/${membership.projectId}/members`, {
        userId,
        role: membership.role,
        isActive: true,
      });
      revalidatePath(`/dashboard/projects/${membership.projectId}/members`);
    } catch (error) {
      let msg = "Error desconocido";
      if (isAxiosError(error) && error.response) {
        msg = parseApiError(error.response.data).description;
      } else {
        msg = parseApiError(error).description;
      }
      errors.push(`${membership.projectId}: ${msg}`);
    }
  }

  return errors;
}

export async function createUser(formData: FormData): ActionResponse<{ userId: string; assignmentErrors?: string[] }> {
  try {
    const session = await getSession();
    const avatarUrl = (await uploadUserAvatar(formData, "pending")) ?? undefined;

    const response = await baseAxios.post<{ data: User }>("/admin/users", {
      name: asString(formData, "name"),
      email: asString(formData, "email"),
      password: asString(formData, "password"),
      platformRole: asString(formData, "platformRole") ?? "USER",
      avatarUrl,
      isActive: true,
    });

    const userId = response.data.data?.id;
    if (!userId) {
      return {
        status: "error",
        errors: [{ title: "Respuesta inválida", message: "El API no devolvió el identificador del usuario creado." }],
      };
    }

    let assignmentErrors: string[] | undefined;
    if (session?.platformRole === "SUPER_ADMIN") {
      const errs = await assignUserToProjectsFromForm(userId, formData);
      assignmentErrors = errs.length > 0 ? errs : undefined;
    }

    revalidatePath("/dashboard/admin/users");

    return {
      status: "success",
      data: { userId, assignmentErrors },
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

export async function updateUser(userId: string, formData: FormData): ActionResponse<{ assignmentErrors?: string[] }> {
  try {
    const session = await getSession();
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

    let assignmentErrors: string[] | undefined;
    if (session?.platformRole === "SUPER_ADMIN") {
      const errs = await assignUserToProjectsFromForm(userId, formData);
      assignmentErrors = errs.length > 0 ? errs : undefined;
    }

    revalidatePath("/dashboard/admin/users");
    revalidatePath(`/dashboard/admin/users/${userId}`);

    return {
      status: "success",
      data: { assignmentErrors },
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
