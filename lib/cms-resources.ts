/** Catálogo `CmsResource` del API: recursos que un plan habilita y que el owner asigna por miembro. */
export const CMS_RESOURCES = [
  "ACTION_BUTTONS",
  "AWARDS",
  "BANNERS",
  "EVENTS",
  "LOCATIONS",
  "MEDIA",
  "MENU_PRODUCTS",
  "OPENING_HOURS",
  "PRODUCT_CATEGORIES",
] as const;

export type CmsResource = (typeof CMS_RESOURCES)[number];
export type AccessLevel = "READ" | "WRITE";
/** Recurso ausente = sin acceso (`NONE` no viaja en el API). */
export type ResourcePermissions = Partial<Record<CmsResource, AccessLevel>>;

export const CMS_RESOURCE_LABELS: Record<CmsResource, string> = {
  ACTION_BUTTONS: "Botones de acción",
  AWARDS: "Logros / Premios",
  BANNERS: "Banners",
  EVENTS: "Eventos",
  LOCATIONS: "Ubicaciones",
  MEDIA: "Medios",
  MENU_PRODUCTS: "Menú / Productos",
  OPENING_HOURS: "Horario de atención",
  PRODUCT_CATEGORIES: "Categorías",
};

/** Segmento de `/dashboard/projects/{id}/<segmento>` → recurso del API. */
const SEGMENT_RESOURCES: Record<string, CmsResource> = {
  "action-buttons": "ACTION_BUTTONS",
  awards: "AWARDS",
  banners: "BANNERS",
  categories: "PRODUCT_CATEGORIES",
  events: "EVENTS",
  locations: "LOCATIONS",
  media: "MEDIA",
  "opening-hours": "OPENING_HOURS",
  products: "MENU_PRODUCTS",
};

const WRITE_SEGMENTS = new Set(["new", "edit", "order"]);

/** Recurso de la ruta y si la ruta es de escritura (`/new`, `/edit`, `/order`); `null` si no es una ruta de contenido. */
export function routeAccess(pathname: string): { resource: CmsResource; needsWrite: boolean } | null {
  if (!pathname.startsWith("/dashboard/projects/")) {
    return null;
  }
  const [, , , , segment, ...rest] = pathname.split("/");
  const resource = SEGMENT_RESOURCES[segment ?? ""];
  if (!resource) {
    return null;
  }
  return { resource, needsWrite: rest.some((s) => WRITE_SEGMENTS.has(s)) };
}

export function canRead(permissions: ResourcePermissions, resource: CmsResource) {
  return permissions[resource] !== undefined;
}

export function canWrite(permissions: ResourcePermissions, resource: CmsResource) {
  return permissions[resource] === "WRITE";
}
