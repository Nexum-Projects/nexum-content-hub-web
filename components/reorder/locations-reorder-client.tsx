"use client";

import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { ProjectLocation } from "@/app/actions/content";
import { reorderLocations } from "@/app/actions/content";
import { Badge } from "@/components/ui/badge";
import { ListThumbnail } from "@/components/resource-lists/list-thumbnail";
import { ReorderableList } from "./reorderable-list";

export function LocationsReorderClient({ items, projectId }: { items: ProjectLocation[]; projectId: string }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function onSave(orderedItems: ProjectLocation[]) {
    setIsSaving(true);
    const result = await reorderLocations(
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
      description: "Las ubicaciones se actualizaron correctamente.",
    });
    router.push(`/dashboard/projects/${projectId}/locations`);
    return true;
  }

  return (
    <ReorderableList
      emptyMessage="No hay ubicaciones para ordenar."
      getId={(item) => item.id}
      isSaving={isSaving}
      items={items}
      onSave={onSave}
      renderItem={(item, { position }) => (
        <div className="flex min-w-0 items-center gap-3">
          <ListThumbnail alt={item.title} className="h-12 w-16" seed={item.id} src={item.imageUrl} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-medium">{item.title}</p>
              <Badge variant={item.isPublished ? "success" : "warning"}>{item.isPublished ? "Publicado" : "Borrador"}</Badge>
              <Badge variant="secondary">Posicion {position}</Badge>
            </div>
            <p className="mt-1 flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{item.fullAddress}</span>
            </p>
          </div>
        </div>
      )}
      saveLabel="Guardar orden"
    />
  );
}
