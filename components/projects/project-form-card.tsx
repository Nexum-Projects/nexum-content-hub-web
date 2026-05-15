"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";

import type { Project } from "@/app/actions/content/types";
import { createProject, updateProject } from "@/app/actions/content";
import { FormSaveActions } from "@/components/forms/form-save-actions";
import { ContentImageUpload, FieldError } from "@/components/content/content-form-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";

const MAX_RASTER_BYTES = 5 * 1024 * 1024;
const MAX_SVG_BYTES = 2 * 1024 * 1024;
const RASTER_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

function projectAvatarDefault(project?: Project | null) {
  if (!project) {
    return "";
  }
  return project.avatarUrl ?? project.avatar_url ?? "";
}

function isNextRedirectError(err: unknown) {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    typeof (err as { digest?: unknown }).digest === "string" &&
    String((err as { digest: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

const projectFormSchema = z
  .object({
    name: z.string().min(1, "El nombre es obligatorio"),
    domain: z.string().optional(),
    logoFile: z.custom<File | undefined>().optional(),
    iconFile: z.custom<File | undefined>().optional(),
  })
  .superRefine((data, ctx) => {
    const logo = data.logoFile;
    if (logo instanceof File && logo.size > 0) {
      if (logo.size > MAX_RASTER_BYTES) {
        ctx.addIssue({ code: "custom", message: "El logo no debe superar 5MB", path: ["logoFile"] });
      } else if (!RASTER_MIMES.has(logo.type) && !(logo.type === "" && /\.(jpe?g|png|webp)$/i.test(logo.name))) {
        ctx.addIssue({ code: "custom", message: "El logo debe ser JPG, PNG o WEBP", path: ["logoFile"] });
      }
    }

    const icon = data.iconFile;
    if (icon instanceof File && icon.size > 0) {
      if (icon.size > MAX_SVG_BYTES) {
        ctx.addIssue({ code: "custom", message: "El icono no debe superar 2MB", path: ["iconFile"] });
      } else {
        const ext = icon.name.split(".").pop()?.toLowerCase();
        const mimeOk =
          !icon.type ||
          icon.type === "image/svg+xml" ||
          (icon.type === "application/octet-stream" && ext === "svg");
        if (ext !== "svg" || !mimeOk) {
          ctx.addIssue({ code: "custom", message: "El icono solo puede ser un archivo SVG", path: ["iconFile"] });
        }
      }
    }
  });

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export function ProjectFormPage({
  mode,
  cancelHref,
  backHref,
  backLabel,
  breadcrumbHref,
  breadcrumbParentLabel,
  breadcrumbCurrent,
  title,
  description,
  footerHelper,
  submitLabel,
  project,
  projectId,
}: {
  mode: "create" | "edit";
  cancelHref: string;
  backHref: string;
  backLabel: string;
  breadcrumbHref: string;
  breadcrumbParentLabel: string;
  breadcrumbCurrent: string;
  title: string;
  description: string;
  footerHelper: string;
  submitLabel: string;
  project?: Project | null;
  projectId?: string;
}) {
  const isEdit = mode === "edit";
  const p = project;
  const existingIconUrl = projectAvatarDefault(p);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: p?.name ?? "",
      domain: p?.domain ?? "",
      logoFile: undefined,
      iconFile: undefined,
    },
  });

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = form;

  function buildFormData(values: ProjectFormValues) {
    const fd = new FormData();
    fd.append("name", values.name);
    fd.append("domain", values.domain?.trim() ?? "");
    if (values.logoFile) {
      fd.append("logoFile", values.logoFile);
    }
    if (values.iconFile) {
      fd.append("iconFile", values.iconFile);
    }
    if (isEdit) {
      fd.append("existingLogoUrl", p?.logoUrl?.trim() ?? "");
      fd.append("existingAvatarUrl", projectAvatarDefault(p).trim());
    }
    return fd;
  }

  const onValid = async (values: ProjectFormValues) => {
    const fd = buildFormData(values);
    setIsSubmitting(true);
    try {
      if (mode === "create") {
        await createProject(fd);
      } else if (projectId) {
        await updateProject(projectId, fd);
        window.location.assign(`/dashboard/projects/${projectId}`);
      } else {
        toast.error("No se pudo identificar el proyecto. Vuelve a abrir la configuración desde el panel.");
      }
    } catch (err) {
      if (isNextRedirectError(err)) {
        throw err;
      }
      const message = err instanceof Error ? err.message : "No se pudo guardar el proyecto.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  function onInvalidSubmit() {
    toast.error("Revisa los campos marcados antes de guardar.");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild className="rounded-lg" variant="outline">
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2 sm:justify-end" />
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link className="font-medium text-primary hover:underline" href={breadcrumbHref}>
              {breadcrumbParentLabel}
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">{breadcrumbCurrent}</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-7">{title}</h1>
            {description.trim() ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
          </div>
        </div>
      </header>

      <form className="space-y-6" onSubmit={handleSubmit(onValid, onInvalidSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Datos del proyecto</CardTitle>
            <CardDescription>
              {isEdit ? "Nombre y dominio del proyecto." : "Nombre, dominio opcional y archivos de marca."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 sm:grid-cols-2">
            <Field label="Nombre">
              <Input {...register("name")} placeholder="Café de Reyes" />
              <FieldError message={errors.name?.message} />
            </Field>
            <Field label="Dominio">
              <Input {...register("domain")} placeholder="ejemplo.com" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logo del proyecto</CardTitle>
            <CardDescription>Sube una imagen raster (misma convención que banners y eventos). Opcional.</CardDescription>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="logoFile"
              render={({ field, fieldState }) => (
                <ContentImageUpload
                  error={fieldState.error?.message}
                  file={field.value}
                  onChange={field.onChange}
                  onPreviewUrlChange={() => {}}
                  remotePreviewUrl={p?.logoUrl?.trim() ? p.logoUrl : null}
                />
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Icono del proyecto</CardTitle>
            <CardDescription>
              Se usa como avatar en tarjetas y en el selector lateral. Solo archivos SVG. Opcional.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="iconFile"
              render={({ field, fieldState }) => (
                <ContentImageUpload
                  accept="image/svg+xml,.svg"
                  error={fieldState.error?.message}
                  file={field.value}
                  formatDescription="Solo SVG · Máx. 2MB"
                  onChange={field.onChange}
                  onPreviewUrlChange={() => {}}
                  previewObjectFit="contain"
                  remotePreviewUrl={existingIconUrl ? existingIconUrl : null}
                />
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardFooter className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">{footerHelper}</p>
            <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
              <FormSaveActions cancelHref={cancelHref} isSubmitting={isSubmitting} submitLabel={submitLabel} />
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
