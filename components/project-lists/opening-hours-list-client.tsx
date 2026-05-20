"use client";

import { useState, useTransition } from "react";
import { Clock, Edit, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import type { OpeningHour, PaginatedPayload } from "@/app/actions/content";
import {
  createOpeningHour,
  deactivateOpeningHour,
  publishOpeningHour,
  unpublishOpeningHour,
  updateOpeningHour,
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
import { DataTableRowActions } from "@/components/resource-lists/data-table-row-actions";
import { publishBadge } from "@/components/resource-lists/entity-badges";
import { ListPaginationFooter } from "@/components/resource-lists/list-pagination-footer";
import { ResourceFiltersSheet } from "@/components/resource-lists/resource-filters-sheet";
import { OPENING_HOUR_SORT_FIELDS } from "@/lib/project-list-query";
import { humanizeWeekDay } from "@/utils/helpers/humanize-enum";
import { SortHeaderButton } from "./sort-header-button";
import { useProjectListNavigation } from "./use-project-list-navigation";

const DAYS: OpeningHour["day"][] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const DEFAULT_ORDER_BY = "day";

type FormState = {
  day: OpeningHour["day"];
  startTime: string;
  endTime: string;
  isPublished: boolean;
};

const EMPTY_FORM: FormState = {
  day: "MONDAY",
  startTime: "08:00",
  endTime: "18:00",
  isPublished: false,
};

function normalizeTime(value: string) {
  return value.length === 5 ? `${value}:00` : value;
}

function displayTime(value?: string) {
  return value?.slice(0, 5) ?? "--:--";
}

export function OpeningHoursListClient({
  hours,
  listError,
  meta,
  projectId,
}: {
  hours: OpeningHour[];
  listError?: string | null;
  meta: PaginatedPayload<OpeningHour>["meta"];
  projectId: string;
}) {
  const router = useRouter();
  const basePath = `/dashboard/projects/${projectId}/opening-hours`;
  const { pushParams, isPending, searchParams } = useProjectListNavigation(basePath);
  const pub = searchParams.get("pub") ?? "all";
  const day = searchParams.get("day") ?? "all";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OpeningHour | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, startTransition] = useTransition();
  const currentOrderBy = searchParams.get("orderBy") ?? DEFAULT_ORDER_BY;
  const safeOrderBy = (OPENING_HOUR_SORT_FIELDS as readonly string[]).includes(currentOrderBy)
    ? currentOrderBy
    : DEFAULT_ORDER_BY;
  const currentOrder = searchParams.get("order")?.toUpperCase() === "DESC" ? "DESC" : "ASC";
  const activeFiltersCount = (pub !== "all" ? 1 : 0) + (day !== "all" ? 1 : 0);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(item: OpeningHour) {
    setEditing(item);
    setForm({
      day: item.day,
      startTime: displayTime(item.startTime),
      endTime: displayTime(item.endTime),
      isPublished: Boolean(item.isPublished),
    });
    setDialogOpen(true);
  }

  function submitForm() {
    if (!form.startTime || !form.endTime) {
      toast.error("Define hora de inicio y fin.");
      return;
    }
    if (form.endTime <= form.startTime) {
      toast.error("La hora de fin debe ser posterior al inicio.");
      return;
    }

    startTransition(async () => {
      const payload = {
        day: form.day,
        startTime: normalizeTime(form.startTime),
        endTime: normalizeTime(form.endTime),
        isActive: true,
        isPublished: form.isPublished,
      };
      const result = editing
        ? await updateOpeningHour(projectId, editing.id, payload)
        : await createOpeningHour(projectId, payload);

      if (result.status === "error") {
        toast.error(result.errors[0]?.title ?? "No se pudo guardar", { description: result.errors[0]?.message });
        return;
      }

      toast.success(editing ? "Horario actualizado" : "Horario creado");
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Horarios configurados</p>
            <p className="text-sm text-muted-foreground">Administra los horarios visibles en la landing page.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ResourceFiltersSheet activeFiltersCount={activeFiltersCount} onClear={() => pushParams({ pub: null, day: null, page: "1" })}>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Dia</p>
                  <Select disabled={isPending} onValueChange={(value) => pushParams({ day: value === "all" ? null : value, page: "1" })} value={day}>
                    <SelectTrigger className="h-9 rounded-lg text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {DAYS.map((d) => <SelectItem key={d} value={d}>{humanizeWeekDay(d)}</SelectItem>)}
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
              <Clock className="h-4 w-4" />
              Nuevo horario
            </Button>
          </div>
        </div>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead><SortHeaderButton currentOrder={currentOrder} currentOrderBy={safeOrderBy} field="day" label="Dia" onSort={(field) => pushParams({ orderBy: field, order: safeOrderBy === field && currentOrder === "ASC" ? "DESC" : "ASC" })} /></TableHead>
              <TableHead><SortHeaderButton currentOrder={currentOrder} currentOrderBy={safeOrderBy} field="startTime" label="Inicio" onSort={(field) => pushParams({ orderBy: field, order: safeOrderBy === field && currentOrder === "ASC" ? "DESC" : "ASC" })} /></TableHead>
              <TableHead><SortHeaderButton currentOrder={currentOrder} currentOrderBy={safeOrderBy} field="endTime" label="Fin" onSort={(field) => pushParams({ orderBy: field, order: safeOrderBy === field && currentOrder === "ASC" ? "DESC" : "ASC" })} /></TableHead>
              <TableHead>Publicado</TableHead>
              <TableHead className="w-[120px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hours.length === 0 ? (
              <TableRow>
                <TableCell className="h-28 text-center text-muted-foreground" colSpan={5}>Sin resultados.</TableCell>
              </TableRow>
            ) : (
              hours.map((item) => (
                <TableRow key={item.id}>
                  <TableCell><Badge variant="secondary">{humanizeWeekDay(item.day)}</Badge></TableCell>
                  <TableCell className="tabular-nums">{displayTime(item.startTime)}</TableCell>
                  <TableCell className="tabular-nums">{displayTime(item.endTime)}</TableCell>
                  <TableCell>{publishBadge(item.isPublished)}</TableCell>
                  <TableCell className="text-right">
                    <DataTableRowActions>
                      <DataTableRowActions.Item onClick={() => openEdit(item)} type="button">
                        <Edit className="mr-2 h-4 w-4" />Editar
                      </DataTableRowActions.Item>
                      {item.isPublished ? (
                        <DataTableRowActions.Item disabled={saving} onClick={() => runAction(() => unpublishOpeningHour(projectId, item.id), "Horario despublicado")} type="button">
                          <Power className="mr-2 h-4 w-4" />Despublicar
                        </DataTableRowActions.Item>
                      ) : (
                        <DataTableRowActions.Item disabled={saving} onClick={() => runAction(() => publishOpeningHour(projectId, item.id), "Horario publicado")} type="button">
                          <Power className="mr-2 h-4 w-4" />Publicar
                        </DataTableRowActions.Item>
                      )}
                      <DataTableRowActions.Item disabled={saving} onClick={() => runAction(() => deactivateOpeningHour(projectId, item.id), "Horario desactivado")} type="button" variant="destructive">
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
        entityLabel="horarios"
        isPending={isPending}
        meta={meta}
        onLimitChange={(limit) => pushParams({ limit: String(limit), page: "1" })}
        onPageChange={(page) => pushParams({ page: String(page) })}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar horario" : "Nuevo horario"}</DialogTitle>
            <DialogDescription>Define el dia y rango de atencion que se mostrara en la landing page.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Dia</Label>
              <Select onValueChange={(value) => setForm((current) => ({ ...current, day: value as OpeningHour["day"] }))} value={form.day}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => <SelectItem key={d} value={d}>{humanizeWeekDay(d)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Hora de inicio</Label>
                <Input onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))} type="time" value={form.startTime} />
              </div>
              <div className="space-y-2">
                <Label>Hora de fin</Label>
                <Input onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))} type="time" value={form.endTime} />
              </div>
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
    </div>
  );
}
