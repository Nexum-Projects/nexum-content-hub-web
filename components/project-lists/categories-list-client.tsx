"use client";

import { Search, Tags } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { ProductCategory } from "@/app/actions/content";
import type { PaginatedPayload } from "@/app/actions/content/paginated-list-types";
import { deleteProductCategory } from "@/app/actions/content/delete-entities";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/radix-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { productTypeBadge, publishBadge } from "@/components/resource-lists/entity-badges";
import { ListEmptyState } from "@/components/resource-lists/list-empty-state";
import { ListPaginationFooter } from "@/components/resource-lists/list-pagination-footer";
import { ResourceFiltersSheet } from "@/components/resource-lists/resource-filters-sheet";
import { ResourceRowActions } from "@/components/resource-lists/resource-row-actions";
import { ListDateTimeGT } from "@/components/resource-lists/list-datetime-gt";
import { MENU_PRODUCT_TYPE_LABELS, MENU_PRODUCT_TYPES, humanizeMenuSection } from "@/lib/menu-product-type";
import { PRODUCT_CATEGORY_SORT_FIELDS } from "@/lib/project-list-query";

import { SortHeaderButton } from "./sort-header-button";
import { useProjectListNavigation } from "./use-project-list-navigation";

const DEFAULT_ORDER_BY = "sortOrder";

export function CategoriesListClient({
  projectId,
  categories,
  meta,
  listError,
  createHref,
}: {
  projectId: string;
  categories: ProductCategory[];
  meta: PaginatedPayload<ProductCategory>["meta"];
  listError?: string | null;
  createHref: string;
}) {
  const basePath = `/dashboard/projects/${projectId}/categories`;
  const { pushParams, isPending, searchParams } = useProjectListNavigation(basePath);

  const query = searchParams.get("query") ?? "";
  const pub = searchParams.get("pub") ?? "all";
  const ptype = searchParams.get("ptype") ?? "all";
  const [searchDraft, setSearchDraft] = useState(query);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentOrderBy = searchParams.get("orderBy") ?? DEFAULT_ORDER_BY;
  const safeOrderBy = (PRODUCT_CATEGORY_SORT_FIELDS as readonly string[]).includes(currentOrderBy)
    ? currentOrderBy
    : DEFAULT_ORDER_BY;
  const currentOrder = searchParams.get("order")?.toUpperCase() === "DESC" ? "DESC" : "ASC";

  useEffect(() => {
    const timeout = setTimeout(() => setSearchDraft(query), 0);
    return () => clearTimeout(timeout);
  }, [query]);

  const applySearch = useCallback(() => {
    const next = searchDraft.trim();
    if (next === query.trim()) {
      return;
    }
    pushParams({ query: next ? searchDraft : null });
  }, [pushParams, query, searchDraft]);

  useEffect(() => {
    const timeout = setTimeout(applySearch, 250);
    return () => clearTimeout(timeout);
  }, [applySearch]);

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
        actionLabel="Crear primera categoria"
        description="Organiza el menu y la mercancia con categorias por catalogo."
        icon={Tags}
        title="Aun no hay categorias"
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
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Buscar por nombre o slug…"
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
                <p className="text-xs font-medium text-muted-foreground">Catalogo</p>
                <Select disabled={isPending} onValueChange={(v) => pushParams({ ptype: v === "all" ? null : v })} value={ptype}>
                  <SelectTrigger className="h-9 rounded-lg text-sm">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {MENU_PRODUCT_TYPES.map((kind) => (
                      <SelectItem key={kind} value={kind}>
                        {MENU_PRODUCT_TYPE_LABELS[kind]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ResourceFiltersSheet>
        </div>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>
                <SortHeaderButton
                  currentOrder={currentOrder}
                  currentOrderBy={safeOrderBy}
                  field="name"
                  label="Nombre"
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>Catalogo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>
                <SortHeaderButton
                  currentOrder={currentOrder}
                  currentOrderBy={safeOrderBy}
                  field="updatedAt"
                  label="Actualizado"
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="w-24 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell className="py-10 text-center text-sm text-muted-foreground" colSpan={5}>
                  No hay resultados con esos filtros.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((item) => {
                const editHref = `${basePath}/${item.id}/edit`;
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.slug}</p>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {productTypeBadge(item.catalogKind)}
                        {item.catalogKind === "MENU_ITEM" && item.menuSection ? (
                          <p className="text-xs text-muted-foreground">{humanizeMenuSection(item.menuSection)}</p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{publishBadge(item.isPublished)}</TableCell>
                    <TableCell>
                      <ListDateTimeGT value={item.updatedAt} />
                    </TableCell>
                    <TableCell className="text-right">
                      <ResourceRowActions
                        deleteConfirmMessage="La categoria se desactiva. Los productos no se borran."
                        editHref={editHref}
                        onDelete={async () => {
                          const result = await deleteProductCategory(projectId, item.id);
                          if (result.status === "error") {
                            return { status: "error", message: result.errors[0]?.message };
                          }
                          return { status: "success" };
                        }}
                        viewHref={editHref}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ListPaginationFooter
        entityLabel="categorias"
        isPending={isPending}
        meta={meta}
        onLimitChange={(n) => pushParams({ limit: String(n), page: "1" })}
        onPageChange={(p) => pushParams({ page: String(p) })}
      />
    </div>
  );
}
