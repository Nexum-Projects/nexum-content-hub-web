"use server";

import { isAxiosError } from "axios";

import baseAxios from "../baseAxios";
import type { ActionResponse } from "../types";
import type { Award, Banner, DataResponse, EventItem, MediaItem, MenuProduct } from "./types";
import type { PaginatedPayload } from "./paginated-list-types";
import { parseApiError } from "@/utils/helpers/parse-api-error";
import type { AwardScopeFilter, EventWhenFilter, ProductTypeFilter, PublishFilter } from "@/lib/project-list-query";
import {
  parseAwardListQuery,
  parseBannerListQuery,
  parseEventListQuery,
  parseMediaListQuery,
  parseMenuProductListQuery,
  type RawSearchParams,
  toListRequestParams,
} from "@/lib/project-list-query";

function emptyMeta(limit: number): NonNullable<DataResponse<never>["meta"]> {
  return {
    page: 1,
    limit,
    totalObjects: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };
}

function paginateInMemory<T>(items: T[], page: number, limit: number): { items: T[]; meta: NonNullable<DataResponse<T>["meta"]> } {
  const totalObjects = items.length;
  const totalPages = Math.max(1, Math.ceil(totalObjects / limit) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  const slice = items.slice(start, start + limit);
  return {
    items: slice,
    meta: {
      page: safePage,
      limit,
      totalObjects,
      totalPages,
      hasPreviousPage: safePage > 1,
      hasNextPage: safePage < totalPages,
    },
  };
}

async function getPage<T>(
  url: string,
  params: ReturnType<typeof toListRequestParams>,
): Promise<{ items: T[]; meta: NonNullable<DataResponse<T>["meta"]> }> {
  const response = await baseAxios.get<DataResponse<T>>(url, { params });
  const items = response.data.data ?? [];
  const meta = response.data.meta ?? emptyMeta(params.limit);
  return { items, meta };
}

async function getAllSorted<T>(
  url: string,
  opts: { query?: string; orderBy: string; order: "ASC" | "DESC" },
): Promise<T[]> {
  const response = await baseAxios.get<DataResponse<T>>(url, {
    params: {
      pagination: false,
      orderBy: opts.orderBy,
      order: opts.order,
      ...(opts.query ? { query: opts.query } : {}),
    },
  });
  return response.data.data ?? [];
}

export async function fetchMenuProductsForReorder(projectId: string): ActionResponse<MenuProduct[]> {
  try {
    const items = await getAllSorted<MenuProduct>(`/admin/projects/${projectId}/menu-products`, {
      order: "ASC",
      orderBy: "sortOrder",
    });
    return { status: "success", data: items };
  } catch (error) {
    return catchListError(error);
  }
}

export async function fetchEventsForReorder(projectId: string): ActionResponse<EventItem[]> {
  try {
    const items = await getAllSorted<EventItem>(`/admin/projects/${projectId}/events`, {
      order: "ASC",
      orderBy: "sortOrder",
    });
    return { status: "success", data: items };
  } catch (error) {
    return catchListError(error);
  }
}

export async function fetchAwardsForReorder(projectId: string): ActionResponse<Award[]> {
  try {
    const items = await getAllSorted<Award>(`/admin/projects/${projectId}/awards`, {
      order: "ASC",
      orderBy: "sortOrder",
    });
    return { status: "success", data: items };
  } catch (error) {
    return catchListError(error);
  }
}

export async function fetchBannersForReorder(projectId: string): ActionResponse<Banner[]> {
  try {
    const items = await getAllSorted<Banner>(`/admin/projects/${projectId}/banners`, {
      order: "ASC",
      orderBy: "sortOrder",
    });
    return { status: "success", data: items };
  } catch (error) {
    return catchListError(error);
  }
}

export async function fetchMediaForReorder(projectId: string): ActionResponse<MediaItem[]> {
  try {
    const items = await getAllSorted<MediaItem>(`/admin/projects/${projectId}/media`, {
      order: "ASC",
      orderBy: "sortOrder",
    });
    return { status: "success", data: items };
  } catch (error) {
    return catchListError(error);
  }
}

function filterBannersByPublish(list: Banner[], publish: PublishFilter): Banner[] {
  if (publish === "published") {
    return list.filter((b) => b.isPublished);
  }
  if (publish === "draft") {
    return list.filter((b) => !b.isPublished);
  }
  return list;
}

function filterProductsList(
  list: MenuProduct[],
  publish: PublishFilter,
  productType: ProductTypeFilter,
): MenuProduct[] {
  let r = list;
  if (publish === "published") {
    r = r.filter((p) => p.isPublished);
  } else if (publish === "draft") {
    r = r.filter((p) => !p.isPublished);
  }
  if (productType !== "all") {
    r = r.filter((p) => p.type === productType);
  }
  return r;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function filterEventsList(list: EventItem[], publish: PublishFilter, when: EventWhenFilter): EventItem[] {
  let r = list;
  if (publish === "published") {
    r = r.filter((e) => e.isPublished);
  } else if (publish === "draft") {
    r = r.filter((e) => !e.isPublished);
  }

  if (when === "cancelled") {
    return r.filter((e) => e.status === "CANCELLED");
  }
  if (when === "upcoming") {
    const t = startOfToday();
    return r.filter((e) => {
      if (e.status === "CANCELLED") {
        return false;
      }
      const s = e.startDate ? new Date(e.startDate) : null;
      return Boolean(s && s >= t && e.status !== "FINISHED");
    });
  }
  if (when === "past") {
    const now = new Date();
    return r.filter((e) => {
      if (e.status === "CANCELLED") {
        return false;
      }
      if (e.status === "FINISHED") {
        return true;
      }
      const end = e.endDate ? new Date(e.endDate) : e.startDate ? new Date(e.startDate) : null;
      return Boolean(end && end < now);
    });
  }
  return r;
}

function filterAwardsList(list: Award[], publish: PublishFilter, award: AwardScopeFilter): Award[] {
  if (award === "featured") {
    return list.filter((a) => a.isFeatured);
  }
  if (award === "published") {
    return list.filter((a) => a.isPublished);
  }
  if (award === "drafts") {
    return list.filter((a) => !a.isPublished);
  }
  return filterAwardsPublishOnly(list, publish);
}

function filterAwardsPublishOnly(list: Award[], publish: PublishFilter): Award[] {
  if (publish === "published") {
    return list.filter((a) => a.isPublished);
  }
  if (publish === "draft") {
    return list.filter((a) => !a.isPublished);
  }
  return list;
}

function filterMediaList(list: MediaItem[], publish: PublishFilter, mediaType: "all" | "IMAGE" | "VIDEO"): MediaItem[] {
  let r = list;
  if (publish === "published") {
    r = r.filter((item) => item.isPublic);
  } else if (publish === "draft") {
    r = r.filter((item) => !item.isPublic);
  }
  if (mediaType !== "all") {
    r = r.filter((item) => item.type === mediaType);
  }
  return r;
}

export async function fetchBannersPage(
  projectId: string,
  rawSearchParams: RawSearchParams,
): ActionResponse<PaginatedPayload<Banner>> {
  const parsed = parseBannerListQuery(rawSearchParams);
  const url = `/admin/projects/${projectId}/banners`;

  try {
    const clientFilter = parsed.publish !== "all";

    if (!clientFilter) {
      const params = toListRequestParams(parsed);
      const { items, meta } = await getPage<Banner>(url, params);
      return { status: "success", data: { items, meta } };
    }

    const all = await getAllSorted<Banner>(url, {
      query: parsed.query,
      orderBy: parsed.orderBy,
      order: parsed.order,
    });
    const filtered = filterBannersByPublish(all, parsed.publish);
    const { items, meta } = paginateInMemory(filtered, parsed.page, parsed.limit);
    return { status: "success", data: { items, meta } };
  } catch (error) {
    return catchListError(error);
  }
}

export async function fetchMenuProductsPage(
  projectId: string,
  rawSearchParams: RawSearchParams,
): ActionResponse<PaginatedPayload<MenuProduct>> {
  const parsed = parseMenuProductListQuery(rawSearchParams);
  const url = `/admin/projects/${projectId}/menu-products`;

  try {
    const clientFilter = parsed.publish !== "all" || parsed.productType !== "all";

    if (!clientFilter) {
      const params = toListRequestParams(parsed);
      const { items, meta } = await getPage<MenuProduct>(url, params);
      return { status: "success", data: { items, meta } };
    }

    const all = await getAllSorted<MenuProduct>(url, {
      query: parsed.query,
      orderBy: parsed.orderBy,
      order: parsed.order,
    });
    const filtered = filterProductsList(all, parsed.publish, parsed.productType);
    const { items, meta } = paginateInMemory(filtered, parsed.page, parsed.limit);
    return { status: "success", data: { items, meta } };
  } catch (error) {
    return catchListError(error);
  }
}

export async function fetchEventsPage(
  projectId: string,
  rawSearchParams: RawSearchParams,
): ActionResponse<PaginatedPayload<EventItem>> {
  const parsed = parseEventListQuery(rawSearchParams);
  const url = `/admin/projects/${projectId}/events`;

  try {
    const clientFilter = parsed.publish !== "all" || parsed.when !== "all";

    if (!clientFilter) {
      const params = toListRequestParams(parsed);
      const { items, meta } = await getPage<EventItem>(url, params);
      return { status: "success", data: { items, meta } };
    }

    const all = await getAllSorted<EventItem>(url, {
      query: parsed.query,
      orderBy: parsed.orderBy,
      order: parsed.order,
    });
    const filtered = filterEventsList(all, parsed.publish, parsed.when);
    const { items, meta } = paginateInMemory(filtered, parsed.page, parsed.limit);
    return { status: "success", data: { items, meta } };
  } catch (error) {
    return catchListError(error);
  }
}

export async function fetchAwardsPage(
  projectId: string,
  rawSearchParams: RawSearchParams,
): ActionResponse<PaginatedPayload<Award>> {
  const parsed = parseAwardListQuery(rawSearchParams);
  const url = `/admin/projects/${projectId}/awards`;

  try {
    const clientFilter = parsed.publish !== "all" || parsed.award !== "all";

    if (!clientFilter) {
      const params = toListRequestParams(parsed);
      const { items, meta } = await getPage<Award>(url, params);
      return { status: "success", data: { items, meta } };
    }

    const all = await getAllSorted<Award>(url, {
      query: parsed.query,
      orderBy: parsed.orderBy,
      order: parsed.order,
    });
    const filtered =
      parsed.award !== "all" ? filterAwardsList(all, parsed.publish, parsed.award) : filterAwardsPublishOnly(all, parsed.publish);
    const { items, meta } = paginateInMemory(filtered, parsed.page, parsed.limit);
    return { status: "success", data: { items, meta } };
  } catch (error) {
    return catchListError(error);
  }
}

export async function fetchMediaPage(
  projectId: string,
  rawSearchParams: RawSearchParams,
): ActionResponse<PaginatedPayload<MediaItem>> {
  const parsed = parseMediaListQuery(rawSearchParams);
  const url = `/admin/projects/${projectId}/media`;

  try {
    const params = {
      ...toListRequestParams(parsed),
      ...(parsed.mediaType !== "all" ? { type: parsed.mediaType } : {}),
      ...(parsed.publish === "published" ? { isPublic: true } : {}),
      ...(parsed.publish === "draft" ? { isPublic: false } : {}),
    };

    const { items, meta } = await getPage<MediaItem>(url, params);

    if (parsed.mediaType === "all" && parsed.publish === "all") {
      return { status: "success", data: { items, meta } };
    }

    // El API ya soporta los filtros; este fallback conserva consistencia si algun entorno ignora query params booleanos/enums.
    const filtered = filterMediaList(items, parsed.publish, parsed.mediaType);
    return { status: "success", data: { items: filtered, meta } };
  } catch (error) {
    return catchListError(error);
  }
}

type ListFetchError = { status: "error"; errors: { title: string; message: string; statusCode?: number }[] };

function catchListError(error: unknown): ListFetchError {
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
