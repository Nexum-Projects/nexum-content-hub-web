"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { DataTableRowActions } from "./data-table-row-actions";

export type ResourceDeleteResult = { status: "success" } | { status: "error"; message?: string };

export function ResourceRowActions({
  viewHref,
  editHref,
  onDelete,
  deleteConfirmMessage = "¿Eliminar este registro? Esta accion desactiva el elemento en el sistema.",
}: {
  viewHref: string;
  editHref: string;
  onDelete: () => Promise<ResourceDeleteResult>;
  deleteConfirmMessage?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleRemove = () => {
    if (!window.confirm(deleteConfirmMessage)) {
      return;
    }
    startTransition(async () => {
      const result = await onDelete();
      if (result.status === "error") {
        toast.error(result.message ?? "No se pudo eliminar.");
        return;
      }
      toast.success("Eliminado correctamente.");
      router.refresh();
    });
  };

  return (
    <DataTableRowActions>
      <DataTableRowActions.Item href={viewHref} type="link">
        Ver
      </DataTableRowActions.Item>
      <DataTableRowActions.Item href={editHref} type="link">
        Editar
      </DataTableRowActions.Item>
      <DataTableRowActions.Separator />
      <DataTableRowActions.Item
        disabled={pending}
        isLoading={pending}
        type="button"
        variant="destructive"
        onClick={handleRemove}
      >
        Eliminar
      </DataTableRowActions.Item>
    </DataTableRowActions>
  );
}
