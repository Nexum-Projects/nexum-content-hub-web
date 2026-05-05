"use client";

import { ImageIcon, LayoutGrid, PanelLeft, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { Banner } from "@/app/actions/content";
import type { PaginatedPayload } from "@/app/actions/content/paginated-list-types";
import { deleteBanner } from "@/app/actions/content/delete-entities";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/radix-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListEmptyState } from "@/components/resource-lists/list-empty-state";
import { ListPaginationFooter } from "@/components/resource-lists/list-pagination-footer";
import { ListThumbnail, listPlaceholderGradientClass } from "@/components/resource-lists/list-thumbnail";
import { ResourceFiltersSheet } from "@/components/resource-lists/resource-filters-sheet";
import { ResourceRowActions } from "@/components/resource-lists/resource-row-actions";
import { ListDateTimeGT } from "@/components/resource-lists/list-datetime-gt";
import { cn } from "@/lib/utils";
import { publishBadge } from "@/components/resource-lists/entity-badges";
import { BANNER_SORT_FIELDS } from "@/lib/project-list-query";
import { SortHeaderButton } from "./sort-header-button";
import { useProjectListNavigation } from "./use-project-list-navigation";

const DEFAULT_ORDER_BY = "sortOrder";

function plainSnippet(html?: string | null, max = 90) {
  if (!html) {
    return "";
  }
  const t = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export function BannersListClient({
  projectId,
  banners,
  meta,
  listError,
  createHref,
}: {
  projectId: string;
  banners: Banner[];
  meta: PaginatedPayload<Banner>["meta"];
  listError?: string | null;
  createHref: string;
}) {
  const basePath = `/dashboard/projects/${projectId}/banners`;
  const { pushParams, isPending, searchParams } = useProjectListNavigation(basePath);

  const query = searchParams.get("query") ?? "";
  const pub = searchParams.get("pub") ?? "all";
  const [searchDraft, setSearchDraft] = useState(query);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<number | null>(null);

  const currentOrderBy = searchParams.get("orderBy") ?? DEFAULT_ORDER_BY;
  const safeOrderBy = (BANNER_SORT_FIELDS as readonly string[]).includes(currentOrderBy)
    ? currentOrderBy
    : DEFAULT_ORDER_BY;
  const currentOrder = searchParams.get("order")?.toUpperCase() === "DESC" ? "DESC" : "ASC";

  useEffect(() => {
    setSearchDraft(query);
  }, [query]);

  const applySearch = () => {
    const next = searchDraft.trim();
    const current = query.trim();
    if (next === current) {
      return;
    }
    pushParams({ query: next ? searchDraft : null });
  };

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
  }, [query, searchDraft]);

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
    pushParams({ query: null, pub: null, page: "1" });
  };

  const isFiltered = Boolean(query.trim()) || pub !== "all";
  const activeFiltersCount = (query.trim() ? 1 : 0) + (pub !== "all" ? 1 : 0);

  if (!listError && meta.totalObjects === 0 && !isFiltered) {
    return (
      <ListEmptyState
        actionHref={createHref}
        actionLabel="Crear primer banner"
        description="Crea un banner para mostrarlo en la landing de tu proyecto."
        icon={ImageIcon}
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
              placeholder="Buscar por titulo o descripcion…"
              ref={searchInputRef}
              value={searchDraft}
            />
          </div>
          <ResourceFiltersSheet activeFiltersCount={activeFiltersCount} onClear={clearFilters}>
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
                      field="title"
                      label="Titulo"
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
                {banners.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-28 text-center text-muted-foreground" colSpan={7}>
                      Sin resultados con los filtros actuales.
                    </TableCell>
                  </TableRow>
                ) : (
                  banners.map((banner) => (
                    <TableRow className="text-sm" key={banner.id}>
                      <TableCell>
                        <ListThumbnail alt={banner.title} seed={banner.id} src={banner.imageUrl} />
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-foreground">{banner.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {plainSnippet(banner.description) || "Sin descripcion"}
                        </p>
                      </TableCell>
                      <TableCell>{publishBadge(banner.isPublished)}</TableCell>
                      <TableCell>
                        <ListDateTimeGT value={banner.createdAt} />
                      </TableCell>
                      <TableCell>
                        <ListDateTimeGT value={banner.updatedAt} />
                      </TableCell>
                      <TableCell className="text-right">
                        <ResourceRowActions
                          editHref={`/dashboard/projects/${projectId}/banners/${banner.id}/edit`}
                          onDelete={async () => {
                            const r = await deleteBanner(projectId, banner.id);
                            if (r.status === "error") {
                              return { status: "error" as const, message: r.errors[0]?.message };
                            }
                            return { status: "success" as const };
                          }}
                          viewHref={`/dashboard/projects/${projectId}/banners/${banner.id}`}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {banners.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Sin resultados.</p>
            ) : (
              banners.map((banner) => (
                <Card className="rounded-xl border border-border bg-card p-4 shadow-sm" key={banner.id}>
                  <div className="flex gap-3">
                    <ListThumbnail alt={banner.title} seed={banner.id} src={banner.imageUrl} />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-medium leading-snug">{banner.title}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {plainSnippet(banner.description) || "Sin descripcion"}
                      </p>
                      <div className="flex flex-wrap items-center gap-1 pt-1">{publishBadge(banner.isPublished)}</div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-1 text-[11px] text-muted-foreground">
                        <span>
                          <span className="font-medium text-foreground/80">Creación:</span>{" "}
                          <ListDateTimeGT value={banner.createdAt} />
                        </span>
                        <span>
                          <span className="font-medium text-foreground/80">Actual.:</span>{" "}
                          <ListDateTimeGT value={banner.updatedAt} />
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end border-t border-border pt-3">
                    <ResourceRowActions
                      editHref={`/dashboard/projects/${projectId}/banners/${banner.id}/edit`}
                      onDelete={async () => {
                        const r = await deleteBanner(projectId, banner.id);
                        if (r.status === "error") {
                          return { status: "error" as const, message: r.errors[0]?.message };
                        }
                        return { status: "success" as const };
                      }}
                      viewHref={`/dashboard/projects/${projectId}/banners/${banner.id}`}
                    />
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent className="mt-4" value="cards">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {banners.length === 0 ? (
              <p className="col-span-full py-8 text-center text-sm text-muted-foreground">Sin resultados.</p>
            ) : (
              banners.map((banner) => (
                <Card className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm" key={banner.id}>
                  <div
                    className={cn(
                      "relative aspect-[16/9] w-full overflow-hidden",
                      banner.imageUrl ? "bg-muted" : cn("flex items-center justify-center text-white/90", listPlaceholderGradientClass(banner.id)),
                    )}
                  >
                    {banner.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" className="h-full w-full object-cover" src={banner.imageUrl} />
                    ) : (
                      <ImageIcon aria-hidden className="h-10 w-10 opacity-90 drop-shadow-sm" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <p className="line-clamp-2 font-medium leading-snug">{banner.title}</p>
                    <div className="flex flex-wrap gap-1">{publishBadge(banner.isPublished)}</div>
                    <div className="grid grid-cols-1 gap-0.5 text-[11px] text-muted-foreground sm:grid-cols-2">
                      <span>
                        <span className="font-medium text-foreground/80">Creación:</span>{" "}
                        <ListDateTimeGT value={banner.createdAt} />
                      </span>
                      <span>
                        <span className="font-medium text-foreground/80">Actualización:</span>{" "}
                        <ListDateTimeGT value={banner.updatedAt} />
                      </span>
                    </div>
                    <div className="mt-auto flex justify-end border-t border-border pt-3">
                      <ResourceRowActions
                        editHref={`/dashboard/projects/${projectId}/banners/${banner.id}/edit`}
                        onDelete={async () => {
                          const r = await deleteBanner(projectId, banner.id);
                          if (r.status === "error") {
                            return { status: "error" as const, message: r.errors[0]?.message };
                          }
                          return { status: "success" as const };
                        }}
                        viewHref={`/dashboard/projects/${projectId}/banners/${banner.id}`}
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
        entityLabel="banners"
        isPending={isPending}
        meta={meta}
        onLimitChange={(n) => pushParams({ limit: String(n), page: "1" })}
        onPageChange={(p) => pushParams({ page: String(p) })}
      />
    </div>
  );
}
