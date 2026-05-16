"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Film,
  ImageIcon,
  LayoutGrid,
  PanelLeft,
  Power,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import type { MediaItem } from "@/app/actions/content";
import type { PaginatedPayload } from "@/app/actions/content/paginated-list-types";
import { deactivateMedia, publishMedia, unpublishMedia } from "@/app/actions/content";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/radix-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { cn } from "@/lib/utils";
import { MEDIA_SORT_FIELDS } from "@/lib/project-list-query";
import { DataTableRowActions } from "@/components/resource-lists/data-table-row-actions";
import { ListDateTimeGT } from "@/components/resource-lists/list-datetime-gt";
import { ListPaginationFooter } from "@/components/resource-lists/list-pagination-footer";
import { ListThumbnail, listPlaceholderGradientClass } from "@/components/resource-lists/list-thumbnail";
import { ResourceFiltersSheet } from "@/components/resource-lists/resource-filters-sheet";
import { publishBadge } from "@/components/resource-lists/entity-badges";
import { SortHeaderButton } from "./sort-header-button";
import { useProjectListNavigation } from "./use-project-list-navigation";

const DEFAULT_ORDER_BY = "sortOrder";

function mediaLabel(type: MediaItem["type"]) {
  return type === "IMAGE" ? "Imagen" : "Video";
}

function mediaBadge(type: MediaItem["type"]) {
  return (
    <Badge variant="secondary">
      {type === "IMAGE" ? <ImageIcon className="h-3 w-3" /> : <Film className="h-3 w-3" />}
      {mediaLabel(type)}
    </Badge>
  );
}

