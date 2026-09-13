"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Tags } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import type { ProductCategory } from "@/app/actions/content";
import { createProductCategory, updateProductCategory } from "@/app/actions/content";
import { FormSaveActions } from "@/components/forms/form-save-actions";
import { FieldError } from "@/components/content/content-form-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_MENU_PRODUCT_TYPE,
  MENU_PRODUCT_TYPES,
  humanizeMenuProductType,
} from "@/lib/menu-product-type";

const categorySchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(160, "Maximo 160 caracteres"),
  catalogKind: z.enum(MENU_PRODUCT_TYPES),
  description: z.string().optional(),
  isPublished: z.boolean(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export function CategoryForm({
  projectId,
  category,
}: {
  projectId: string;
  category?: ProductCategory;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = Boolean(category);
  const listHref = `/dashboard/projects/${projectId}/categories`;

  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      catalogKind: category?.catalogKind ?? DEFAULT_MENU_PRODUCT_TYPE,
      description: category?.description ?? "",
      isPublished: Boolean(category?.isPublished),
    },
  });

  const values = useWatch({ control });

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty || isSubmitting) {
        return;
      }
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, isSubmitting]);

  async function onSubmit(data: CategoryFormValues) {
    setIsSubmitting(true);
    const payload = {
      name: data.name,
      catalogKind: data.catalogKind,
      description: data.description?.trim() || null,
      isPublished: data.isPublished,
    };
    const result = isEdit && category
      ? await updateProductCategory(projectId, category.id, payload)
      : await createProductCategory(projectId, payload);
    setIsSubmitting(false);

    if (result.status === "error") {
      toast.error(result.errors[0]?.title ?? "No se pudo guardar la categoria", {
        description: result.errors[0]?.message,
      });
      return;
    }

    toast.success(isEdit ? "Categoria actualizada" : "Categoria creada");
    reset(data);
    router.push(listHref);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-4">
        <Button asChild className="rounded-lg" variant="outline">
          <Link href={listHref}>
            <ArrowLeft className="h-4 w-4" />
            Volver a categorias
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2 text-sm">
            <Link className="font-medium text-primary hover:underline" href={listHref}>
              Categorias
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">{isEdit ? "Editar" : "Nueva categoria"}</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold leading-7">
            {isEdit ? "Editar categoria" : "Nueva categoria"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Las categorias se agrupan por catalogo (menu, mercancia, cafe empacado).
          </p>
        </div>
      </header>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Informacion</CardTitle>
            <CardDescription>Nombre visible y catalogo al que pertenece.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="name">
                Nombre <span className="text-destructive">*</span>
              </label>
              <Input id="name" placeholder="Ej. Bebidas de octubre" {...register("name")} />
              <FieldError message={errors.name?.message} />
            </div>
            <div className="max-w-xs space-y-2">
              <label className="text-sm font-medium" htmlFor="catalogKind">
                Catalogo
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                disabled={isEdit}
                id="catalogKind"
                {...register("catalogKind")}
              >
                {MENU_PRODUCT_TYPES.map((kind) => (
                  <option key={kind} value={kind}>
                    {humanizeMenuProductType(kind)}
                  </option>
                ))}
              </select>
              {isEdit ? (
                <p className="text-xs text-muted-foreground">El catalogo no se puede cambiar despues de crearla.</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="description">
                Descripcion
              </label>
              <Textarea id="description" placeholder="Opcional" rows={3} {...register("description")} />
            </div>
            <Controller
              control={control}
              name="isPublished"
              render={({ field }) => (
                <div className="flex items-start justify-between gap-4 rounded-xl border p-4">
                  <div>
                    <p className="text-sm font-medium">Publicada</p>
                    <p className="mt-1 text-xs text-muted-foreground">Visible en el listado publico.</p>
                  </div>
                  <Switch checked={field.value} onClick={() => field.onChange(!field.value)} type="button" />
                </div>
              )}
            />
          </CardContent>
          <CardFooter className="justify-end gap-2 border-t pt-5">
            <FormSaveActions
              isSubmitting={isSubmitting}
              onCancel={() => router.push(listHref)}
              submitLabel={isEdit ? "Guardar categoria" : "Crear categoria"}
            />
          </CardFooter>
        </Card>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Badge variant={values.isPublished ? "success" : "warning"}>
            {values.isPublished ? "Publicada" : "Borrador"}
          </Badge>
          <Badge variant="secondary">
            <Tags className="h-3 w-3" />
            {humanizeMenuProductType(values.catalogKind)}
          </Badge>
        </div>
      </form>
    </div>
  );
}
