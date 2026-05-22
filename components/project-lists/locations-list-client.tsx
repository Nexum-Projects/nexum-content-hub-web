"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Edit, Eye, MapPin, Navigation, Power, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { PaginatedPayload, ProjectLocation } from "@/app/actions/content";
import {
  createLocationFromForm,
  deactivateLocation,
  publishLocation,
  unpublishLocation,
  updateLocationFromForm,
} from "@/app/actions/content";
import { EventLocationPicker, type EventLocationValue } from "@/components/events/event-location-picker";
import { ContentImageUpload, FieldError, RichTextEditor } from "@/components/content/content-form-controls";
import { DataTableRowActions } from "@/components/resource-lists/data-table-row-actions";
import { publishBadge } from "@/components/resource-lists/entity-badges";
import { ListDateTimeGT } from "@/components/resource-lists/list-datetime-gt";
import { ListPaginationFooter } from "@/components/resource-lists/list-pagination-footer";
import { ListThumbnail } from "@/components/resource-lists/list-thumbnail";
import { ResourceFiltersSheet } from "@/components/resource-lists/resource-filters-sheet";
import { SortHeaderButton } from "@/components/project-lists/sort-header-button";
import { useProjectListNavigation } from "@/components/project-lists/use-project-list-navigation";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/radix-select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LOCATION_SORT_FIELDS } from "@/lib/project-list-query";
import { cn } from "@/lib/utils";

const DEFAULT_ORDER_BY = "sortOrder";

type LocationFormState = {
  title: string;
  description: string;
  imageFile?: File;
  imagePreviewUrl: string | null;
  removeImage: boolean;
  place: EventLocationValue | null;
  isPublished: boolean;
};

const EMPTY_FORM: LocationFormState = {
  title: "",
  description: "",
  imageFile: undefined,
  imagePreviewUrl: null,
  removeImage: false,
  place: null,
  isPublished: false,
};

type FormErrors = Partial<Record<"title" | "place" | "imageFile", string>>;

