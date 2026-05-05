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

/** Productos: `ptype` all | FOOD | DRINK */
export type ProductTypeFilter = "all" | "FOOD" | "DRINK";

export function parseProductTypeFilter(raw: RawSearchParams): ProductTypeFilter {
  const v = spFirst(raw, "ptype")?.toUpperCase();
  if (v === "FOOD" || v === "DRINK") {
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

export const MENU_PRODUCT_SORT_FIELDS = ["name", "priceCents", "sortOrder", "createdAt", "updatedAt"] as const;
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
  };
}

export const EVENT_SORT_FIELDS = ["title", "startDate", "endDate", "createdAt", "updatedAt"] as const;
export type EventSortField = (typeof EVENT_SORT_FIELDS)[number];

export function parseEventListQuery(raw: RawSearchParams) {
  return {
    page: parsePositiveInt(spFirst(raw, "page"), 1),
    limit: coerceListLimit(spFirst(raw, "limit")),
    query: (spFirst(raw, "query") ?? "").trim() || undefined,
    orderBy: pickOrderBy(spFirst(raw, "orderBy"), EVENT_SORT_FIELDS, "startDate"),
    order: parseOrder(spFirst(raw, "order")),
    publish: parsePublishFilter(raw),
    when: parseEventWhenFilter(raw),
  };
}

export const AWARD_SORT_FIELDS = ["title", "sortOrder", "createdAt", "updatedAt"] as const;
export type AwardSortField = (typeof AWARD_SORT_FIELDS)[number];

export function parseAwardListQuery(raw: RawSearchParams) {
  return {
    page: parsePositiveInt(spFirst(raw, "page"), 1),
    limit: coerceListLimit(spFirst(raw, "limit")),
    query: (spFirst(raw, "query") ?? "").trim() || undefined,
    orderBy: pickOrderBy(spFirst(raw, "orderBy"), AWARD_SORT_FIELDS, "sortOrder"),
    order: parseOrder(spFirst(raw, "order")),
    publish: parsePublishFilter(raw),
    award: parseAwardScopeFilter(raw),
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
