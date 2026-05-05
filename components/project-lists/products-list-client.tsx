"use client";

import { ImageIcon, LayoutGrid, PanelLeft, Search, UtensilsCrossed } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { MenuProduct } from "@/app/actions/content";
import type { PaginatedPayload } from "@/app/actions/content/paginated-list-types";
import { deleteMenuProduct } from "@/app/actions/content/delete-entities";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/radix-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { featuredBadge, productTypeBadge, publishBadge } from "@/components/resource-lists/entity-badges";
import { ListEmptyState } from "@/components/resource-lists/list-empty-state";
import { ListPaginationFooter } from "@/components/resource-lists/list-pagination-footer";
import { ListThumbnail, listPlaceholderGradientClass } from "@/components/resource-lists/list-thumbnail";
import { ResourceFiltersSheet } from "@/components/resource-lists/resource-filters-sheet";
import { ResourceRowActions } from "@/components/resource-lists/resource-row-actions";
import { ListDateTimeGT } from "@/components/resource-lists/list-datetime-gt";
import { cn } from "@/lib/utils";
import { MENU_PRODUCT_SORT_FIELDS } from "@/lib/project-list-query";
import { formatPrice } from "@/app/dashboard/projects/project-components";

import { SortHeaderButton } from "./sort-header-button";
import { useProjectListNavigation } from "./use-project-list-navigation";

const DEFAULT_ORDER_BY = "sortOrder";

function subtitle(p: MenuProduct) {
  return p.slug?.trim() || p.description?.replace(/<[^>]*>/g, " ").trim().slice(0, 90) || "Sin detalle";
}

