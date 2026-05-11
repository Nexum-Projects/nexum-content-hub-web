"use client";

import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { ProjectMember, User } from "@/app/actions/content";
import { deleteProjectMember } from "@/app/actions/content/delete-entities";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/radix-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortHeaderButton } from "@/components/project-lists/sort-header-button";
import { ListDateTimeGT } from "@/components/resource-lists/list-datetime-gt";
import { ListPaginationFooter } from "@/components/resource-lists/list-pagination-footer";
import { ResourceFiltersSheet } from "@/components/resource-lists/resource-filters-sheet";
import { ResourceRowActions } from "@/components/resource-lists/resource-row-actions";
import { useProjectListNavigation } from "@/components/project-lists/use-project-list-navigation";
import { resolveAvatarUrl } from "@/lib/utils";
import { coerceListLimit } from "@/lib/project-list-query";
import { humanizeProjectMemberRole } from "@/utils/helpers/humanize-enum";

export type ProjectMemberRow = {
  member: ProjectMember;
  user: User | null;
};

const MEMBER_ORDER_FIELDS = ["name", "email", "role", "isActive", "createdAt"] as const;
type MemberOrderField = (typeof MEMBER_ORDER_FIELDS)[number];

function safeOrderBy(raw: string | null): MemberOrderField {
  if (raw && (MEMBER_ORDER_FIELDS as readonly string[]).includes(raw)) {
    return raw as MemberOrderField;
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

function roleBadgeVariant(role: ProjectMember["role"]): "default" | "secondary" | "outline" {
  switch (role) {
    case "OWNER":
      return "default";
    case "ADMIN":
      return "secondary";
    default:
      return "outline";
  }
}

export function ProjectMembersListClient({ projectId, rows }: { projectId: string; rows: ProjectMemberRow[] }) {
  const basePath = `/dashboard/projects/${projectId}/members`;
  const { pushParams, isPending, searchParams } = useProjectListNavigation(basePath);

  const query = searchParams.get("query") ?? "";
  const roleFilter = searchParams.get("mrole") ?? "all";
  const status = parseBoolFilter(searchParams.get("mstatus"));
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

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    let items = rows.filter(({ member: m, user: u }) => {
      const name = u?.name?.trim() ?? "";
      const email = u?.email?.trim() ?? "";
      const roleLabel = humanizeProjectMemberRole(m.role).toLowerCase();
      if (!term) {
        return true;
      }
      return (
        name.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term) ||
        roleLabel.includes(term) ||
        (m.userId?.toLowerCase().includes(term) ?? false)
      );
    });

    if (roleFilter !== "all") {
      items = items.filter(({ member: m }) => m.role === roleFilter);
    }
    if (status === "active") {
      items = items.filter(({ member: m }) => m.isActive !== false);
    } else if (status === "inactive") {
      items = items.filter(({ member: m }) => m.isActive === false);
    }

    return items;
  }, [query, roleFilter, status, rows]);

  const sortedRows = useMemo(() => {
    const sorted = [...filteredRows];
    sorted.sort((a, b) => {
      const { member: ma, user: ua } = a;
      const { member: mb, user: ub } = b;
      let result = 0;
      switch (orderBy) {
        case "name":
          result = (ua?.name ?? "").localeCompare(ub?.name ?? "", "es", { sensitivity: "base" });
          break;
        case "email":
          result = (ua?.email ?? "").localeCompare(ub?.email ?? "", "es", { sensitivity: "base" });
          break;
        case "role":
          result = humanizeProjectMemberRole(ma.role).localeCompare(humanizeProjectMemberRole(mb.role), "es", {
            sensitivity: "base",
          });
          break;
        case "isActive":
          result = Number(ma.isActive !== false) - Number(mb.isActive !== false);
          break;
        case "createdAt":
          result = dateToEpoch(ma.createdAt) - dateToEpoch(mb.createdAt);
          break;
      }
      return order === "ASC" ? result : -result;
    });
    return sorted;
  }, [filteredRows, order, orderBy]);

  const totalObjects = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalObjects / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const paginatedRows = sortedRows.slice(start, start + limit);

  const meta = {
    page: safePage,
    limit,
    totalObjects,
    totalPages,
    hasPreviousPage: safePage > 1,
    hasNextPage: safePage < totalPages,
  };

  const activeFiltersCount = (query.trim() ? 1 : 0) + (roleFilter !== "all" ? 1 : 0) + (status !== "all" ? 1 : 0);

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
              placeholder="Buscar por nombre, correo, rol o ID…"
              ref={searchInputRef}
              value={searchDraft}
            />
          </div>

          <ResourceFiltersSheet
            activeFiltersCount={activeFiltersCount}
            onClear={() => pushParams({ query: null, mrole: null, mstatus: null, page: "1" })}
          >
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Rol en el proyecto</p>
              <Select
                disabled={isPending}
                onValueChange={(v) => pushParams({ mrole: v === "all" ? null : v })}
                value={roleFilter}
              >
                <SelectTrigger className="h-9 rounded-lg text-sm">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="OWNER">{humanizeProjectMemberRole("OWNER")}</SelectItem>
                  <SelectItem value="ADMIN">{humanizeProjectMemberRole("ADMIN")}</SelectItem>
                  <SelectItem value="MARKETING">{humanizeProjectMemberRole("MARKETING")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Estado</p>
              <Select
                disabled={isPending}
                onValueChange={(v) => pushParams({ mstatus: v === "all" ? null : v })}
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
                <SortHeaderButton currentOrder={order} currentOrderBy={orderBy} field="role" label="Rol" onSort={handleSort} />
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
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell className="h-24 text-center text-muted-foreground" colSpan={6}>
                  Sin resultados con los filtros actuales.
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map(({ member: m, user }) => {
                const avatar = user ? resolveAvatarUrl(user) : null;
                const displayName = user?.name?.trim() || (m.userId ? `Usuario ${m.userId.slice(0, 8)}…` : "—");
                const roleLabel = humanizeProjectMemberRole(m.role);
                return (
                  <TableRow className="text-sm" key={m.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                          {avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element -- URL remota del CMS
                            <img alt={`Avatar de ${displayName}`} className="absolute inset-0 h-full w-full object-cover" src={avatar} />
                          ) : (
                            String(displayName).slice(0, 1).toUpperCase()
                          )}
                        </div>
                        <span className="font-medium">{displayName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user?.email ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant(m.role)}>{roleLabel}</Badge>
                    </TableCell>
                    <TableCell>
                      {m.isActive === false ? <Badge variant="destructive">Inactivo</Badge> : <Badge variant="success">Activo</Badge>}
                    </TableCell>
                    <TableCell>
                      <ListDateTimeGT value={m.createdAt} />
                    </TableCell>
                    <TableCell className="text-right">
                      <ResourceRowActions
                        deleteConfirmActionLabel="Quitar del proyecto"
                        deleteConfirmMessage="El usuario dejará de tener acceso a este proyecto."
                        deleteConfirmTitle="¿Quitar a este miembro del proyecto?"
                        deleteSuccessMessage="Miembro quitado del proyecto correctamente."
                        editHref={`${basePath}/${m.id}/edit`}
                        onDelete={async () => {
                          const r = await deleteProjectMember(projectId, m.id);
                          if (r.status === "error") {
                            return { status: "error" as const, message: r.errors[0]?.message };
                          }
                          return { status: "success" as const };
                        }}
                        viewHref={`${basePath}/${m.id}`}
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
        entityLabel="miembros"
        isPending={isPending}
        meta={meta}
        onLimitChange={(n) => pushParams({ limit: String(n), page: "1" })}
        onPageChange={(p) => pushParams({ page: String(p) })}
      />
    </div>
  );
}
