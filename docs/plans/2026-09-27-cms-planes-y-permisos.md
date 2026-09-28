# Planes y permisos por recurso en el CMS — plan

**Versión:** `v1.1`  
**Fecha:** 2026-09-27  
**Ambiente:** nexum-content-hub-front, rama `feat/plans-permissions`  
**API:** `content-hub-api@main` (`7ece3f9`, PR #8)

**Goal:** el CMS usa los planes y permisos por recurso que ya expone el API: el super admin gestiona planes y los
asigna a proyectos; el owner asigna `READ`/`WRITE` por miembro; cada usuario ve solo los menús y acciones que puede
usar.

**Architecture:** `app/dashboard/projects/[projectId]/layout.tsx` pide `GET /me/permissions` y lo entrega a un
provider cliente. Un mapa `segmento de ruta → CmsResource` permite que el provider bloquee rutas sin permiso y que
`useCanWrite()` / `<WriteOnly>` oculten acciones sin pasar props por cada página. El menú lateral (fuera de ese
layout) pide lo mismo con una server action.

**Tech stack:** Next.js 16 (App Router, server actions), React Hook Form + Zod, axios (`baseAxios`).

## Constraints

- Sin cambios en el API. Sin auditoría de permisos.
- El API es la fuente de verdad: si `me/permissions` falla, la UI no oculta nada (el API responde 403 igual).
- `MANAGE` es solo `OWNER`: `can-view-project-members.ts` ya decide por el resultado de `GET /members` (403 al
  `ADMIN`), así que solo se corrigen comentarios.
- Dependencias entre recursos en el CMS: productos lee categorías → aviso si `MENU_PRODUCTS` tiene acceso y
  `PRODUCT_CATEGORIES` no. **No** hay dependencia con `MEDIA`: las imágenes se suben directo a Supabase
  (`app/actions/storage/upload.ts`), no por `/media` del API.
- Sin framework de tests en el repo: validación con `npm run lint`, `npm run build` y prueba manual contra el API local.
- Repo público: sin `docs-internos/` ni `.env*`. Commit, push y merge con confirmación de Daniel.

## Contrato del API usado

| Quién | Método y ruta | Respuesta |
|---|---|---|
| Miembro | `GET /admin/projects/{p}/me/permissions` | `{data: {"EVENTS": "WRITE", ...}}` (owner y super admin: todo el plan en `WRITE`) |
| Owner | `GET/PUT /admin/projects/{p}/members/{m}/permissions` | `{data: {...}}` / cuerpo `{"permissions": {...}}` |
| Super admin | `GET /admin/resources` | `{data: ["ACTION_BUTTONS", ...]}` |
| Super admin | `GET/POST /admin/plans`, `GET/PUT/DELETE /admin/plans/{id}` | `PlanDTO {id, name, description, resources[], isActive}` |
| Super admin | `planId` en `POST/PUT /admin/projects` | obligatorio al crear; el `Project` devuelve `planId` |

Mensajes que se traducen: `Resource is not included in the project plan`, `User does not have permission on this
resource`, `Plan is assigned to active projects`, `Plan name already exists`, `Plan is required`,
`Some resources are not included in the project plan`, `Owner permissions cannot be changed`.

---

### Task 1: Catálogo de recursos, acciones y mensajes de error

**Files:**
- Create: `lib/cms-resources.ts`, `app/actions/content/permissions.ts`, `app/actions/content/plans.ts`
- Modify: `app/actions/content/types.ts` (`Project.planId`, tipo `Plan`), `utils/helpers/parse-api-error.ts`

**Produces:**
- `CMS_RESOURCES`, `CmsResource`, `AccessLevel = "READ" | "WRITE"`, `ResourcePermissions = Partial<Record<CmsResource, AccessLevel>>`
- `CMS_RESOURCE_LABELS: Record<CmsResource, string>`
- `routeAccess(pathname): { resource: CmsResource; needsWrite: boolean } | null`
- `canRead(p, r)`, `canWrite(p, r)` (el menú usa `routeAccess(href)?.resource`)
- `getMyPermissions(projectId)`, `getMemberPermissions(projectId, memberId)`,
  `replaceMemberPermissions(projectId, memberId, permissions)` → `ActionResponse<ResourcePermissions | null>`
- `getPlans()`, `getPlan(id)`, `getCmsResources()`, `createPlan(payload)`, `updatePlan(id, payload)`, `deletePlan(id)`

- [x] **Step 1:** `lib/cms-resources.ts`

```ts
export const CMS_RESOURCES = [
  "ACTION_BUTTONS", "AWARDS", "BANNERS", "EVENTS", "LOCATIONS",
  "MEDIA", "MENU_PRODUCTS", "OPENING_HOURS", "PRODUCT_CATEGORIES",
] as const;
export type CmsResource = (typeof CMS_RESOURCES)[number];
export type AccessLevel = "READ" | "WRITE";
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

export function routeAccess(pathname: string) {
  const [, , , , segment, ...rest] = pathname.split("/");
  const resource = SEGMENT_RESOURCES[segment ?? ""];
  if (!pathname.startsWith("/dashboard/projects/") || !resource) return null;
  return { resource, needsWrite: rest.some((s) => WRITE_SEGMENTS.has(s)) };
}

export const canRead = (p: ResourcePermissions, r: CmsResource) => p[r] !== undefined;
export const canWrite = (p: ResourcePermissions, r: CmsResource) => p[r] === "WRITE";
```

- [x] **Step 2:** `app/actions/content/permissions.ts` (`"use server"`, `mutationError` local como en
  `product-categories.ts`): `GET me/permissions`, `GET/PUT members/{m}/permissions` (el `PUT` hace
  `revalidatePath` del detalle y edición del miembro).
- [x] **Step 3:** `app/actions/content/plans.ts` (`"use server"`): CRUD con `revalidatePath("/dashboard/admin/plans")`.
  Tipo `Plan = { id: string; name: string; description?: string | null; resources: CmsResource[]; isActive?: boolean }`
  y `PlanPayload = { name: string; description?: string; resources: CmsResource[] }` en `types.ts`.
- [x] **Step 4:** `parse-api-error.ts`: agregar los mensajes de la tabla a `knownMessages` (antes del chequeo de
  `CONFLICT_DATA_INTEGRITY_VIOLATION`, que hoy devolvería el texto de migraciones para "plan en uso") y, para
  cualquier otro 403, título "Sin permiso".
- [x] **Step 5:** `npm run lint` → PASS.

### Task 2: Provider, guard de rutas y menú

**Files:**
- Create: `components/app/project-permissions.tsx`, `app/dashboard/projects/[projectId]/layout.tsx`
- Modify: `components/app/dashboard-shell.tsx`, `components/resource-lists/resource-row-actions.tsx`,
  `components/resource-lists/list-empty-state.tsx`, `app/actions/content/can-view-project-members.ts` (comentario)

**Produces:** `ProjectPermissionsProvider`, `useCanWrite(): boolean`, `WriteOnly`.

- [x] **Step 1:** `components/app/project-permissions.tsx`

```tsx
"use client";

const PermissionsContext = createContext<ResourcePermissions | null>(null);

export function ProjectPermissionsProvider({ permissions, children }: { permissions: ResourcePermissions | null; children: React.ReactNode }) {
  const route = routeAccess(usePathname());
  const allowed = !permissions || !route
    || (route.needsWrite ? canWrite(permissions, route.resource) : canRead(permissions, route.resource));
  return (
    <PermissionsContext.Provider value={permissions}>
      {allowed ? children : <NoAccessCard resource={route!.resource} write={route!.needsWrite} />}
    </PermissionsContext.Provider>
  );
}

export function useCanWrite() {
  const permissions = useContext(PermissionsContext);
  const route = routeAccess(usePathname());
  return !permissions || !route || canWrite(permissions, route.resource);
}

export function WriteOnly({ children }: { children: React.ReactNode }) {
  return useCanWrite() ? children : null;
}
```

`NoAccessCard`: tarjeta con "No tienes acceso a {label}" (o "Solo tienes permiso de lectura en {label}") y botón
"Volver al proyecto".

- [x] **Step 2:** layout del proyecto: `getMyPermissions(projectId)` → provider (`null` si error).
- [x] **Step 3:** `ResourceRowActions`: sin `useCanWrite()` solo muestra "Ver". `ListEmptyState`: sin permiso no muestra
  el botón de crear (pasa a `"use client"`; solo lo usan list clients).
- [x] **Step 4:** shell: estado `navPermissions: ResourcePermissions | null | undefined` cargado con `getMyPermissions`
  en el mismo efecto que el resumen del proyecto. `undefined` (cargando) → sección Contenido vacía; `null` (error) →
  todos los ítems; objeto → filtra por `canRead(p, routeAccess(item.href).resource)`. Ítem "Planes" (`/dashboard/admin/plans`,
  icono `Layers`) en Administración para `SUPER_ADMIN`. Corregir comentarios de miembros (solo `OWNER`).
- [x] **Step 5:** `npm run lint` → PASS.

### Task 3: Ocultar acciones de escritura en páginas y listas

**Files (modify):**
- Encabezados Crear/Ordenar con `<WriteOnly>`: `banners`, `products`, `categories`, `events`, `awards`, `media` (`page.tsx`).
- Botón Editar del detalle con `<WriteOnly>`: `awards/[awardId]`, `banners/[bannerId]`, `events/[eventId]`,
  `products/[productId]`, `locations/[locationId]` (`page.tsx`).
- List clients con edición en línea (`useCanWrite()` oculta "Nuevo" y las acciones de fila; en medios se mantiene
  "Ver"): `action-buttons-list-client.tsx`, `locations-list-client.tsx`, `opening-hours-list-client.tsx`,
  `media-list-client.tsx`; revisar también sus botones de orden en las páginas correspondientes.

- [x] **Step 1:** envolver/condicionar cada control listado.
- [x] **Step 2:** `npm run lint` → PASS.

### Task 4: Dashboard del proyecto sin caer a datos de ejemplo por un 403

**Files:** Modify `app/actions/content/get-project-content.ts`

- [x] **Step 1:** el proyecto sigue siendo obligatorio; las cuatro listas con `Promise.allSettled` → `[]` si fallan.
- [x] **Step 2:** `npm run lint` → PASS.

### Task 5: CRUD de planes (SUPER_ADMIN)

**Files:**
- Create: `app/dashboard/admin/plans/page.tsx`, `app/dashboard/admin/plans/new/page.tsx`,
  `app/dashboard/admin/plans/[planId]/edit/page.tsx`, `components/plans/plan-form.tsx`,
  `components/plans/plans-list-client.tsx`

- [x] **Step 1:** las tres páginas redirigen a `/dashboard` si no es `isSuperAdminRole`.
- [x] **Step 2:** lista: tabla con nombre, descripción, recursos (badges) y acciones Editar / Eliminar (confirmación;
  un 409 se muestra traducido con toast).
- [x] **Step 3:** `PlanForm` (React Hook Form + Zod como `CategoryForm`): nombre (1–100), descripción (≤500), casillas
  por recurso de `getCmsResources()` con `CMS_RESOURCE_LABELS`; al guardar vuelve a la lista.
- [x] **Step 4:** `npm run lint` → PASS.

### Task 6: Plan en el formulario de proyecto

**Files:** Modify `components/projects/project-form-card.tsx`, `app/dashboard/projects/new/page.tsx`,
`app/dashboard/projects/[projectId]/settings/page.tsx`, `app/actions/content/create.ts` (`createProject`,
`updateProject`)

- [x] **Step 1:** prop `plans: Plan[]`; campo `planId` obligatorio en Zod ("Selecciona un plan"), `Select` nativo,
  default `project.planId`. Enlace "Crear plan" si la lista está vacía.
- [x] **Step 2:** las acciones envían `planId` en `POST` y `PUT`.
- [x] **Step 3:** `npm run lint` → PASS.

### Task 7: Editor de permisos por miembro (OWNER)

**Files:**
- Create: `components/project-members/member-permissions-form.tsx`
- Modify: `app/dashboard/projects/[projectId]/members/[memberId]/edit/page.tsx`,
  `components/project-members/assign-project-member-dialog.tsx`

- [x] **Step 1:** en la edición, si `member.role !== "OWNER"`, cargar `getMemberPermissions` y `getMyPermissions`
  (las claves de este último son los recursos del plan, porque el owner/super admin los recibe todos en `WRITE`).
- [x] **Step 2:** formulario: una fila por recurso del plan con Sin acceso / Lectura / Escritura; guarda solo los
  distintos de "Sin acceso" con `replaceMemberPermissions`; toast y `router.refresh()`.
- [x] **Step 3:** aviso si `MENU_PRODUCTS` tiene acceso y `PRODUCT_CATEGORIES` no: "Productos necesita al menos
  lectura en Categorías".
- [x] **Step 4:** toast de "Miembro asignado": agregar que empieza sin acceso al contenido y que se asigna desde Editar.
- [x] **Step 5:** `npm run lint` → PASS.

### Task 8: Validación y cierre

- [x] `npm run lint`, `npm run build` → PASS.
- [x] API local (`:8080`) + `npm run dev`, con los datos de `scripts/plans-permissions-evidencia.sh`:
  - super admin: crear/editar/eliminar plan (409 si está en uso); crear proyecto con plan; editar plan del proyecto.
  - owner: ve Miembros; edita permisos de un miembro; ve el aviso de productos → categorías.
  - miembro con solo `EVENTS:READ`: menú con solo Eventos; sin Crear/Editar/Ordenar; `/events/new` y `/banners`
    muestran "Sin acceso"; sin menú Miembros.
- [x] `/content-hub-checks`, `graphify update .`, actualizar `docs/README.md` (changelog `v1.2`) y `package.json`
  (`1.13.0`).
- [x] Commit(s) solo con confirmación de Daniel.

---

## Changelog

| Versión | Fecha | Cambio |
|---------|-------|--------|
| `v1.1` | 2026-09-27 | Implementado y validado: lint, build y flujos contra el API local (miembro, owner, super admin) |
| `v1.0` | 2026-09-27 | Plan inicial aprobado (enfoque A: contexto + mapa de rutas) |
