"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Edit, LinkIcon, MousePointerClick, Power, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import type { ActionButton, PaginatedPayload } from "@/app/actions/content";
import {
  createActionButton,
  deactivateActionButton,
  publishActionButton,
  unpublishActionButton,
  updateActionButton,
} from "@/app/actions/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/radix-select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataTableRowActions } from "@/components/resource-lists/data-table-row-actions";
import { publishBadge } from "@/components/resource-lists/entity-badges";
import { ListDateTimeGT } from "@/components/resource-lists/list-datetime-gt";
import { ListPaginationFooter } from "@/components/resource-lists/list-pagination-footer";
import { ResourceFiltersSheet } from "@/components/resource-lists/resource-filters-sheet";
import { ACTION_BUTTON_SORT_FIELDS } from "@/lib/project-list-query";
import { cn } from "@/lib/utils";
import { humanizeActionButtonType } from "@/utils/helpers/humanize-enum";
import { SortHeaderButton } from "./sort-header-button";
import { useProjectListNavigation } from "./use-project-list-navigation";

const ACTION_BUTTON_TYPES: ActionButton["type"][] = ["INSTAGRAM", "FACEBOOK", "EMAIL", "UBER", "WAZE"];
const DEFAULT_ORDER_BY = "sortOrder";

type FormState = {
  type: ActionButton["type"];
  value: string;
  isPublished: boolean;
};

const EMPTY_FORM: FormState = {
  type: "INSTAGRAM",
  value: "",
  isPublished: false,
};

