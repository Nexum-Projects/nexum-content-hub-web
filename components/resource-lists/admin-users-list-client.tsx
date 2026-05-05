"use client";

import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { User } from "@/app/actions/content";
import { deleteUser } from "@/app/actions/content/delete-entities";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/radix-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortHeaderButton } from "@/components/project-lists/sort-header-button";
import { ListPaginationFooter } from "@/components/resource-lists/list-pagination-footer";
import { ResourceFiltersSheet } from "@/components/resource-lists/resource-filters-sheet";
import { ResourceRowActions } from "@/components/resource-lists/resource-row-actions";
import { useProjectListNavigation } from "@/components/project-lists/use-project-list-navigation";
import { resolveAvatarUrl } from "@/lib/utils";
import { coerceListLimit } from "@/lib/project-list-query";
import { humanizePlatformRole } from "@/utils/helpers/humanize-enum";

const USER_ORDER_FIELDS = ["name", "email", "platformRole", "isActive", "createdAt"] as const;
type UserOrderField = (typeof USER_ORDER_FIELDS)[number];

function safeOrderBy(raw: string | null): UserOrderField {
  if (raw && (USER_ORDER_FIELDS as readonly string[]).includes(raw)) {
    return raw as UserOrderField;
  }
  return "name";
}