export function ProductsListClient({
  projectId,
  products,
  meta,
  listError,
  createHref,
}: {
  projectId: string;
  products: MenuProduct[];
  meta: PaginatedPayload<MenuProduct>["meta"];
  listError?: string | null;
  createHref: string;
}) {
  const basePath = `/dashboard/projects/${projectId}/products`;
  const { pushParams, isPending, searchParams } = useProjectListNavigation(basePath);

  const query = searchParams.get("query") ?? "";
  const pub = searchParams.get("pub") ?? "all";
  const ptype = searchParams.get("ptype") ?? "all";
  const [searchDraft, setSearchDraft] = useState(query);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<number | null>(null);

  const currentOrderBy = searchParams.get("orderBy") ?? DEFAULT_ORDER_BY;
  const safeOrderBy = (MENU_PRODUCT_SORT_FIELDS as readonly string[]).includes(currentOrderBy)
    ? currentOrderBy
    : DEFAULT_ORDER_BY;
  const currentOrder = searchParams.get("order")?.toUpperCase() === "DESC" ? "DESC" : "ASC";

  useEffect(() => {
    const timeout = setTimeout(() => setSearchDraft(query), 0);
    return () => clearTimeout(timeout);
  }, [query]);

  const applySearch = useCallback(() => {
    const next = searchDraft.trim();
    const current = query.trim();
    if (next === current) {
      return;
    }
    pushParams({ query: next ? searchDraft : null });
  }, [pushParams, query, searchDraft]);

  useEffect(() => {
    const next = searchDraft.trim();
    const current = query.trim();
    if (next === current) {
      return;
    }
    const timeout = setTimeout(() => {
      applySearch();
    }, 250);
    return () => clearTimeout(timeout);
  }, [applySearch, query, searchDraft]);

  useEffect(() => {
    if (document.activeElement !== searchInputRef.current) {
      searchInputRef.current?.focus({ preventScroll: true });
      const pos = caretRef.current;
      if (typeof pos === "number") {
        searchInputRef.current?.setSelectionRange(pos, pos);
      }
    }
  }, [query]);

  const handleSort = (field: string) => {
    const newOrder = safeOrderBy === field && currentOrder === "ASC" ? "DESC" : "ASC";
    pushParams({ orderBy: field, order: newOrder });
  };

  const clearFilters = () => {
    pushParams({ query: null, pub: null, ptype: null, page: "1" });
  };

  const isFiltered = Boolean(query.trim()) || pub !== "all" || ptype !== "all";
  const activeFiltersCount = (query.trim() ? 1 : 0) + (pub !== "all" ? 1 : 0) + (ptype !== "all" ? 1 : 0);

  if (!listError && meta.totalObjects === 0 && !isFiltered) {
    return (
      <ListEmptyState
        actionHref={createHref}
        actionLabel="Crear primer producto"
        description="Anade platos y bebidas al menu digital de tu proyecto."
        icon={UtensilsCrossed}
        title="Aun no hay registros"
      />
    );
  }

  return (
    <div className="space-y-4">
      {listError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {listError}
        </p>
      ) : null}

      <Card className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 rounded-lg pl-9 text-sm"
              onChange={(e) => {
                caretRef.current = e.currentTarget.selectionStart;
                setSearchDraft(e.target.value);
              }}
              placeholder="Buscar por nombre, slug o descripcion…"
              ref={searchInputRef}
              value={searchDraft}
            />
          </div>
          <ResourceFiltersSheet activeFiltersCount={activeFiltersCount} onClear={clearFilters}>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Estado</p>
                <Select disabled={isPending} onValueChange={(v) => pushParams({ pub: v === "all" ? null : v })} value={pub}>
                  <SelectTrigger className="h-9 rounded-lg text-sm">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                    <SelectItem value="draft">Borrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Tipo</p>
                <Select disabled={isPending} onValueChange={(v) => pushParams({ ptype: v === "all" ? null : v })} value={ptype}>
                  <SelectTrigger className="h-9 rounded-lg text-sm">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="FOOD">Comida</SelectItem>
                    <SelectItem value="DRINK">Bebida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ResourceFiltersSheet>
        </div>
      </Card>

      <Tabs className="w-full" defaultValue="table">
        <TabsList className="h-9 rounded-lg bg-muted/80 p-1">
          <TabsTrigger className="gap-1.5 rounded-md text-sm" value="table">
            <PanelLeft className="h-3.5 w-3.5" />
            Tabla
          </TabsTrigger>
          <TabsTrigger className="gap-1.5 rounded-md text-sm" value="cards">
            <LayoutGrid className="h-3.5 w-3.5" />
            Tarjetas
          </TabsTrigger>
        </TabsList>

        <TabsContent className="mt-4" value="table">
          <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[100px]">Vista</TableHead>
                  <TableHead>
                    <SortHeaderButton
                      currentOrder={currentOrder}
                      currentOrderBy={safeOrderBy}
                      field="name"
                      label="Nombre"
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>
                    <SortHeaderButton
                      currentOrder={currentOrder}
                      currentOrderBy={safeOrderBy}
                      field="priceCents"
                      label="Precio"
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>
                    <SortHeaderButton
                      currentOrder={currentOrder}
                      currentOrderBy={safeOrderBy}
                      field="createdAt"
                      label="Creación"
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead>
                    <SortHeaderButton
                      currentOrder={currentOrder}
                      currentOrderBy={safeOrderBy}
                      field="updatedAt"
                      label="Actualización"
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[120px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-28 text-center text-muted-foreground" colSpan={8}>
                      Sin resultados con los filtros actuales.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => (
                    <TableRow className="text-sm" key={p.id}>
                      <TableCell>
                        <ListThumbnail alt={p.name} seed={p.id} src={p.imageUrl} />
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-foreground">{p.name}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{subtitle(p)}</p>
                      </TableCell>
                      <TableCell>{productTypeBadge(p.type)}</TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">{formatPrice(p.priceCents)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          {publishBadge(p.isPublished)}
                          {featuredBadge(p.isFeatured)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ListDateTimeGT value={p.createdAt} />
                      </TableCell>
                      <TableCell>
                        <ListDateTimeGT value={p.updatedAt} />
                      </TableCell>
                      <TableCell className="text-right">
                        <ResourceRowActions
                          editHref={`/dashboard/projects/${projectId}/products/${p.id}/edit`}
                          onDelete={async () => {
                            const r = await deleteMenuProduct(projectId, p.id);
                            if (r.status === "error") {
                              return { status: "error" as const, message: r.errors[0]?.message };
                            }
                            return { status: "success" as const };
                          }}
                          viewHref={`/dashboard/projects/${projectId}/products/${p.id}`}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {products.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Sin resultados.</p>
            ) : (
              products.map((p) => (
                <Card className="rounded-xl border border-border bg-card p-4 shadow-sm" key={p.id}>
                  <div className="flex gap-3">
                    <ListThumbnail alt={p.name} seed={p.id} src={p.imageUrl} />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-medium leading-snug">{p.name}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{subtitle(p)}</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {productTypeBadge(p.type)}
                        {publishBadge(p.isPublished)}
                        {featuredBadge(p.isFeatured)}
                      </div>
                      <p className="text-xs text-muted-foreground">{formatPrice(p.priceCents)}</p>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-1 text-[11px] text-muted-foreground">
                        <span>
                          <span className="font-medium text-foreground/80">Creación:</span>{" "}
                          <ListDateTimeGT value={p.createdAt} />
                        </span>
                        <span>
                          <span className="font-medium text-foreground/80">Actual.:</span>{" "}
                          <ListDateTimeGT value={p.updatedAt} />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end border-t border-border pt-3">
                    <ResourceRowActions
                      editHref={`/dashboard/projects/${projectId}/products/${p.id}/edit`}
                      onDelete={async () => {
                        const r = await deleteMenuProduct(projectId, p.id);
                        if (r.status === "error") {
                          return { status: "error" as const, message: r.errors[0]?.message };
                        }
                        return { status: "success" as const };
                      }}
                      viewHref={`/dashboard/projects/${projectId}/products/${p.id}`}
                    />
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent className="mt-4" value="cards">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.length === 0 ? (
              <p className="col-span-full py-8 text-center text-sm text-muted-foreground">Sin resultados.</p>
            ) : (
              products.map((p) => (
                <Card className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm" key={p.id}>
                  <div
                    className={cn(
                      "relative aspect-[16/9] w-full overflow-hidden",
                      p.imageUrl ? "bg-muted" : cn("flex items-center justify-center text-white/90", listPlaceholderGradientClass(p.id)),
                    )}
                  >
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" className="h-full w-full object-cover" src={p.imageUrl} />
                    ) : (
                      <ImageIcon aria-hidden className="h-10 w-10 opacity-90 drop-shadow-sm" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <p className="line-clamp-2 font-medium leading-snug">{p.name}</p>
                    <div className="flex flex-wrap gap-1">
                      {productTypeBadge(p.type)}
                      {publishBadge(p.isPublished)}
                      {featuredBadge(p.isFeatured)}
                    </div>
                    <p className="text-sm text-muted-foreground">{formatPrice(p.priceCents)}</p>
                    <div className="grid grid-cols-1 gap-0.5 text-[11px] text-muted-foreground sm:grid-cols-2">
                      <span>
                        <span className="font-medium text-foreground/80">Creación:</span>{" "}
                        <ListDateTimeGT value={p.createdAt} />
                      </span>
                      <span>
                        <span className="font-medium text-foreground/80">Actualización:</span>{" "}
                        <ListDateTimeGT value={p.updatedAt} />
                      </span>
                    </div>
                    <div className="mt-auto flex justify-end border-t border-border pt-3">
                      <ResourceRowActions
                        editHref={`/dashboard/projects/${projectId}/products/${p.id}/edit`}
                        onDelete={async () => {
                          const r = await deleteMenuProduct(projectId, p.id);
                          if (r.status === "error") {
                            return { status: "error" as const, message: r.errors[0]?.message };
                          }
                          return { status: "success" as const };
                        }}
                        viewHref={`/dashboard/projects/${projectId}/products/${p.id}`}
                      />
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ListPaginationFooter
        entityLabel="productos"
        isPending={isPending}
        meta={meta}
        onLimitChange={(n) => pushParams({ limit: String(n), page: "1" })}
        onPageChange={(p) => pushParams({ page: String(p) })}
      />
    </div>
  );
}