export function ActionButtonsListClient({
  buttons,
  listError,
  meta,
  projectId,
}: {
  buttons: ActionButton[];
  listError?: string | null;
  meta: PaginatedPayload<ActionButton>["meta"];
  projectId: string;
}) {
  const router = useRouter();
  const basePath = `/dashboard/projects/${projectId}/action-buttons`;
  const { pushParams, isPending, searchParams } = useProjectListNavigation(basePath);
  const query = searchParams.get("query") ?? "";
  const pub = searchParams.get("pub") ?? "all";
  const actionType = searchParams.get("atype") ?? "all";
  const [searchDraft, setSearchDraft] = useState(query);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ActionButton | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [confirmDeactivate, setConfirmDeactivate] = useState<ActionButton | null>(null);
  const [saving, startTransition] = useTransition();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<number | null>(null);

  const currentOrderBy = searchParams.get("orderBy") ?? DEFAULT_ORDER_BY;
  const safeOrderBy = (ACTION_BUTTON_SORT_FIELDS as readonly string[]).includes(currentOrderBy)
    ? currentOrderBy
    : DEFAULT_ORDER_BY;
  const currentOrder = searchParams.get("order")?.toUpperCase() === "DESC" ? "DESC" : "ASC";
  const activeFiltersCount = (query.trim() ? 1 : 0) + (pub !== "all" ? 1 : 0) + (actionType !== "all" ? 1 : 0);

  useEffect(() => {
    const timeout = setTimeout(() => setSearchDraft(query), 0);
    return () => clearTimeout(timeout);
  }, [query]);

  const applySearch = useCallback(() => {
    const next = searchDraft.trim();
    if (next === query.trim()) {
      return;
    }
    pushParams({ query: next ? searchDraft : null, page: "1" });
  }, [pushParams, query, searchDraft]);

  useEffect(() => {
    const next = searchDraft.trim();
    if (next === query.trim()) {
      return;
    }
    const timeout = setTimeout(applySearch, 250);
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

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(item: ActionButton) {
    setEditing(item);
    setForm({
      type: item.type,
      value: item.value ?? "",
      isPublished: Boolean(item.isPublished),
    });
    setDialogOpen(true);
  }

  function handleSort(field: string) {
    pushParams({ orderBy: field, order: safeOrderBy === field && currentOrder === "ASC" ? "DESC" : "ASC" });
  }

  function submitForm() {
    if (!form.value.trim()) {
      toast.error("Ingresa el valor del boton.");
      return;
    }

    startTransition(async () => {
      const payload = {
        type: form.type,
        value: form.value.trim(),
        isActive: true,
        isPublished: form.isPublished,
        sortOrder: editing?.sortOrder ?? 0,
      };
      const result = editing
        ? await updateActionButton(projectId, editing.id, payload)
        : await createActionButton(projectId, payload);

      if (result.status === "error") {
        toast.error(result.errors[0]?.title ?? "No se pudo guardar", { description: result.errors[0]?.message });
        return;
      }

      toast.success(editing ? "Boton actualizado" : "Boton creado");
      setDialogOpen(false);
      router.refresh();
    });
  }

  function runAction(action: () => Promise<{ status: "success" } | { status: "error"; errors: { title: string; message: string }[] }>, success: string) {
    startTransition(async () => {
      const result = await action();
      if (result.status === "error") {
        toast.error(result.errors[0]?.title ?? "No se pudo completar", { description: result.errors[0]?.message });
        return;
      }
      toast.success(success);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {listError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{listError}</p>
      ) : null}

      <Card className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-9 rounded-lg pl-9 text-sm"
              onChange={(event) => {
                caretRef.current = event.currentTarget.selectionStart;
                setSearchDraft(event.target.value);
              }}
              placeholder="Buscar por URL, correo o valor..."
              ref={searchInputRef}
              value={searchDraft}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <ResourceFiltersSheet activeFiltersCount={activeFiltersCount} onClear={() => pushParams({ query: null, pub: null, atype: null, page: "1" })}>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Tipo</p>
                  <Select disabled={isPending} onValueChange={(value) => pushParams({ atype: value === "all" ? null : value, page: "1" })} value={actionType}>
                    <SelectTrigger className="h-9 rounded-lg text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {ACTION_BUTTON_TYPES.map((type) => <SelectItem key={type} value={type}>{humanizeActionButtonType(type)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Publicacion</p>
                  <Select disabled={isPending} onValueChange={(value) => pushParams({ pub: value === "all" ? null : value, page: "1" })} value={pub}>
                    <SelectTrigger className="h-9 rounded-lg text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                      <SelectItem value="draft">Borrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </ResourceFiltersSheet>
            <Button onClick={openCreate} type="button">
              <MousePointerClick className="h-4 w-4" />
              Nuevo boton
            </Button>
          </div>
        </div>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead><SortHeaderButton currentOrder={currentOrder} currentOrderBy={safeOrderBy} field="type" label="Tipo" onSort={handleSort} /></TableHead>
              <TableHead><SortHeaderButton currentOrder={currentOrder} currentOrderBy={safeOrderBy} field="value" label="Valor" onSort={handleSort} /></TableHead>
              <TableHead>Publicado</TableHead>
              <TableHead><SortHeaderButton currentOrder={currentOrder} currentOrderBy={safeOrderBy} field="createdAt" label="Creacion" onSort={handleSort} /></TableHead>
              <TableHead className="w-[120px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {buttons.length === 0 ? (
              <TableRow>
                <TableCell className="h-28 text-center text-muted-foreground" colSpan={5}>Sin resultados.</TableCell>
              </TableRow>
            ) : (
              buttons.map((item) => (
                <TableRow key={item.id}>
                  <TableCell><Badge variant="secondary">{humanizeActionButtonType(item.type)}</Badge></TableCell>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-2">
                      <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="max-w-md truncate text-sm">{item.value}</span>
                    </div>
                  </TableCell>
                  <TableCell>{publishBadge(item.isPublished)}</TableCell>
                  <TableCell><ListDateTimeGT value={item.createdAt} /></TableCell>
                  <TableCell className="text-right">
                    <DataTableRowActions>
                      <DataTableRowActions.Item onClick={() => openEdit(item)} type="button">
                        <Edit className="mr-2 h-4 w-4" />Editar
                      </DataTableRowActions.Item>
                      {item.isPublished ? (
                        <DataTableRowActions.Item disabled={saving} onClick={() => runAction(() => unpublishActionButton(projectId, item.id), "Boton despublicado")} type="button">
                          <Power className="mr-2 h-4 w-4" />Despublicar
                        </DataTableRowActions.Item>
                      ) : (
                        <DataTableRowActions.Item disabled={saving} onClick={() => runAction(() => publishActionButton(projectId, item.id), "Boton publicado")} type="button">
                          <Power className="mr-2 h-4 w-4" />Publicar
                        </DataTableRowActions.Item>
                      )}
                      <DataTableRowActions.Item disabled={saving} onClick={() => setConfirmDeactivate(item)} type="button" variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />Desactivar
                      </DataTableRowActions.Item>
                    </DataTableRowActions>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ListPaginationFooter
        entityLabel="botones"
        isPending={isPending}
        meta={meta}
        onLimitChange={(limit) => pushParams({ limit: String(limit), page: "1" })}
        onPageChange={(page) => pushParams({ page: String(page) })}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar boton de accion" : "Nuevo boton de accion"}</DialogTitle>
            <DialogDescription>Configura accesos rapidos como redes sociales, correo o navegacion.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select onValueChange={(value) => setForm((current) => ({ ...current, type: value as ActionButton["type"] }))} value={form.type}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTION_BUTTON_TYPES.map((type) => <SelectItem key={type} value={type}>{humanizeActionButtonType(type)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))} placeholder="https://..., correo@dominio.com o URL de destino" value={form.value} />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
              <div>
                <p className="text-sm font-medium">Publicado</p>
                <p className="text-xs text-muted-foreground">Visible en la landing page.</p>
              </div>
              <Switch checked={form.isPublished} onClick={() => setForm((current) => ({ ...current, isPublished: !current.isPublished }))} />
            </div>
          </div>
          <DialogFooter>
            <Button disabled={saving} onClick={() => setDialogOpen(false)} type="button" variant="outline">Cancelar</Button>
            <Button disabled={saving} onClick={submitForm} type="button">{saving ? "Guardando..." : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(confirmDeactivate)} onOpenChange={(open) => !open && setConfirmDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar este boton?</AlertDialogTitle>
            <AlertDialogDescription>El boton dejara de estar disponible en la biblioteca activa.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={cn("bg-destructive text-destructive-foreground hover:bg-destructive/90")}
              disabled={saving}
              onClick={() => {
                const item = confirmDeactivate;
                if (item) {
                  runAction(() => deactivateActionButton(projectId, item.id), "Boton desactivado");
                }
                setConfirmDeactivate(null);
              }}
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
