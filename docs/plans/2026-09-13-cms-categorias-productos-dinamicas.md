# Categorías dinámicas en el CMS — plan de implementación

**Versión:** `v1.1`  
**Fecha:** 2026-09-13  
**Ambiente:** nexum-content-hub-front, rama `feature/dynamic-product-categories`  
**Dirigido a:** equipo de desarrollo Content Hub

> **Para agentes:** implementar este plan tarea por tarea. No mezclar el
> landing en esta entrega. El contrato del API ya está en
> `content-hub-api` PR #1.

**Goal:** El CMS deja de usar el enum `MENU_PRODUCT_CATEGORIES` como fuente
de verdad. Lista, crea, edita, publica y reordena categorías por proyecto, y
los productos envían `categoryId`.

**Architecture:** Copiar el CRUD de eventos/logros. Las categorías viven en
`/dashboard/projects/{projectId}/categories`. El select de producto filtra
por `catalogKind` = `type` del producto.

**Tech Stack:** Next.js App Router, server actions, axios, react-hook-form,
zod. API: `/api/admin/projects/{projectId}/product-categories`.

**Spec:** este documento + plan API
`content-hub-api@feature/dynamic-product-categories:docs/plans/2026-09-13-categorias-productos-dinamicas.md` §6 y §9.

## Global Constraints

- No inventar endpoints. Admin bajo `/admin/projects/{projectId}/product-categories`.
- Enviar `categoryId`. No enviar `menuCategory` en create/update.
- `catalogKind` no se cambia en edit (el API no mueve una categoría de catálogo).
- Soft delete = DELETE del API (`is_active=false`).
- Landing queda fuera de este plan.
- No commitear `.env` ni `.DS_Store`.

---

## 1. Contrato que consume el CMS

```
GET    /admin/projects/{projectId}/product-categories
GET    /admin/projects/{projectId}/product-categories/next-sort-order?catalogKind=
PUT    /admin/projects/{projectId}/product-categories/reorder
GET    /admin/projects/{projectId}/product-categories/{id}
POST   /admin/projects/{projectId}/product-categories
PUT    /admin/projects/{projectId}/product-categories/{id}
DELETE /admin/projects/{projectId}/product-categories/{id}
PUT    /admin/projects/{projectId}/product-categories/{id}/publish
PUT    /admin/projects/{projectId}/product-categories/{id}/unpublish
```

Create/update body: `name`, `catalogKind`, `description?`, `imageUrl?`,
`isPublished?`.

Producto: `categoryId` (UUID). Gana sobre `menuCategory`. Mismatch de
catálogo → 400.

---

## 2. Archivos

| Acción | Ruta |
|--------|------|
| Crear | `docs/plans/2026-09-13-cms-categorias-productos-dinamicas.md` |
| Crear | `app/actions/content/product-categories.ts` |
| Crear | `components/categories/category-form.tsx` |
| Crear | `components/project-lists/categories-list-client.tsx` |
| Crear | `components/reorder/categories-reorder-client.tsx` |
| Crear | `app/dashboard/projects/[projectId]/categories/page.tsx` |
| Crear | `app/dashboard/projects/[projectId]/categories/new/page.tsx` |
| Crear | `app/dashboard/projects/[projectId]/categories/[categoryId]/edit/page.tsx` |
| Crear | `app/dashboard/projects/[projectId]/categories/order/page.tsx` |
| Modificar | `app/actions/content/types.ts` — `ProductCategory`, `categoryId` en producto |
| Modificar | `app/actions/content/create.ts` — payload `categoryId` |
| Modificar | `lib/project-list-query.ts` — `pcat` es UUID |
| Modificar | `components/products/product-form.tsx` — select dinámico |
| Modificar | `components/content/content-edit-forms.tsx` — igual en edit |
| Modificar | `components/app/dashboard-shell.tsx` — nav Categorías |
| Modificar | badges / listado / reorder de productos — mostrar `category.name` |

---

## 3. Tareas

### Task 1: Tipos y actions

- [x] Tipo `ProductCategory` + `categoryId` / `category` en `MenuProduct`.
- [x] Fetch list/detail, create, update, delete, reorder.
- [x] Productos envían `categoryId`.

### Task 2: Pantalla de categorías

- [x] Lista (filtro `catalogKind` + publicado), crear, editar, ordenar.
- [x] Item de nav "Categorías" junto a Menú / Productos.

### Task 3: Productos

- [x] Select filtrado por `type` = `catalogKind`.
- [x] Filtro de listado por `categoryId`.
- [x] Badge con `category.name` (fallback al enum deprecado).

### Task 4: Fuera de alcance

- Landing (`cafe-de-reyes-landing-page`).
- Quitar el enum del CMS (se deja para fallback de lectura).

---

## Changelog

| Versión | Fecha | Cambio |
|---------|-------|--------|
| `v1.1` | 2026-09-13 | Implementado en CMS. App `1.10.0`. Landing sigue fuera. |
| `v1.0` | 2026-09-13 | Plan inicial: CRUD CMS + `categoryId` en productos |
