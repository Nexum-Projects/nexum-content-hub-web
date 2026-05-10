"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

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
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { DataTableRowActions } from "./data-table-row-actions";

export type ResourceDeleteResult = { status: "success" } | { status: "error"; message?: string };

export function ResourceRowActions({
  viewHref,
  editHref,
  onDelete,
  deleteConfirmTitle = "¿Eliminar este registro?",
  deleteConfirmMessage = "Esta acción desactiva el elemento en el sistema.",
  deleteConfirmActionLabel = "Eliminar",
  deleteSuccessMessage = "Eliminado correctamente.",
}: {
  viewHref: string;
  editHref: string;
  onDelete: () => Promise<ResourceDeleteResult>;
  deleteConfirmTitle?: string;
  deleteConfirmMessage?: string;
  /** Etiqueta del botón que confirma la acción destructiva (p. ej. "Desactivar"). */
  deleteConfirmActionLabel?: string;
  deleteSuccessMessage?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const runDelete = () => {
    startTransition(async () => {
      const result = await onDelete();
      if (result.status === "error") {
        toast.error(result.message ?? "No se pudo eliminar.");
        return;
      }
      toast.success(deleteSuccessMessage);
      router.refresh();
    });
  };

  return (
    <>
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
          onClick={() => setConfirmOpen(true)}
        >
          Eliminar
        </DataTableRowActions.Item>
      </DataTableRowActions>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{deleteConfirmMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={cn(buttonVariants({ variant: "destructive" }))}
              disabled={pending}
              onClick={runDelete}
            >
              {deleteConfirmActionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
