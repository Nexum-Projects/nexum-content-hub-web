/** Query params alineados con BaseSearchableQueryParamsDTO del ContentHubApi (`query`, `orderBy`, `order`, `page`, `limit`, `pagination`). */

export type RawSearchParams = Record<string, string | string[] | undefined>;

export const DEFAULT_LIST_LIMIT = 10;

export const LIST_LIMITS = [10, 20, 50] as const;

export function coerceListLimit(value: string | undefined): number {
  const n = parseInt(value ?? "", 10);
  return (LIST_LIMITS as readonly number[]).includes(n) ? n : DEFAULT_LIST_LIMIT;
}

/** Filtro de publicacion en URL (`pub`): all | published | draft */
export type PublishFilter = "all" | "published" | "draft";

export function parsePublishFilter(raw: RawSearchParams, key = "pub"): PublishFilter {
  const v = spFirst(raw, key)?.toLowerCase();
  if (v === "published") {
    return "published";
  }
  if (v === "draft") {
    return "draft";
  }
  return "all";
}

import { isActionButtonType, type ActionButtonType } from "@/lib/action-button-type";
import { isMenuProductCategory, isMenuProductType, type MenuProductCategory, type MenuProductType } from "@/lib/menu-product-type";

/** Productos: `ptype` all | MenuProductType */
export type ProductTypeFilter = "all" | MenuProductType;
export type ProductCategoryFilter = "all" | MenuProductCategory;

export function parseProductTypeFilter(raw: RawSearchParams): ProductTypeFilter {
  const v = spFirst(raw, "ptype")?.toUpperCase();
  if (isMenuProductType(v)) {
    return v;
  }
  return "all";
}

export function parseProductCategoryFilter(raw: RawSearchParams): ProductCategoryFilter {
  const v = spFirst(raw, "pcat")?.toUpperCase();
  if (isMenuProductCategory(v)) {
    return v;
  }
  return "all";
}

/** Eventos: `when` all | upcoming | past | cancelled */
export type EventWhenFilter = "all" | "upcoming" | "past" | "cancelled";

export function parseEventWhenFilter(raw: RawSearchParams): EventWhenFilter {
  const v = spFirst(raw, "when")?.toLowerCase();
  if (v === "upcoming" || v === "past" || v === "cancelled") {
    return v;
  }
  return "all";
}

/** Logros: `award` all | featured | published | drafts */
export type AwardScopeFilter = "all" | "featured" | "published" | "drafts";

export function parseAwardScopeFilter(raw: RawSearchParams): AwardScopeFilter {
  const v = spFirst(raw, "award")?.toLowerCase();
  if (v === "featured" || v === "published" || v === "drafts") {
    return v;
  }
  return "all";
}

export function spFirst(raw: RawSearchParams, key: string): string | undefined {
  const v = raw[key];
  if (Array.isArray(v)) {
    return v[0];
  }
  return v;
}

function parsePositiveInt(value: string | undefined, fallback: number, max?: number): number {
  const n = parseInt(value ?? "", 10);
  if (!Number.isFinite(n) || n < 1) {
    return fallback;
  }
  if (max !== undefined) {
    return Math.min(max, n);
  }
  return n;
}

function parseOrder(value: string | undefined): "ASC" | "DESC" {
  return value?.toUpperCase() === "DESC" ? "DESC" : "ASC";
}

function pickOrderBy<T extends string>(raw: string | undefined, allowed: readonly T[], fallback: T): T {
  if (raw && (allowed as readonly string[]).includes(raw)) {
    return raw as T;
  }
  return fallback;
}

export const BANNER_SORT_FIELDS = ["title", "sortOrder", "createdAt", "updatedAt"] as const;
export type BannerSortField = (typeof BANNER_SORT_FIELDS)[number];

