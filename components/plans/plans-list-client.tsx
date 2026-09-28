"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deletePlan } from "@/app/actions/content/plans";
import type { Plan } from "@/app/actions/content/types";
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
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CMS_RESOURCE_LABELS } from "@/lib/cms-resources";
import { cn } from "@/lib/utils";

export function PlansListClient({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<Plan | null>(null);

  function runDelete(plan: Plan) {
    startTransition(async () => {
      const result = await deletePlan(plan.id);
      setToDelete(null);
      if (result.status === "error") {
        toast.error(result.errors[0]?.title ?? "No se pudo eliminar", { description: result.errors[0]?.message });
        return;
      }
      toast.success("Plan eliminado");
      router.refresh();
    });
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Nombre</TableHead>
              <TableHead>Secciones</TableHead>
              <TableHead className="w-[120px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow>
                <TableCell className="h-28 text-center text-muted-foreground" colSpan={3}>
                  Sin planes. Crea uno para poder asignarlo a los proyectos.
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <p className="font-medium">{plan.name}</p>
                    {plan.description ? <p className="text-sm text-muted-foreground">{plan.description}</p> : null}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {plan.resources.length === 0 ? <span className="text-sm text-muted-foreground">Ninguna</span> : null}
                      {plan.resources.map((resource) => (
                        <Badge key={resource} variant="secondary">
                          {CMS_RESOURCE_LABELS[resource] ?? resource}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild aria-label="Editar plan" size="icon" variant="ghost">
                        <Link href={`/dashboard/admin/plans/${plan.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button aria-label="Eliminar plan" disabled={pending} onClick={() => setToDelete(plan)} size="icon" type="button" variant="ghost">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar el plan {toDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              No se puede eliminar si algún proyecto activo lo usa. Su nombre queda reservado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={cn(buttonVariants({ variant: "destructive" }))}
              disabled={pending}
              onClick={() => toDelete && runDelete(toDelete)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
