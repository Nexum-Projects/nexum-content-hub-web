"use client";

import { useRouter } from "next/navigation";
import { Film, ImageIcon, Images } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { MediaItem } from "@/app/actions/content";
import { reorderMedia } from "@/app/actions/content";
import { Badge } from "@/components/ui/badge";
import { ReorderableList } from "./reorderable-list";

export function MediaReorderClient({ items, projectId }: { items: MediaItem[]; projectId: string }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function onSave(orderedItems: MediaItem[]) {
    setIsSaving(true);
    const result = await reorderMedia(
      projectId,
      orderedItems.map((item, index) => ({
        id: item.id,
        sortOrder: index,
      })),
    );
    setIsSaving(false);

    if (result.status === "error") {
      toast.error(result.errors[0]?.title ?? "No se pudo guardar el orden", {
        description: result.errors[0]?.message,
      });
      return false;
    }

    toast.success("Orden guardado", {
      description: "Los medios se actualizaron correctamente.",
    });
    router.push(`/dashboard/projects/${projectId}/media`);
    return true;
  }

  return (
    <ReorderableList
      emptyMessage="No hay medios para ordenar."
      getId={(item) => item.id}
      isSaving={isSaving}
      items={items}
      onSave={onSave}
      renderItem={(item, { position }) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg border bg-muted">
            {item.type === "IMAGE" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" className="h-full w-full object-cover" src={item.value} />
            ) : (
              <Film className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-medium">Medio {position}</p>
              <Badge variant={item.isPublic ? "success" : "warning"}>{item.isPublic ? "Publicado" : "Borrador"}</Badge>
              <Badge variant="secondary">
                {item.type === "IMAGE" ? <ImageIcon className="h-3 w-3" /> : <Images className="h-3 w-3" />}
                {item.type === "IMAGE" ? "Imagen" : "Video"}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Posicion actual: {position}</p>
          </div>
        </div>
      )}
      saveLabel="Guardar orden"
    />
  );
}