export function LocationsListClient({
  listError,
  locations,
  meta,
  projectId,
}: {
  listError?: string | null;
  locations: ProjectLocation[];
  meta: PaginatedPayload<ProjectLocation>["meta"];
  projectId: string;
}) {
  const router = useRouter();
  const basePath = `/dashboard/projects/${projectId}/locations`;
  const { pushParams, isPending, searchParams } = useProjectListNavigation(basePath);
  const query = searchParams.get("query") ?? "";
  const pub = searchParams.get("pub") ?? "all";
  const [searchDraft, setSearchDraft] = useState(query);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectLocation | null>(null);
  const [form, setForm] = useState<LocationFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [confirmDeactivate, setConfirmDeactivate] = useState<ProjectLocation | null>(null);
  const [saving, startTransition] = useTransition();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<number | null>(null);
  const handledEditIdRef = useRef<string | null>(null);

  const currentOrderBy = searchParams.get("orderBy") ?? DEFAULT_ORDER_BY;
  const safeOrderBy = (LOCATION_SORT_FIELDS as readonly string[]).includes(currentOrderBy) ? currentOrderBy : DEFAULT_ORDER_BY;
  const currentOrder = searchParams.get("order")?.toUpperCase() === "DESC" ? "DESC" : "ASC";
  const activeFiltersCount = (query.trim() ? 1 : 0) + (pub !== "all" ? 1 : 0);
  const editId = searchParams.get("edit") ?? "";

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

  useEffect(() => {
    if (!editId || handledEditIdRef.current === editId) {
      return;
    }

    const item = locations.find((location) => location.id === editId);
    if (!item) {
      return;
    }

    handledEditIdRef.current = editId;
    openEdit(item);
  }, [editId, locations]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(item: ProjectLocation) {
    setEditing(item);
    setForm({
      title: item.title ?? "",
      description: item.description ?? "",
      imageFile: undefined,
      imagePreviewUrl: null,
      removeImage: false,
      place: {
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
        fullAddress: item.fullAddress ?? "",
      },
      isPublished: Boolean(item.isPublished),
    });
    setErrors({});
    setDialogOpen(true);
  }

  function validateForm() {
    const nextErrors: FormErrors = {};
    if (!form.title.trim()) {
      nextErrors.title = "Ingresa un titulo.";
    }
    if (!form.place) {
      nextErrors.place = "Selecciona la ubicacion en el mapa.";
    }
    if (form.imageFile) {
      const allowed = ["image/jpeg", "image/png", "image/webp"].includes(form.imageFile.type);
      if (!allowed) {
        nextErrors.imageFile = "La imagen debe ser JPG, PNG o WEBP.";
      } else if (form.imageFile.size > 5 * 1024 * 1024) {
        nextErrors.imageFile = "La imagen no debe superar 5MB.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function buildFormData() {
    const data = new FormData();
    data.set("title", form.title.trim());
    data.set("description", form.description);
    if (form.place) {
      data.set("latitude", String(form.place.latitude));
      data.set("longitude", String(form.place.longitude));
      data.set("fullAddress", form.place.fullAddress);
    }
    if (form.imageFile) {
      data.set("imageFile", form.imageFile);
    }
    if (form.isPublished) {
      data.set("isPublished", "on");
    }
    if (editing?.imageUrl) {
      data.set("previousImageUrl", editing.imageUrl);
    }
    if (form.removeImage) {
      data.set("removeImage", "on");
    }
    return data;
  }

  function submitForm() {
    if (!validateForm()) {
      return;
    }

    startTransition(async () => {
      const result = editing
        ? await updateLocationFromForm(projectId, editing.id, buildFormData())
        : await createLocationFromForm(projectId, buildFormData());

      if (result.status === "error") {
        toast.error(result.errors[0]?.title ?? "No se pudo guardar", { description: result.errors[0]?.message });
        return;
      }

      toast.success(editing ? "Ubicacion actualizada" : "Ubicacion creada");
      setDialogOpen(false);
      router.refresh();
    });
  }

  function runAction(
    action: () => Promise<{ status: "success" } | { status: "error"; errors: { title: string; message: string }[] }>,
    success: string,
  ) {
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

  function handleSort(field: string) {
    pushParams({ orderBy: field, order: safeOrderBy === field && currentOrder === "ASC" ? "DESC" : "ASC" });
  }

  const remotePreviewUrl = editing?.imageUrl && !form.removeImage ? editing.imageUrl : null;

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
              placeholder="Buscar por titulo, descripcion o direccion..."
              ref={searchInputRef}
              value={searchDraft}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <ResourceFiltersSheet activeFiltersCount={activeFiltersCount} onClear={() => pushParams({ query: null, pub: null, page: "1" })}>
              <div className="space-y-4">
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
              <MapPin className="h-4 w-4" />
              Nueva ubicacion
            </Button>
          </div>
        </div>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[96px]">Imagen</TableHead>
              <TableHead><SortHeaderButton currentOrder={currentOrder} currentOrderBy={safeOrderBy} field="title" label="Titulo" onSort={handleSort} /></TableHead>
              <TableHead><SortHeaderButton currentOrder={currentOrder} currentOrderBy={safeOrderBy} field="fullAddress" label="Direccion" onSort={handleSort} /></TableHead>
              <TableHead>Publicado</TableHead>
              <TableHead><SortHeaderButton currentOrder={currentOrder} currentOrderBy={safeOrderBy} field="createdAt" label="Creacion" onSort={handleSort} /></TableHead>
              <TableHead className="w-[120px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.length === 0 ? (
              <TableRow>
                <TableCell className="h-28 text-center text-muted-foreground" colSpan={6}>Sin resultados.</TableCell>
              </TableRow>
            ) : (
              locations.map((item) => (
                <TableRow key={item.id}>
                  <TableCell><ListThumbnail alt={item.title} seed={item.id} src={item.imageUrl} /></TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.title}</p>
                      <p className="truncate text-xs tabular-nums text-muted-foreground">
                        {Number(item.latitude).toFixed(6)}, {Number(item.longitude).toFixed(6)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="max-w-md truncate text-sm text-muted-foreground">{item.fullAddress}</p>
                  </TableCell>
                  <TableCell>{publishBadge(item.isPublished)}</TableCell>
                  <TableCell><ListDateTimeGT value={item.createdAt} /></TableCell>
                  <TableCell className="text-right">
                    <DataTableRowActions>
                      <DataTableRowActions.Item href={`/dashboard/projects/${projectId}/locations/${item.id}`} type="link">
                        <Eye className="mr-2 h-4 w-4" />Ver detalle
                      </DataTableRowActions.Item>
                      <DataTableRowActions.Item onClick={() => openEdit(item)} type="button">
                        <Edit className="mr-2 h-4 w-4" />Editar
                      </DataTableRowActions.Item>
                      {item.isPublished ? (
                        <DataTableRowActions.Item disabled={saving} onClick={() => runAction(() => unpublishLocation(projectId, item.id), "Ubicacion despublicada")} type="button">
                          <Power className="mr-2 h-4 w-4" />Despublicar
                        </DataTableRowActions.Item>
                      ) : (
                        <DataTableRowActions.Item disabled={saving} onClick={() => runAction(() => publishLocation(projectId, item.id), "Ubicacion publicada")} type="button">
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
        entityLabel="ubicaciones"
        isPending={isPending}
        meta={meta}
        onLimitChange={(limit) => pushParams({ limit: String(limit), page: "1" })}
        onPageChange={(page) => pushParams({ page: String(page) })}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar ubicacion" : "Nueva ubicacion"}</DialogTitle>
            <DialogDescription>
              Configura la direccion del proyecto, una imagen opcional y su visibilidad en la landing page.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-5">
              <div className="grid gap-4 rounded-xl border p-4">
                <div className="space-y-2">
                  <Label htmlFor="location-title">Titulo</Label>
                  <Input
                    id="location-title"
                    maxLength={180}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Ej. Sucursal Zona 10"
                    value={form.title}
                  />
                  <FieldError message={errors.title} />
                </div>

                <div className="space-y-2">
                  <Label>Descripcion</Label>
                  <RichTextEditor
                    key={`location-description-${editing?.id ?? "create"}`}
                    onChange={(value) => setForm((current) => ({ ...current, description: value }))}
                    placeholder="Describe brevemente esta ubicacion..."
                    value={form.description}
                  />
                </div>
              </div>

              <div className="grid gap-4 rounded-xl border p-4">
                <div>
                  <p className="text-sm font-medium">Imagen opcional</p>
                  <p className="text-sm text-muted-foreground">Sube una imagen de referencia. JPG, PNG o WEBP. Maximo 5MB.</p>
                </div>
                <ContentImageUpload
                  emptyLabel="Puedes crear la ubicacion sin imagen"
                  error={errors.imageFile}
                  file={form.imageFile}
                  key={`${editing?.id ?? "create"}-${form.removeImage ? "removed" : "image"}`}
                  onChange={(file) => setForm((current) => ({ ...current, imageFile: file, removeImage: false }))}
                  onPreviewUrlChange={(url) => setForm((current) => ({ ...current, imagePreviewUrl: url }))}
                  remotePreviewUrl={remotePreviewUrl}
                />
                {editing?.imageUrl && !form.removeImage ? (
                  <Button
                    className="w-fit"
                    onClick={() => setForm((current) => ({ ...current, imageFile: undefined, imagePreviewUrl: null, removeImage: true }))}
                    type="button"
                    variant="outline"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar imagen actual
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-4 rounded-xl border p-4">
                <div>
                  <p className="text-sm font-medium">Direccion y coordenadas</p>
                  <p className="text-sm text-muted-foreground">Usa el mapa para guardar direccion completa, latitud y longitud.</p>
                </div>
                <EventLocationPicker
                  disabled={saving}
                  onChange={(place) => setForm((current) => ({ ...current, place }))}
                  value={form.place}
                />
                <FieldError message={errors.place} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Publicado</p>
                    <p className="text-xs text-muted-foreground">Visible para la landing page.</p>
                  </div>
                  <Switch
                    checked={form.isPublished}
                    onClick={() => setForm((current) => ({ ...current, isPublished: !current.isPublished }))}
                  />
                </div>
              </div>

              <Alert>
                <Navigation className="h-4 w-4" />
                <AlertTitle>Orden automatico</AlertTitle>
                <AlertDescription>Las nuevas ubicaciones se agregan al final de la lista. Puedes reordenarlas desde la pantalla de ordenamiento.</AlertDescription>
              </Alert>

              <Card className="overflow-hidden rounded-xl border bg-card">
                <ListThumbnail
                  alt={form.title || "Vista previa"}
                  className="h-36 w-full rounded-none border-0"
                  seed={editing?.id ?? form.title}
                  src={form.imagePreviewUrl ?? remotePreviewUrl}
                />
                <div className="space-y-2 p-4">
                  <p className="text-sm font-semibold">{form.title.trim() || "Titulo de la ubicacion"}</p>
                  <p className="line-clamp-3 text-xs text-muted-foreground">
                    {form.place?.fullAddress || "Direccion completa seleccionada en el mapa."}
                  </p>
                  {form.place ? (
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {form.place.latitude.toFixed(6)}, {form.place.longitude.toFixed(6)}
                    </p>
                  ) : null}
                </div>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button disabled={saving} onClick={() => setDialogOpen(false)} type="button" variant="outline">Cancelar</Button>
            <Button disabled={saving} onClick={submitForm} type="button">{saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear ubicacion"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(confirmDeactivate)} onOpenChange={(open) => !open && setConfirmDeactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar esta ubicacion?</AlertDialogTitle>
            <AlertDialogDescription>La ubicacion dejara de estar disponible para este proyecto.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={cn("bg-destructive text-destructive-foreground hover:bg-destructive/90")}
              disabled={saving}
              onClick={() => {
                const item = confirmDeactivate;
                if (item) {
                  runAction(() => deactivateLocation(projectId, item.id), "Ubicacion desactivada");
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
