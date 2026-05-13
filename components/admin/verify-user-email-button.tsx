"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { verifyUserEmail } from "@/app/actions/content/verify-user-email";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function VerifyUserEmailButton({
  userId,
  userEmail,
}: {
  userId: string;
  userEmail: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onVerify() {
    startTransition(async () => {
      const result = await verifyUserEmail(userId);
      if (result.status === "error") {
        toast.error(result.errors[0]?.message ?? "No se pudo verificar el correo.");
        return;
      }

      toast.success("Correo verificado correctamente.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <AlertDialog onOpenChange={setOpen} open={open}>
      <AlertDialogTrigger asChild>
        <Button className="rounded-lg" variant="outline">
          Verificar correo
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Verificar este correo?</AlertDialogTitle>
          <AlertDialogDescription>
            Se marcará <span className="font-medium text-foreground">{userEmail}</span> como verificado. Esta acción
            actualiza la cuenta inmediatamente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className={cn(buttonVariants({ variant: "default" }))}
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              onVerify();
            }}
          >
            Confirmar verificación
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