export function MediaListClient({
  media,
  meta,
  listError,
  projectId,
}: {
  media: MediaItem[];
  meta: PaginatedPayload<MediaItem>["meta"];
  listError?: string | null;
  projectId: string;
}) {
  const basePath = `/dashboard/projects/${projectId}/media`;
  const { pushParams, isPending, searchParams } = useProjectListNavigation(basePath);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const query = searchParams.get("query") ?? "";
  const pub = searchParams.get("pub") ?? "all";
  const mediaType = searchParams.get("mtype") ?? "all";
  const [searchDraft, setSearchDraft] = useState(query);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<number | null>(null);

  const currentOrderBy = searchParams.get("orderBy") ?? DEFAULT_ORDER_BY;
  const safeOrderBy = (MEDIA_SORT_FIELDS as readonly string[]).includes(currentOrderBy)
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
    pushParams({ query: null, pub: null, mtype: null, page: "1" });
  };

  const isFiltered = Boolean(query.trim()) || pub !== "all" || mediaType !== "all";
  const activeFiltersCount = (query.trim() ? 1 : 0) + (pub !== "all" ? 1 : 0) + (mediaType !== "all" ? 1 : 0);

  if (!listError && meta.totalObjects === 0 && !isFiltered) {
    return (
      <Card className="mx-auto max-w-md rounded-xl border border-dashed border-border bg-muted/15">
        <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
            <ImageIcon className="h-6 w-6" />
          </span>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">Aun no hay medios</p>
            <p className="text-sm text-muted-foreground">
              Sube imagenes o registra videos para reutilizarlos en el contenido de tu landing.
            </p>
          </div>
        </div>
      </Card>
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
              onChange={(event) => {
                caretRef.current = event.currentTarget.selectionStart;
                setSearchDraft(event.target.value);
              }}
              placeholder="Buscar medios…"
              ref={searchInputRef}
              value={searchDraft}
            />
          </div>
          <ResourceFiltersSheet activeFiltersCount={activeFiltersCount} onClear={clearFilters}>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Tipo</p>
              <Select
                disabled={isPending}
                onValueChange={(value) => pushParams({ mtype: value === "all" ? null : value, page: "1" })}
                value={mediaType}
              >
                <SelectTrigger className="h-9 rounded-lg text-sm">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="IMAGE">Imagenes</SelectItem>
                  <SelectItem value="VIDEO">Videos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Publicacion</p>
              <Select disabled={isPending} onValueChange={(value) => pushParams({ pub: value === "all" ? null : value, page: "1" })} value={pub}>
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

      <Tabs className="w-full" defaultValue="grid">
        <TabsList className="h-9 rounded-lg bg-muted/80 p-1">
          <TabsTrigger className="gap-1.5 rounded-md text-sm" value="grid">
            <LayoutGrid className="h-3.5 w-3.5" />
            Galeria
          </TabsTrigger>
          <TabsTrigger className="gap-1.5 rounded-md text-sm" value="table">
            <PanelLeft className="h-3.5 w-3.5" />
            Tabla
          </TabsTrigger>
        </TabsList>

        <TabsContent className="mt-4" value="grid">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {media.length === 0 ? (
              <p className="col-span-full py-8 text-center text-sm text-muted-foreground">Sin resultados.</p>
            ) : (
              media.map((item, index) => (
                <MediaCard
                  item={item}
                  key={item.id}
                  onOpen={() => setViewerIndex(index)}
                  projectId={projectId}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent className="mt-4" value="table">
          <div className="overflow-x-auto rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[100px]">Vista</TableHead>
                  <TableHead>
                    <SortHeaderButton currentOrder={currentOrder} currentOrderBy={safeOrderBy} field="type" label="Tipo" onSort={handleSort} />
                  </TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>
                    <SortHeaderButton
                      currentOrder={currentOrder}
                      currentOrderBy={safeOrderBy}
                      field="createdAt"
                      label="Creacion"
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[120px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {media.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-28 text-center text-muted-foreground" colSpan={5}>
                      Sin resultados con los filtros actuales.
                    </TableCell>
                  </TableRow>
                ) : (
                  media.map((item, index) => (
                    <TableRow className="text-sm" key={item.id}>
                      <TableCell>
                        <button className="text-left" onClick={() => setViewerIndex(index)} type="button">
                          <MediaThumbnail item={item} />
                        </button>
                      </TableCell>
                      <TableCell>{mediaBadge(item.type)}</TableCell>
                      <TableCell>{publishBadge(item.isPublic)}</TableCell>
                      <TableCell>
                        <ListDateTimeGT value={item.createdAt} />
                      </TableCell>
                      <TableCell className="text-right">
                        <MediaActions item={item} onOpen={() => setViewerIndex(index)} projectId={projectId} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <ListPaginationFooter
        entityLabel="medios"
        isPending={isPending}
        meta={meta}
        onLimitChange={(limit) => pushParams({ limit: String(limit), page: "1" })}
        onPageChange={(page) => pushParams({ page: String(page) })}
      />

      <MediaViewerDialog
        items={media}
        onIndexChange={setViewerIndex}
        open={viewerIndex !== null}
        selectedIndex={viewerIndex ?? 0}
      />
    </div>
  );
}

function MediaThumbnail({ item, className }: { item: MediaItem; className?: string }) {
  if (item.type === "IMAGE") {
    return <ListThumbnail alt="Medio" className={className} seed={item.id} src={item.value} />;
  }

  return (
    <div className={cn("grid h-12 w-20 shrink-0 place-items-center rounded-lg border bg-muted", className)}>
      <Film className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}

function MediaCard({ item, onOpen, projectId }: { item: MediaItem; onOpen: () => void; projectId: string }) {
  return (
    <Card className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <button
        className={cn(
          "relative grid aspect-square w-full place-items-center overflow-hidden text-left",
          item.type === "IMAGE" ? "bg-muted" : cn("text-white/90", listPlaceholderGradientClass(item.id)),
        )}
        onClick={onOpen}
        type="button"
      >
        {item.type === "IMAGE" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" src={item.value} />
        ) : (
          <Film className="h-12 w-12 opacity-90 drop-shadow-sm" />
        )}
      </button>
      <div className="space-y-3 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {mediaBadge(item.type)}
          {publishBadge(item.isPublic)}
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3">
          <Button className="h-8 px-2" onClick={onOpen} size="sm" type="button" variant="outline">
            <Eye className="h-3.5 w-3.5" />
            Ver
          </Button>
          <MediaActions item={item} onOpen={onOpen} projectId={projectId} />
        </div>
      </div>
    </Card>
  );
}

function MediaActions({ item, onOpen, projectId }: { item: MediaItem; onOpen: () => void; projectId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  function runAction(action: () => Promise<{ status: "success" } | { status: "error"; errors: { title: string; message: string }[] }>, success: string) {
    startTransition(async () => {
      const result = await action();
      if (result.status === "error") {
        toast.error(result.errors[0]?.title ?? "No se pudo completar la accion", {
          description: result.errors[0]?.message,
        });
        return;
      }
      toast.success(success);
      router.refresh();
    });
  }

  return (
    <>
      <DataTableRowActions>
        <DataTableRowActions.Item onClick={onOpen} type="button">
          <Eye className="mr-2 h-4 w-4" />
          Ver
        </DataTableRowActions.Item>
        <DataTableRowActions.Item
          onClick={() => {
            void navigator.clipboard.writeText(item.value);
            toast.success("URL copiada");
          }}
          type="button"
        >
          <Copy className="mr-2 h-4 w-4" />
          Copiar URL
        </DataTableRowActions.Item>
        <DataTableRowActions.Separator />
        {item.isPublic ? (
          <DataTableRowActions.Item
            disabled={pending}
            isLoading={pending}
            onClick={() => runAction(() => unpublishMedia(projectId, item.id), "Medio despublicado")}
            type="button"
          >
            <Power className="mr-2 h-4 w-4" />
            Despublicar
          </DataTableRowActions.Item>
        ) : (
          <DataTableRowActions.Item
            disabled={pending}
            isLoading={pending}
            onClick={() => runAction(() => publishMedia(projectId, item.id), "Medio publicado")}
            type="button"
          >
            <Power className="mr-2 h-4 w-4" />
            Publicar
          </DataTableRowActions.Item>
        )}
        <DataTableRowActions.Item disabled={pending} isLoading={pending} onClick={() => setConfirmDeactivate(true)} type="button" variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Desactivar
        </DataTableRowActions.Item>
      </DataTableRowActions>

      <AlertDialog open={confirmDeactivate} onOpenChange={setConfirmDeactivate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar este medio?</AlertDialogTitle>
            <AlertDialogDescription>
              El medio dejara de estar disponible en la biblioteca activa. No se eliminara el archivo del storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={cn(buttonVariants({ variant: "destructive" }))}
              disabled={pending}
              onClick={() => runAction(() => deactivateMedia(projectId, item.id), "Medio desactivado")}
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function MediaViewerDialog({
  items,
  onIndexChange,
  open,
  selectedIndex,
}: {
  items: MediaItem[];
  onIndexChange: (index: number | null) => void;
  open: boolean;
  selectedIndex: number;
}) {
  const safeIndex = Math.min(Math.max(selectedIndex, 0), Math.max(items.length - 1, 0));
  const item = items[safeIndex];
  const canMove = items.length > 1;

  const next = () => onIndexChange((safeIndex + 1) % items.length);
  const previous = () => onIndexChange((safeIndex - 1 + items.length) % items.length);

  return (
    <Dialog onOpenChange={(nextOpen) => onIndexChange(nextOpen ? safeIndex : null)} open={open}>
      <DialogContent className="max-w-5xl p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Vista previa de medio</DialogTitle>
          <DialogDescription>Vista ampliada de los medios del proyecto.</DialogDescription>
        </DialogHeader>
        {item ? (
          <div className="grid gap-0 overflow-hidden rounded-xl bg-card lg:grid-cols-[1fr_280px]">
            <div className="relative grid min-h-[60vh] place-items-center bg-slate-950">
              {item.type === "IMAGE" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" className="max-h-[76vh] w-full object-contain" src={item.value} />
              ) : (
                <div className="grid gap-3 text-center text-white">
                  <Film className="mx-auto h-12 w-12" />
                  <p className="text-sm">Vista previa de video</p>
                  <Button asChild variant="secondary">
                    <a href={item.value} rel="noreferrer" target="_blank">Abrir video</a>
                  </Button>
                </div>
              )}
              {canMove ? (
                <>
                  <Button className="absolute left-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full" onClick={previous} size="icon" type="button" variant="secondary">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full" onClick={next} size="icon" type="button" variant="secondary">
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              ) : null}
            </div>
            <aside className="space-y-4 border-t border-border p-5 lg:border-l lg:border-t-0">
              <div className="flex flex-wrap gap-1.5">
                {mediaBadge(item.type)}
                {publishBadge(item.isPublic)}
              </div>
              <div>
                <p className="text-sm font-medium">URL</p>
                <p className="mt-1 break-all text-xs text-muted-foreground">{item.value}</p>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  void navigator.clipboard.writeText(item.value);
                  toast.success("URL copiada");
                }}
                type="button"
                variant="outline"
              >
                <Copy className="h-4 w-4" />
                Copiar URL
              </Button>
              <p className="text-xs text-muted-foreground">
                {safeIndex + 1} de {items.length}
              </p>
            </aside>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
