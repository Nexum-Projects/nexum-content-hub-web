"use client";

import { useRouter } from "next/navigation";
import { Tags } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { ProductCategory } from "@/app/actions/content";
import { reorderProductCategories } from "@/app/actions/content";
import { Badge } from "@/components/ui/badge";
import { humanizeMenuProductType } from "@/lib/menu-product-type";
import { ReorderableList } from "./reorderable-list";

export function CategoriesReorderClient({ items, projectId }: { items: ProductCategory[]; projectId: string }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function onSave(orderedItems: ProductCategory[]) {
    setIsSaving(true);
    const result = await reorderProductCategories(
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

    toast.success("Orden guardado");
    router.push(`/dashboard/projects/${projectId}/categories`);
    return true;
  }

  return (
    <ReorderableList
      emptyMessage="No hay categorias para ordenar."
      getId={(item) => item.id}
      isSaving={isSaving}
      items={items}
      onSave={onSave}
      renderItem={(item, { position }) => (
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium">{item.name}</p>
            <Badge variant={item.isPublished ? "success" : "warning"}>{item.isPublished ? "Publicada" : "Borrador"}</Badge>
            <Badge variant="secondary">
              <Tags className="h-3 w-3" />
              {humanizeMenuProductType(item.catalogKind)}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Posicion actual: {position}</p>
        </div>
      )}
      saveLabel="Guardar orden"
    />
  );
}