function dateToEpoch(value?: string): number {
  if (!value) {
    return 0;
  }
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseBoolFilter(value: string | null): "all" | "active" | "inactive" {
  if (value === "active" || value === "inactive") {
    return value;
  }
  return "all";
}

export function AdminUsersListClient({ users }: { users: User[] }) {
  const basePath = "/dashboard/admin/users";
  const { pushParams, isPending, searchParams } = useProjectListNavigation(basePath);

  const query = searchParams.get("query") ?? "";
  const role = searchParams.get("urole") ?? "all";
  const status = parseBoolFilter(searchParams.get("ustatus"));
  const [searchDraft, setSearchDraft] = useState(query);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<number | null>(null);
  const orderBy = safeOrderBy(searchParams.get("orderBy"));
  const order = searchParams.get("order")?.toUpperCase() === "DESC" ? "DESC" : "ASC";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = coerceListLimit(searchParams.get("limit") ?? undefined);

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

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    let items = users.filter((user) => {
      if (!term) {
        return true;
      }
      return (
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        humanizePlatformRole(user.platformRole).toLowerCase().includes(term)
      );
    });

    if (role !== "all") {
      items = items.filter((user) => user.platformRole === role);
    }
    if (status === "active") {
      items = items.filter((user) => user.isActive !== false);
    } else if (status === "inactive") {
      items = items.filter((user) => user.isActive === false);
    }

    return items;
  }, [query, role, status, users]);

  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers];
    sorted.sort((a, b) => {
      let result = 0;
      switch (orderBy) {
        case "name":
          result = a.name.localeCompare(b.name, "es", { sensitivity: "base" });
          break;
        case "email":
          result = a.email.localeCompare(b.email, "es", { sensitivity: "base" });
          break;
        case "platformRole":
          result = humanizePlatformRole(a.platformRole).localeCompare(humanizePlatformRole(b.platformRole), "es", {
            sensitivity: "base",
          });
          break;
        case "isActive":
          result = Number(a.isActive !== false) - Number(b.isActive !== false);
          break;
        case "createdAt":
          result = dateToEpoch(a.createdAt) - dateToEpoch(b.createdAt);
          break;
      }
      return order === "ASC" ? result : -result;
    });
    return sorted;
  }, [filteredUsers, order, orderBy]);

  const totalObjects = sortedUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalObjects / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const paginatedUsers = sortedUsers.slice(start, start + limit);

  const meta = {
    page: safePage,
    limit,
    totalObjects,
    totalPages,
    hasPreviousPage: safePage > 1,
    hasNextPage: safePage < totalPages,
  };

  const activeFiltersCount = (query.trim() ? 1 : 0) + (role !== "all" ? 1 : 0) + (status !== "all" ? 1 : 0);

  const handleSort = (field: string) => {
    const nextOrder = orderBy === field && order === "ASC" ? "DESC" : "ASC";
    pushParams({ orderBy: field, order: nextOrder });
  };

  return (
    <div className="space-y-4">
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
              placeholder="Buscar por nombre, correo o rol…"
              ref={searchInputRef}
              value={searchDraft}
            />
          </div>

          <ResourceFiltersSheet
            activeFiltersCount={activeFiltersCount}
            onClear={() => pushParams({ query: null, urole: null, ustatus: null, page: "1" })}
          >
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Rol</p>
              <Select disabled={isPending} onValueChange={(v) => pushParams({ urole: v === "all" ? null : v })} value={role}>
                <SelectTrigger className="h-9 rounded-lg text-sm">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="SUPER_ADMIN">{humanizePlatformRole("SUPER_ADMIN")}</SelectItem>
                  <SelectItem value="USER">{humanizePlatformRole("USER")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Estado</p>
              <Select
                disabled={isPending}
                onValueChange={(v) => pushParams({ ustatus: v === "all" ? null : v })}
                value={status}
              >
                <SelectTrigger className="h-9 rounded-lg text-sm">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </ResourceFiltersSheet>
        </div>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>
                <SortHeaderButton currentOrder={order} currentOrderBy={orderBy} field="name" label="Usuario" onSort={handleSort} />
              </TableHead>
              <TableHead>
                <SortHeaderButton currentOrder={order} currentOrderBy={orderBy} field="email" label="Correo" onSort={handleSort} />
              </TableHead>
              <TableHead>
                <SortHeaderButton
                  currentOrder={order}
                  currentOrderBy={orderBy}
                  field="platformRole"
                  label="Rol"
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                <SortHeaderButton
                  currentOrder={order}
                  currentOrderBy={orderBy}
                  field="isActive"
                  label="Estado"
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead>
                <SortHeaderButton
                  currentOrder={order}
                  currentOrderBy={orderBy}
                  field="createdAt"
                  label="Creación"
                  onSort={handleSort}
                />
              </TableHead>
              <TableHead className="w-[120px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell className="h-24 text-center text-muted-foreground" colSpan={6}>
                  Sin resultados con los filtros actuales.
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => {
                const avatar = resolveAvatarUrl(user);
                const roleLabel = humanizePlatformRole(user.platformRole);
                return (
                  <TableRow className="text-sm" key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                          {avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element -- URL remota del CMS
                            <img alt={`Avatar de ${user.name}`} className="absolute inset-0 h-full w-full object-cover" src={avatar} />
                          ) : (
                            String(user.name).slice(0, 1).toUpperCase()
                          )}
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.platformRole === "SUPER_ADMIN" ? "default" : "secondary"}>{roleLabel}</Badge>
                    </TableCell>
                    <TableCell>{user.isActive === false ? <Badge variant="destructive">Inactivo</Badge> : <Badge variant="success">Activo</Badge>}</TableCell>
                    <TableCell className="text-muted-foreground">{user.createdAt ? new Date(user.createdAt).toLocaleDateString("es-GT") : "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <ResourceRowActions
                        deleteConfirmMessage="¿Desactivar este usuario? Esta accion lo inhabilita para iniciar sesion."
                        editHref={`/dashboard/admin/users/${user.id}/edit`}
                        onDelete={async () => {
                          const r = await deleteUser(user.id);
                          if (r.status === "error") {
                            return { status: "error" as const, message: r.errors[0]?.message };
                          }
                          return { status: "success" as const };
                        }}
                        viewHref={`/dashboard/admin/users/${user.id}`}
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
        entityLabel="usuarios"
        isPending={isPending}
        meta={meta}
        onLimitChange={(n) => pushParams({ limit: String(n), page: "1" })}
        onPageChange={(p) => pushParams({ page: String(p) })}
      />
    </div>
  );
}
