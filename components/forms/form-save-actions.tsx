"use client";

import Link from "next/link";
import { Loader2, Save, X } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FormSaveActionsProps = {
  isSubmitting: boolean;
  submitLabel: string;
  savingLabel?: string;
  cancelLabel?: string;
  cancelHref?: string;
  onCancel?: () => void;
  /** Ancho completo en móvil y columna invertida (útil en footers tipo edición). */
  stackOnSmallScreens?: boolean;
  /** Un solo botón de envío a todo el ancho (p. ej. login). */
  fullWidthSubmit?: boolean;
  /** Deshabilita solo el botón de guardar (p. ej. formulario no listo). */
  submitDisabled?: boolean;
  className?: string;
  submitClassName?: string;
};

export function FormSaveActions({
  isSubmitting,
  submitLabel,
  savingLabel = "Guardando…",
  cancelLabel = "Cancelar",
  cancelHref,
  onCancel,
  stackOnSmallScreens = false,
  fullWidthSubmit = false,
  submitDisabled = false,
  className,
  submitClassName,
}: FormSaveActionsProps) {
  const showCancel = Boolean(cancelHref || onCancel);

  const cancelControl = showCancel ? (
    isSubmitting ? (
      <Button className={cn("gap-2", stackOnSmallScreens && "w-full sm:w-auto")} disabled type="button" variant="destructive">
        <X className="h-4 w-4 shrink-0" />
        {cancelLabel}
      </Button>
    ) : cancelHref ? (
      <Button asChild className={cn("gap-2", stackOnSmallScreens && "w-full sm:w-auto")} variant="destructive">
        <Link href={cancelHref}>
          <X className="h-4 w-4 shrink-0" />
          {cancelLabel}
        </Link>
      </Button>
    ) : (
      <Button
        className={cn("gap-2", stackOnSmallScreens && "w-full sm:w-auto")}
        onClick={onCancel}
        type="button"
        variant="destructive"
      >
        <X className="h-4 w-4 shrink-0" />
        {cancelLabel}
      </Button>
    )
  ) : null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-end gap-2",
        fullWidthSubmit && !showCancel && "w-full",
        stackOnSmallScreens && "w-full flex-col-reverse sm:w-auto sm:flex-row",
        className,
      )}
    >
      {cancelControl}
      <Button
        className={cn(
          "min-w-[10rem] gap-2",
          stackOnSmallScreens && "w-full sm:w-auto",
          fullWidthSubmit && !showCancel && "w-full min-w-0",
          submitClassName,
        )}
        disabled={isSubmitting || submitDisabled}
        type="submit"
        variant="default"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Save className="h-4 w-4 shrink-0" />}
        {isSubmitting ? savingLabel : submitLabel}
      </Button>
    </div>
  );
}

/** Para `<form action={serverAction}>`: el estado pending lo expone React. */
export function FormSaveActionsPending(
  props: Omit<FormSaveActionsProps, "isSubmitting">,
) {
  const { pending } = useFormStatus();
  return <FormSaveActions {...props} isSubmitting={pending} />;
}
