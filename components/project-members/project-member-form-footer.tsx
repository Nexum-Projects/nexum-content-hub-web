"use client";

import { useFormStatus } from "react-dom";

import { FormSaveActions } from "@/components/forms/form-save-actions";

export function ProjectMemberFormFooter({
  cancelHref,
  submitDisabled,
}: {
  cancelHref: string;
  submitDisabled: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <FormSaveActions
      cancelHref={cancelHref}
      isSubmitting={pending}
      submitDisabled={submitDisabled}
      submitLabel="Guardar cambios"
    />
  );
}