export function parseBannerListQuery(raw: RawSearchParams) {
  return {
    page: parsePositiveInt(spFirst(raw, "page"), 1),
    limit: coerceListLimit(spFirst(raw, "limit")),
    query: (spFirst(raw, "query") ?? "").trim() || undefined,
    orderBy: pickOrderBy(spFirst(raw, "orderBy"), BANNER_SORT_FIELDS, "sortOrder"),
    order: parseOrder(spFirst(raw, "order")),
    publish: parsePublishFilter(raw),
  };
}

export const MENU_PRODUCT_SORT_FIELDS = ["name", "type", "menuCategory", "priceCents", "sortOrder", "createdAt", "updatedAt"] as const;
export type MenuProductSortField = (typeof MENU_PRODUCT_SORT_FIELDS)[number];

export function parseMenuProductListQuery(raw: RawSearchParams) {
  return {
    page: parsePositiveInt(spFirst(raw, "page"), 1),
    limit: coerceListLimit(spFirst(raw, "limit")),
    query: (spFirst(raw, "query") ?? "").trim() || undefined,
    orderBy: pickOrderBy(spFirst(raw, "orderBy"), MENU_PRODUCT_SORT_FIELDS, "sortOrder"),
    order: parseOrder(spFirst(raw, "order")),
    publish: parsePublishFilter(raw),
    productType: parseProductTypeFilter(raw),
    productCategory: parseProductCategoryFilter(raw),
  };
}

export const EVENT_SORT_FIELDS = ["title", "startDate", "endDate", "sortOrder", "createdAt", "updatedAt"] as const;
export type EventSortField = (typeof EVENT_SORT_FIELDS)[number];

export function parseEventListQuery(raw: RawSearchParams) {
  const rawOrder = spFirst(raw, "order");
  return {
    page: parsePositiveInt(spFirst(raw, "page"), 1),
    limit: coerceListLimit(spFirst(raw, "limit")),
    query: (spFirst(raw, "query") ?? "").trim() || undefined,
    orderBy: pickOrderBy(spFirst(raw, "orderBy"), EVENT_SORT_FIELDS, "sortOrder"),
    order: rawOrder ? parseOrder(rawOrder) : "ASC",
    publish: parsePublishFilter(raw),
    when: parseEventWhenFilter(raw),
  };
}

export const AWARD_SORT_FIELDS = ["title", "sortOrder", "createdAt", "updatedAt"] as const;
export type AwardSortField = (typeof AWARD_SORT_FIELDS)[number];

export function parseAwardListQuery(raw: RawSearchParams) {
  const rawOrder = spFirst(raw, "order");
  return {
    page: parsePositiveInt(spFirst(raw, "page"), 1),
    limit: coerceListLimit(spFirst(raw, "limit")),
    query: (spFirst(raw, "query") ?? "").trim() || undefined,
    orderBy: pickOrderBy(spFirst(raw, "orderBy"), AWARD_SORT_FIELDS, "sortOrder"),
    order: rawOrder ? parseOrder(rawOrder) : "ASC",
    publish: parsePublishFilter(raw),
    award: parseAwardScopeFilter(raw),
  };
}

/** Medios: `mtype` all | IMAGE | VIDEO */
export type MediaTypeFilter = "all" | "IMAGE" | "VIDEO";

export function parseMediaTypeFilter(raw: RawSearchParams): MediaTypeFilter {
  const v = spFirst(raw, "mtype")?.toUpperCase();
  if (v === "IMAGE" || v === "VIDEO") {
    return v;
  }
  return "all";
}

export const MEDIA_SORT_FIELDS = ["type", "value", "sortOrder", "createdAt", "updatedAt"] as const;
export type MediaSortField = (typeof MEDIA_SORT_FIELDS)[number];

export function parseMediaListQuery(raw: RawSearchParams) {
  return {
    page: parsePositiveInt(spFirst(raw, "page"), 1),
    limit: coerceListLimit(spFirst(raw, "limit")),
    query: (spFirst(raw, "query") ?? "").trim() || undefined,
    orderBy: pickOrderBy(spFirst(raw, "orderBy"), MEDIA_SORT_FIELDS, "sortOrder"),
    order: parseOrder(spFirst(raw, "order")),
    publish: parsePublishFilter(raw),
    mediaType: parseMediaTypeFilter(raw),
  };
}

