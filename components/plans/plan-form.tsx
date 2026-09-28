"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { createPlan, updatePlan } from "@/app/actions/content/plans";
import type { Plan } from "@/app/actions/content/types";
import { FieldError } from "@/components/content/content-form-controls";
import { FormSaveActions } from "@/components/forms/form-save-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CMS_RESOURCES, CMS_RESOURCE_LABELS, type CmsResource } from "@/lib/cms-resources";

const LIST_HREF = "/dashboard/admin/plans";

const planSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(100, "Maximo 100 caracteres"),
  description: z.string().max(500, "Maximo 500 caracteres").optional(),
  resources: z.array(z.enum(CMS_RESOURCES)),
});

type PlanFormValues = z.infer<typeof planSchema>;

export function PlanForm({ plan, resources }: { plan?: Plan; resources: CmsResource[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = Boolean(plan);

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: plan?.name ?? "",
      description: plan?.description ?? "",
      resources: plan?.resources ?? [],
    },
  });

  async function onSubmit(data: PlanFormValues) {
    setIsSubmitting(true);
    const payload = { name: data.name, description: data.description?.trim() || undefined, resources: data.resources };
    const result = plan ? await updatePlan(plan.id, payload) : await createPlan(payload);
    setIsSubmitting(false);

    if (result.status === "error") {
      toast.error(result.errors[0]?.title ?? "No se pudo guardar el plan", { description: result.errors[0]?.message });
      return;
    }

    toast.success(isEdit ? "Plan actualizado" : "Plan creado");
    router.push(LIST_HREF);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="space-y-4">
        <Button asChild className="rounded-lg" variant="outline">
          <Link href={LIST_HREF}>
            <ArrowLeft className="h-4 w-4" />
            Volver a planes
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold leading-7">{isEdit ? "Editar plan" : "Nuevo plan"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            El plan define qué secciones del CMS tienen habilitadas los proyectos que lo usan.
          </p>
        </div>
      </header>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Informacion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="name">
                Nombre <span className="text-destructive">*</span>
              </label>
              <Input id="name" placeholder="Ej. Pro" {...register("name")} />
              <FieldError message={errors.name?.message} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="description">
                Descripcion
              </label>
              <Textarea id="description" rows={3} {...register("description")} />
              <FieldError message={errors.description?.message} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Secciones habilitadas</CardTitle>
            <CardDescription>Quitar una sección la oculta para todos los miembros de los proyectos con este plan.</CardDescription>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="resources"
              render={({ field }) => (
                <div className="grid gap-2 sm:grid-cols-2">
                  {resources.map((resource) => (
                    <label className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm" key={resource}>
                      <input
                        checked={field.value.includes(resource)}
                        className="h-4 w-4 accent-primary"
                        onChange={(event) =>
                          field.onChange(
                            event.target.checked ? [...field.value, resource] : field.value.filter((r) => r !== resource),
                          )
                        }
                        type="checkbox"
                      />
                      {CMS_RESOURCE_LABELS[resource] ?? resource}
                    </label>
                  ))}
                </div>
              )}
            />
          </CardContent>
          <CardFooter className="flex flex-wrap justify-end gap-2 border-t pt-5">
            <FormSaveActions cancelHref={LIST_HREF} isSubmitting={isSubmitting} submitLabel={isEdit ? "Guardar cambios" : "Crear plan"} />
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
