"use client";

import { useRouter } from "next/navigation";
import { LinkIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { ActionButton } from "@/app/actions/content";
import { reorderActionButtons } from "@/app/actions/content";
import { Badge } from "@/components/ui/badge";
import { humanizeActionButtonType } from "@/lib/action-button-type";
import { ReorderableList } from "./reorderable-list";

export function ActionButtonsReorderClient({ items, projectId }: { items: ActionButton[]; projectId: string }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function onSave(orderedItems: ActionButton[]) {
    setIsSaving(true);
    const result = await reorderActionButtons(
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
      description: "Los botones de accion se actualizaron correctamente.",
    });
    router.push(`/dashboard/projects/${projectId}/action-buttons`);
    return true;
  }

  return (
    <ReorderableList
      emptyMessage="No hay botones para ordenar."
      getId={(item) => item.id}
      isSaving={isSaving}
      items={items}
      onSave={onSave}
      renderItem={(item, { position }) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border bg-muted">
            <LinkIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-medium">{humanizeActionButtonType(item.type)}</p>
              <Badge variant={item.isPublished ? "success" : "warning"}>{item.isPublished ? "Publicado" : "Borrador"}</Badge>
              <Badge variant="secondary">Posicion {position}</Badge>
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">{item.value}</p>
          </div>
        </div>
      )}
      saveLabel="Guardar orden"
    />
  );
}