/** Botones de accion: `atype` all | ActionButtonType */
export type ActionButtonTypeFilter = "all" | ActionButtonType;

export function parseActionButtonTypeFilter(raw: RawSearchParams): ActionButtonTypeFilter {
  const v = spFirst(raw, "atype")?.toUpperCase();
  if (isActionButtonType(v)) {
    return v;
  }
  return "all";
}

export const ACTION_BUTTON_SORT_FIELDS = ["type", "value", "sortOrder", "createdAt", "updatedAt"] as const;
export type ActionButtonSortField = (typeof ACTION_BUTTON_SORT_FIELDS)[number];

export function parseActionButtonListQuery(raw: RawSearchParams) {
  return {
    page: parsePositiveInt(spFirst(raw, "page"), 1),
    limit: coerceListLimit(spFirst(raw, "limit")),
    query: (spFirst(raw, "query") ?? "").trim() || undefined,
    orderBy: pickOrderBy(spFirst(raw, "orderBy"), ACTION_BUTTON_SORT_FIELDS, "sortOrder"),
    order: parseOrder(spFirst(raw, "order")),
    publish: parsePublishFilter(raw),
    actionType: parseActionButtonTypeFilter(raw),
  };
}

/** Horarios: `day` all | WeekDay */
export type OpeningHourDayFilter =
  | "all"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export function parseOpeningHourDayFilter(raw: RawSearchParams): OpeningHourDayFilter {
  const v = spFirst(raw, "day")?.toUpperCase();
  if (
    v === "MONDAY" ||
    v === "TUESDAY" ||
    v === "WEDNESDAY" ||
    v === "THURSDAY" ||
    v === "FRIDAY" ||
    v === "SATURDAY" ||
    v === "SUNDAY"
  ) {
    return v;
  }
  return "all";
}

export const OPENING_HOUR_SORT_FIELDS = ["day", "startTime", "endTime", "createdAt", "updatedAt"] as const;
export type OpeningHourSortField = (typeof OPENING_HOUR_SORT_FIELDS)[number];

export function parseOpeningHourListQuery(raw: RawSearchParams) {
  return {
    page: parsePositiveInt(spFirst(raw, "page"), 1),
    limit: coerceListLimit(spFirst(raw, "limit")),
    orderBy: pickOrderBy(spFirst(raw, "orderBy"), OPENING_HOUR_SORT_FIELDS, "day"),
    order: parseOrder(spFirst(raw, "order")),
    publish: parsePublishFilter(raw),
    day: parseOpeningHourDayFilter(raw),
  };
}

export const LOCATION_SORT_FIELDS = ["title", "fullAddress", "sortOrder", "createdAt", "updatedAt"] as const;
export type LocationSortField = (typeof LOCATION_SORT_FIELDS)[number];

export function parseLocationListQuery(raw: RawSearchParams) {
  const rawOrder = spFirst(raw, "order");
  return {
    page: parsePositiveInt(spFirst(raw, "page"), 1),
    limit: coerceListLimit(spFirst(raw, "limit")),
    query: (spFirst(raw, "query") ?? "").trim() || undefined,
    orderBy: pickOrderBy(spFirst(raw, "orderBy"), LOCATION_SORT_FIELDS, "sortOrder"),
    order: rawOrder ? parseOrder(rawOrder) : "ASC",
    publish: parsePublishFilter(raw),
  };
}

export type ListRequestParams = {
  pagination: boolean;
  page: number;
  limit: number;
  orderBy: string;
  order: "ASC" | "DESC";
  query?: string;
};

export function toListRequestParams(parsed: {
  page: number;
  limit: number;
  query?: string;
  orderBy: string;
  order: "ASC" | "DESC";
}): ListRequestParams {
  return {
    pagination: true,
    page: parsed.page,
    limit: parsed.limit,
    orderBy: parsed.orderBy,
    order: parsed.order,
    ...(parsed.query ? { query: parsed.query } : {}),
  };
}
