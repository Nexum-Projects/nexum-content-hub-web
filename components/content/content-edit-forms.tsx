"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type FieldErrors,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ImageIcon, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import {
  DEFAULT_MENU_PRODUCT_TYPE,
  humanizeMenuProductType,
  MENU_PRODUCT_TYPES,
} from "@/lib/menu-product-type";

import {
  updateAwardFromForm,
  updateBannerFromForm,
  updateEventFromForm,
  updateProductFromForm,
  type Award,
  type Banner,
  type EventItem,
  type MenuProduct,
} from "@/app/actions/content";
import { BannerImageRecommendation } from "@/components/banners/banner-image-recommendation";
import { FieldError, ContentImageUpload, RichTextEditor, sanitizeHtml } from "@/components/content/content-form-controls";
import { FormSaveActions } from "@/components/forms/form-save-actions";
import { EventDateTimePicker } from "@/components/events/event-datetime-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { utcIsoToGuatemalaLocalForm } from "@/lib/datetime-guatemala";
import { humanizeBannerButtonVariant } from "@/utils/helpers/humanize-enum";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const optionalImageFile = z
  .custom<File | undefined>(
    (file) => file === undefined || (typeof File !== "undefined" && file instanceof File),
    "Selecciona una imagen valida.",
  )
  .optional()
  .superRefine((file, ctx) => {
    if (!file) {
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      ctx.addIssue({ code: "custom", message: "Usa una imagen JPG, PNG o WEBP." });
    }

    if (file.size > MAX_IMAGE_SIZE) {
      ctx.addIssue({ code: "custom", message: "La imagen no puede superar 5MB." });
    }
  });

const buttonSchema = z.object({
  label: z.string().trim().min(1, "El texto del boton es requerido.").max(80, "Maximo 80 caracteres."),
  url: z.string().trim().min(1, "La URL es requerida."),
  variant: z.enum(["PRIMARY", "SECONDARY"]),
  target: z.enum(["_self", "_blank"]),
});

const bannerEditSchema = (hasExistingImage: boolean) =>
  z
    .object({
      title: z.string().trim().min(1, "El titulo es requerido.").max(180, "Maximo 180 caracteres."),
      description: z.string().optional(),
      imageFile: optionalImageFile,
      isPublished: z.boolean(),
      buttons: z.array(buttonSchema),
    })
    .superRefine((value, ctx) => {
      if (!hasExistingImage && !value.imageFile) {
        ctx.addIssue({ code: "custom", path: ["imageFile"], message: "Selecciona una imagen para el banner." });
      }
    });

const productEditSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido.").max(160, "Maximo 160 caracteres."),
  description: z.string().optional(),
  imageFile: optionalImageFile,
  type: z.enum(MENU_PRODUCT_TYPES),
  hasPrice: z.boolean(),
  price: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^\d+(\.\d{1,2})?$/.test(value), "Usa un precio valido, por ejemplo 35.00."),
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
}).superRefine((value, ctx) => {
  if (value.hasPrice && !value.price?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "Ingresa el precio o desactiva la opcion.",
      path: ["price"],
    });
  }
});

const eventEditSchema = z
  .object({
    title: z.string().trim().min(1, "El titulo es requerido.").max(180, "Maximo 180 caracteres."),
    description: z.string().optional(),
    imageFile: optionalImageFile,
    startDate: z.string().trim().min(1, "La fecha de inicio es requerida."),
    endDate: z.string().trim().optional(),
    location: z.string().trim().max(255, "Maximo 255 caracteres.").optional(),
    hasCapacity: z.boolean(),
    capacity: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || /^\d+$/.test(value), "La capacidad debe ser un numero entero."),
    hasPrice: z.boolean(),
    price: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || /^\d+(\.\d{1,2})?$/.test(value), "Usa un precio valido, por ejemplo 125.00."),
    status: z.enum(["ACTIVE", "CANCELLED", "FINISHED"]),
    isPublished: z.boolean(),
    isFeatured: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.endDate && value.endDate < value.startDate) {
      ctx.addIssue({
        code: "custom",
        message: "La fecha de fin debe ser posterior al inicio.",
        path: ["endDate"],
      });
    }
    if (value.hasCapacity && !value.capacity?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Ingresa el cupo maximo o desactiva la opcion.",
        path: ["capacity"],
      });
    }
    if (value.hasPrice && !value.price?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Ingresa el precio o desactiva la opcion.",
        path: ["price"],
      });
    }
  });

const awardEditSchema = z.object({
  title: z.string().trim().min(1, "El titulo es requerido.").max(180, "Maximo 180 caracteres."),
  description: z.string().optional(),
  imageFile: optionalImageFile,
  sourceName: z.string().trim().max(180, "Maximo 180 caracteres.").optional(),
  sourceUrl: z.string().trim().optional(),
  awardedAt: z.string().trim().optional(),
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
});

type BannerEditValues = z.infer<ReturnType<typeof bannerEditSchema>>;
type ProductEditValues = z.infer<typeof productEditSchema>;
type EventEditValues = z.infer<typeof eventEditSchema>;
type AwardEditValues = z.infer<typeof awardEditSchema>;

function appendImage(formData: FormData, file: File | undefined, currentImageUrl?: string | null) {
  if (file) {
    formData.append("imageFile", file);
    if (currentImageUrl) {
      formData.append("previousImageUrl", currentImageUrl);
    }
    return;
  }

  if (currentImageUrl) {
    formData.append("imageUrl", currentImageUrl);
  }
}

function appendBoolean(formData: FormData, key: string, value: boolean) {
  if (value) {
    formData.append(key, "on");
  }
}

function appendOptional(formData: FormData, key: string, value?: string | null) {
  if (value?.trim()) {
    formData.append(key, value.trim());
  }
}

function priceFromCents(priceCents?: number | null) {
  return typeof priceCents === "number" ? (priceCents / 100).toFixed(2) : "";
}

function SaveFooter({
  cancelHref,
  isSubmitting,
  label,
}: {
  cancelHref: string;
  isSubmitting: boolean;
  label: string;
}) {
  return (
    <CardFooter className="flex flex-col-reverse gap-3 border-t p-5 sm:flex-row sm:justify-end">
      <FormSaveActions cancelHref={cancelHref} isSubmitting={isSubmitting} stackOnSmallScreens submitLabel={label} />
    </CardFooter>
  );
}

function HeaderActions({ backHref, title }: { backHref: string; title: string }) {
  return (
    <header className="space-y-4">
      <Button asChild className="rounded-lg" variant="outline">
        <Link href={backHref}>
          <ArrowLeft className="h-4 w-4" />
          Volver al detalle
        </Link>
      </Button>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        <h1 className="text-2xl font-semibold leading-7">Editar contenido</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Actualiza la informacion del registro. El orden se administra desde su pantalla dedicada.
        </p>
      </div>
    </header>
  );
}

function CurrentImage({ imageUrl, title }: { imageUrl?: string | null; title: string }) {
  if (!imageUrl) {
    return (
      <div className="grid min-h-44 place-items-center rounded-xl border bg-muted/30 p-6 text-center text-muted-foreground">
        <div>
          <ImageIcon className="mx-auto h-8 w-8" />
          <p className="mt-2 text-sm">No hay imagen guardada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt={title} className="h-56 w-full object-cover" src={imageUrl} />
      <div className="p-3 text-xs text-muted-foreground">Imagen actual. Al subir una nueva se reemplazara al guardar.</div>
    </div>
  );
}

function PublicationSwitches<T extends FieldValues & { isPublished: boolean; isFeatured?: boolean }>({
  control,
  disabled,
  featured,
}: {
  control: Control<T>;
  disabled: boolean;
  featured?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Controller
        control={control}
        name={"isPublished" as Path<T>}
        render={({ field }) => (
          <div className="flex items-center justify-between gap-4 rounded-xl border bg-background p-4">
            <div>
              <p className="font-medium">Publicado</p>
              <p className="text-sm text-muted-foreground">Visible en la landing page.</p>
            </div>
            <Switch checked={Boolean(field.value)} disabled={disabled} onClick={() => field.onChange(!field.value)} />
          </div>
        )}
      />
      {featured ? (
        <Controller
          control={control}
          name={"isFeatured" as Path<T>}
          render={({ field }) => (
            <div className="flex items-center justify-between gap-4 rounded-xl border bg-background p-4">
              <div>
                <p className="font-medium">Destacado</p>
                <p className="text-sm text-muted-foreground">Aparece con prioridad visual.</p>
              </div>
              <Switch checked={Boolean(field.value)} disabled={disabled} onClick={() => field.onChange(!field.value)} />
            </div>
          )}
        />
      ) : null}
    </div>
  );
}

function PreviewCard({
  badge,
  buttons,
  description,
  imageUrl,
  published,
  title,
}: {
  badge: string;
  buttons?: Array<{ label: string; variant?: "PRIMARY" | "SECONDARY" }>;
  description?: string;
  imageUrl?: string | null;
  published?: boolean;
  title: string;
}) {
  const html = sanitizeHtml(description);

  return (
    <Card className="sticky top-24 rounded-xl border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Vista previa</CardTitle>
            <CardDescription>Asi se vera el contenido publicado.</CardDescription>
          </div>
          <Badge variant={published ? "success" : "warning"}>{published ? "Publicado" : "Borrador"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative min-h-72 overflow-hidden rounded-xl border bg-muted">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={title} className="absolute inset-0 h-full w-full object-cover" src={imageUrl} />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <ImageIcon className="h-10 w-10" />
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/35 to-transparent" />
          <div className="relative flex min-h-72 max-w-lg flex-col justify-center p-6 text-white">
            <Badge className="w-fit bg-primary text-primary-foreground">{badge}</Badge>
            <h2 className="mt-4 text-2xl font-semibold">{title || "Titulo del contenido"}</h2>
            {html ? (
              <div className="mt-3 text-sm leading-6 text-white/85" dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <p className="mt-3 text-sm leading-6 text-white/85">Descripcion del contenido aqui.</p>
            )}
            {buttons?.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {buttons.map((button, index) => (
                  <span
                    className={
                      button.variant === "SECONDARY"
                        ? "rounded-lg border border-white/45 px-4 py-2 text-sm font-medium text-white"
                        : "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
                    }
                    key={`${button.label}-${index}`}
                  >
                    {button.label || "Texto del boton"}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BannerEditForm({ banner, projectId }: { banner: Banner; projectId: string }) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useStateOrCurrent(banner.imageUrl);
  const form = useForm<BannerEditValues>({
    resolver: zodResolver(bannerEditSchema(Boolean(banner.imageUrl))),
    defaultValues: {
      title: banner.title ?? "",
      description: banner.description ?? "",
      imageFile: undefined,
      isPublished: Boolean(banner.isPublished),
      buttons: (banner.buttons ?? [])
        .slice()
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((button) => ({
          label: button.label ?? "",
          url: button.url ?? "",
          variant: button.variant ?? "PRIMARY",
          target: button.target ?? "_self",
        })),
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "buttons" });
  const values = useWatch({ control: form.control }) as BannerEditValues;
  const detailHref = `/dashboard/projects/${projectId}/banners/${banner.id}`;
  const listHref = `/dashboard/projects/${projectId}/banners`;

  async function onSubmit(data: BannerEditValues) {
    const formData = new FormData();
    formData.append("title", data.title);
    appendOptional(formData, "description", data.description);
    appendImage(formData, data.imageFile, banner.imageUrl);
    appendBoolean(formData, "isActive", banner.isActive ?? true);
    appendBoolean(formData, "isPublished", data.isPublished);
    formData.append("sortOrder", String(banner.sortOrder ?? 0));
    formData.append(
      "buttonsJson",
      JSON.stringify(
        data.buttons.map((button, index) => ({
          ...button,
          isActive: true,
          sortOrder: index,
        })),
      ),
    );

    const result = await updateBannerFromForm(projectId, banner.id, formData);
    if (result.status === "success") {
      toast.success("Banner actualizado");
      router.push(listHref);
      router.refresh();
      return;
    }

    toast.error(result.errors?.[0]?.message ?? "No se pudo guardar el banner.");
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <HeaderActions backHref={detailHref} title="Banners / Editar banner" />
      <form className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_480px]" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <Card className="rounded-xl border shadow-sm">
            <CardHeader>
              <CardTitle>Informacion principal</CardTitle>
              <CardDescription>Actualiza el mensaje principal que aparecera en la landing page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="title">
                  Titulo
                </label>
                <Input id="title" placeholder="Ej. Nueva temporada de cafes" {...form.register("title")} />
                <FieldError message={form.formState.errors.title?.message} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descripcion</label>
                <Controller
                  control={form.control}
                  name="description"
                  render={({ field }) => <RichTextEditor error={form.formState.errors.description?.message} onChange={field.onChange} placeholder="Describe el mensaje del banner..." value={field.value} />}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border shadow-sm">
            <CardHeader>
              <CardTitle>Imagen del banner</CardTitle>
              <CardDescription>
                JPG, PNG o WEBP. Maximo 5MB. Recomendado 1920 x 800 px o mayor, proporción aproximada 2.4:1.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CurrentImage imageUrl={banner.imageUrl} title={banner.title} />
              <ContentImageUpload
                emptyLabel="Selecciona una nueva imagen si deseas reemplazar la actual."
                error={form.formState.errors.imageFile?.message}
                file={values.imageFile}
                onChange={(file) => form.setValue("imageFile", file, { shouldDirty: true, shouldValidate: true })}
                onPreviewUrlChange={(url) => setPreviewUrl(url ?? banner.imageUrl ?? null)}
              />
              <BannerImageRecommendation imageUrl={previewUrl} />
            </CardContent>
          </Card>

          <Card className="rounded-xl border shadow-sm">
            <CardHeader>
              <CardTitle>Publicacion</CardTitle>
              <CardDescription>El orden del banner se administra desde la pantalla de ordenamiento.</CardDescription>
            </CardHeader>
            <CardContent>
              <PublicationSwitches control={form.control} disabled={form.formState.isSubmitting} />
            </CardContent>
          </Card>

          <Card className="rounded-xl border shadow-sm">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Botones del banner</CardTitle>
                  <CardDescription>Agrega llamadas a la accion opcionales.</CardDescription>
                </div>
                <Button onClick={() => append({ label: "", url: "", variant: "PRIMARY", target: "_self" })} type="button" variant="outline">
                  <Plus className="h-4 w-4" />
                  Agregar boton
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.length > 2 ? (
                <Alert className="border-warning/30 bg-warning/10">
                  <AlertTitle>Recomendacion</AlertTitle>
                  <AlertDescription>Para mantener el banner limpio, usa como maximo 2 botones.</AlertDescription>
                </Alert>
              ) : null}
              {fields.length === 0 ? <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No hay botones configurados.</p> : null}
              {fields.map((field, index) => (
                <Card className="rounded-xl border bg-card shadow-none" key={field.id}>
                  <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 p-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="truncate text-base">{values.buttons?.[index]?.label || "Boton sin titulo"}</CardTitle>
                        <Badge variant="outline">{humanizeBannerButtonVariant(values.buttons?.[index]?.variant)}</Badge>
                      </div>
                      <CardDescription className="truncate">{values.buttons?.[index]?.url || "Sin URL"}</CardDescription>
                    </div>
                    <Button onClick={() => remove(index)} size="icon" type="button" variant="ghost">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </CardHeader>
                  <Separator />
                  <CardContent className="grid gap-4 p-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Texto</label>
                      <Input placeholder="Ej. Ver menu" {...form.register(`buttons.${index}.label`)} />
                      <FieldError message={form.formState.errors.buttons?.[index]?.label?.message} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">URL destino</label>
                      <Input placeholder="Ej. /menu" {...form.register(`buttons.${index}.url`)} />
                      <FieldError message={form.formState.errors.buttons?.[index]?.url?.message} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Variante</label>
                      <Select {...form.register(`buttons.${index}.variant`)}>
                        <option value="PRIMARY">Principal</option>
                        <option value="SECONDARY">Secundario</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Abrir en</label>
                      <Select {...form.register(`buttons.${index}.target`)}>
                        <option value="_self">Misma pestana</option>
                        <option value="_blank">Nueva pestana</option>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
            <SaveFooter cancelHref={listHref} isSubmitting={form.formState.isSubmitting} label="Guardar banner" />
          </Card>
        </div>

        <PreviewCard
          badge="Banner"
          buttons={values.buttons}
          description={values.description}
          imageUrl={previewUrl}
          published={values.isPublished}
          title={values.title || "Titulo del banner"}
        />
      </form>
    </div>
  );
}

export function ProductEditForm({ product, projectId }: { product: MenuProduct; projectId: string }) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useStateOrCurrent(product.imageUrl);
  const form = useForm<ProductEditValues>({
    resolver: zodResolver(productEditSchema),
    defaultValues: {
      name: product.name ?? "",
      description: product.description ?? "",
      imageFile: undefined,
      type: product.type ?? DEFAULT_MENU_PRODUCT_TYPE,
      hasPrice: typeof product.priceCents === "number",
      price: priceFromCents(product.priceCents),
      isPublished: Boolean(product.isPublished),
      isFeatured: Boolean(product.isFeatured),
    },
  });
  const values = useWatch({ control: form.control }) as ProductEditValues;
  const detailHref = `/dashboard/projects/${projectId}/products/${product.id}`;
  const listHref = `/dashboard/projects/${projectId}/products`;

  useEffect(() => {
    if (!values.hasPrice) {
      form.setValue("price", "", { shouldDirty: false, shouldValidate: true });
    }
  }, [form, values.hasPrice]);

  async function onSubmit(data: ProductEditValues) {
    const formData = new FormData();
    formData.append("name", data.name);
    appendOptional(formData, "description", data.description);
    appendImage(formData, data.imageFile, product.imageUrl);
    formData.append("type", data.type);
    if (data.hasPrice) {
      appendOptional(formData, "price", data.price);
    }
    appendBoolean(formData, "isAvailable", product.isAvailable ?? true);
    appendBoolean(formData, "isActive", product.isActive ?? true);
    appendBoolean(formData, "isPublished", data.isPublished);
    appendBoolean(formData, "isFeatured", data.isFeatured);
    formData.append("sortOrder", String(product.sortOrder ?? 0));

    const result = await updateProductFromForm(projectId, product.id, formData);
    if (result.status === "success") {
      toast.success("Producto actualizado");
      router.push(listHref);
      router.refresh();
      return;
    }

    toast.error(result.errors?.[0]?.message ?? "No se pudo guardar el producto.");
  }

  return (
    <ContentEntityForm
      detailHref={detailHref}
      listHref={listHref}
      badge="Producto"
      currentImageUrl={product.imageUrl}
      description={values.description}
      form={form}
      imageFile={values.imageFile}
      imageTitle={product.name}
      onImagePreviewChange={setPreviewUrl}
      onSubmit={onSubmit}
      previewImageUrl={previewUrl}
      published={values.isPublished}
      saveLabel="Guardar producto"
      title={values.name || "Nombre del producto"}
      titlePath="name"
      titleText="Menu / Productos / Editar producto"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo</label>
          <Select {...form.register("type")}>
            {MENU_PRODUCT_TYPES.map((t) => (
              <option key={t} value={t}>
                {humanizeMenuProductType(t)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-3 rounded-xl border p-4 md:col-span-2">
          <Controller
            control={form.control}
            name="hasPrice"
            render={({ field }) => (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Definir precio</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Desactivalo para guardar el producto sin precio.
                  </p>
                </div>
                <Switch checked={field.value} disabled={form.formState.isSubmitting} onClick={() => field.onChange(!field.value)} type="button" />
              </div>
            )}
          />
          {values.hasPrice ? (
            <div className="space-y-2 pt-1">
              <label className="text-sm font-medium">Precio</label>
              <Input inputMode="decimal" placeholder="Ej. 35.00" {...form.register("price")} />
              <FieldError message={form.formState.errors.price?.message} />
            </div>
          ) : (
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Se guardara como sin precio.
            </p>
          )}
        </div>
      </div>
      <PublicationSwitches control={form.control} disabled={form.formState.isSubmitting} featured />
    </ContentEntityForm>
  );
}

export function EventEditForm({ event, projectId }: { event: EventItem; projectId: string }) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useStateOrCurrent(event.imageUrl);
  const form = useForm<EventEditValues>({
    resolver: zodResolver(eventEditSchema),
    defaultValues: {
      title: event.title ?? "",
      description: event.description ?? "",
      imageFile: undefined,
      startDate: utcIsoToGuatemalaLocalForm(event.startDate),
      endDate: utcIsoToGuatemalaLocalForm(event.endDate),
      location: event.location ?? "",
      hasCapacity: typeof event.capacity === "number",
      capacity: typeof event.capacity === "number" ? String(event.capacity) : "",
      hasPrice: typeof event.priceCents === "number",
      price: priceFromCents(event.priceCents),
      status: event.status ?? "ACTIVE",
      isPublished: Boolean(event.isPublished),
      isFeatured: Boolean(event.isFeatured),
    },
  });
  const values = useWatch({ control: form.control }) as EventEditValues;
  const detailHref = `/dashboard/projects/${projectId}/events/${event.id}`;
  const listHref = `/dashboard/projects/${projectId}/events`;

  useEffect(() => {
    if (!values.hasCapacity) {
      form.setValue("capacity", "", { shouldDirty: false, shouldValidate: true });
    }
  }, [form, values.hasCapacity]);

  useEffect(() => {
    if (!values.hasPrice) {
      form.setValue("price", "", { shouldDirty: false, shouldValidate: true });
    }
  }, [form, values.hasPrice]);

  async function onSubmit(data: EventEditValues) {
    const formData = new FormData();
    formData.append("title", data.title);
    appendOptional(formData, "description", data.description);
    appendImage(formData, data.imageFile, event.imageUrl);
    formData.append("startDate", data.startDate);
    appendOptional(formData, "endDate", data.endDate);
    appendOptional(formData, "location", data.location);
    if (data.hasCapacity) {
      appendOptional(formData, "capacity", data.capacity);
    }
    if (data.hasPrice) {
      appendOptional(formData, "price", data.price);
    }
    formData.append("status", data.status);
    appendBoolean(formData, "isActive", event.isActive ?? true);
    appendBoolean(formData, "isPublished", data.isPublished);
    appendBoolean(formData, "isFeatured", data.isFeatured);
    formData.append("sortOrder", String(event.sortOrder ?? 0));

    const result = await updateEventFromForm(projectId, event.id, formData);
    if (result.status === "success") {
      toast.success("Evento actualizado");
      router.push(listHref);
      router.refresh();
      return;
    }

    toast.error(result.errors?.[0]?.message ?? "No se pudo guardar el evento.");
  }

  return (
    <ContentEntityForm
      detailHref={detailHref}
      listHref={listHref}
      badge="Evento"
      currentImageUrl={event.imageUrl}
      description={values.description}
      form={form}
      imageFile={values.imageFile}
      imageTitle={event.title}
      onImagePreviewChange={setPreviewUrl}
      onSubmit={onSubmit}
      previewImageUrl={previewUrl}
      published={values.isPublished}
      saveLabel="Guardar evento"
      title={values.title || "Titulo del evento"}
      titlePath="title"
      titleText="Eventos / Editar evento"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Controller
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <EventDateTimePicker
                hint="Selecciona la fecha y hora de inicio del evento."
                id="startDate"
                label="Fecha inicio"
                onChange={field.onChange}
                value={field.value}
              />
            )}
          />
          <FieldError message={form.formState.errors.startDate?.message} />
        </div>
        <div className="space-y-2">
          <Controller
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <EventDateTimePicker
                hint="Opcional. Borra la seleccion si el evento no tiene hora de fin."
                id="endDate"
                label="Fecha fin"
                onChange={field.onChange}
                value={field.value}
              />
            )}
          />
          <FieldError message={form.formState.errors.endDate?.message} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Ubicacion</label>
          <Input placeholder="Ej. Terraza principal" {...form.register("location")} />
          <FieldError message={form.formState.errors.location?.message} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Estado</label>
          <Select {...form.register("status")}>
            <option value="ACTIVE">Activo</option>
            <option value="CANCELLED">Cancelado</option>
            <option value="FINISHED">Finalizado</option>
          </Select>
        </div>
        <div className="space-y-3 rounded-xl border p-4 md:col-span-2">
          <Controller
            control={form.control}
            name="hasCapacity"
            render={({ field }) => (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Definir cupo maximo</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Desactivalo para guardar el evento sin capacidad definida.
                  </p>
                </div>
                <Switch checked={field.value} disabled={form.formState.isSubmitting} onClick={() => field.onChange(!field.value)} type="button" />
              </div>
            )}
          />
          {values.hasCapacity ? (
            <div className="space-y-2 pt-1">
              <label className="text-sm font-medium">Capacidad</label>
              <Input inputMode="numeric" placeholder="Ej. 80" {...form.register("capacity")} />
              <FieldError message={form.formState.errors.capacity?.message} />
            </div>
          ) : (
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Se guardara sin capacidad definida.
            </p>
          )}
        </div>
        <div className="space-y-3 rounded-xl border p-4 md:col-span-2">
          <Controller
            control={form.control}
            name="hasPrice"
            render={({ field }) => (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Definir precio de entrada</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Desactivalo para guardar el evento sin precio.
                  </p>
                </div>
                <Switch checked={field.value} disabled={form.formState.isSubmitting} onClick={() => field.onChange(!field.value)} type="button" />
              </div>
            )}
          />
          {values.hasPrice ? (
            <div className="space-y-2 pt-1">
              <label className="text-sm font-medium">Precio</label>
              <Input inputMode="decimal" placeholder="Ej. 125.00" {...form.register("price")} />
              <FieldError message={form.formState.errors.price?.message} />
            </div>
          ) : (
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Se guardara como sin precio.
            </p>
          )}
        </div>
      </div>
      <PublicationSwitches control={form.control} disabled={form.formState.isSubmitting} featured />
    </ContentEntityForm>
  );
}

export function AwardEditForm({ award, projectId }: { award: Award; projectId: string }) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useStateOrCurrent(award.imageUrl);
  const form = useForm<AwardEditValues>({
    resolver: zodResolver(awardEditSchema),
    defaultValues: {
      title: award.title ?? "",
      description: award.description ?? "",
      imageFile: undefined,
      sourceName: award.sourceName ?? "",
      sourceUrl: award.sourceUrl ?? "",
      awardedAt: utcIsoToGuatemalaLocalForm(award.awardedAt),
      isPublished: Boolean(award.isPublished),
      isFeatured: Boolean(award.isFeatured),
    },
  });
  const values = useWatch({ control: form.control }) as AwardEditValues;
  const detailHref = `/dashboard/projects/${projectId}/awards/${award.id}`;
  const listHref = `/dashboard/projects/${projectId}/awards`;

  async function onSubmit(data: AwardEditValues) {
    const formData = new FormData();
    formData.append("title", data.title);
    appendOptional(formData, "description", data.description);
    appendImage(formData, data.imageFile, award.imageUrl);
    appendOptional(formData, "sourceName", data.sourceName);
    appendOptional(formData, "sourceUrl", data.sourceUrl);
    appendOptional(formData, "awardedAt", data.awardedAt);
    appendBoolean(formData, "isActive", award.isActive ?? true);
    appendBoolean(formData, "isPublished", data.isPublished);
    appendBoolean(formData, "isFeatured", data.isFeatured);
    formData.append("sortOrder", String(award.sortOrder ?? 0));

    const result = await updateAwardFromForm(projectId, award.id, formData);
    if (result.status === "success") {
      toast.success("Logro actualizado");
      router.push(listHref);
      router.refresh();
      return;
    }

    toast.error(result.errors?.[0]?.message ?? "No se pudo guardar el logro.");
  }

  return (
    <ContentEntityForm
      detailHref={detailHref}
      listHref={listHref}
      badge="Logro"
      currentImageUrl={award.imageUrl}
      description={values.description}
      form={form}
      imageFile={values.imageFile}
      imageTitle={award.title}
      onImagePreviewChange={setPreviewUrl}
      onSubmit={onSubmit}
      previewImageUrl={previewUrl}
      published={values.isPublished}
      saveLabel="Guardar logro"
      title={values.title || "Titulo del logro"}
      titlePath="title"
      titleText="Logros / Editar logro"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Fuente</label>
          <Input placeholder="Ej. Revista especializada" {...form.register("sourceName")} />
          <FieldError message={form.formState.errors.sourceName?.message} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">URL fuente</label>
          <Input placeholder="https://..." {...form.register("sourceUrl")} />
          <FieldError message={form.formState.errors.sourceUrl?.message} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Controller
            control={form.control}
            name="awardedAt"
            render={({ field }) => (
              <EventDateTimePicker
                hint="Opcional. Fecha civil del reconocimiento."
                id="awardedAt"
                label="Fecha del reconocimiento"
                onChange={field.onChange}
                value={field.value}
                variant="date"
              />
            )}
          />
          <FieldError message={form.formState.errors.awardedAt?.message} />
        </div>
      </div>
      <PublicationSwitches control={form.control} disabled={form.formState.isSubmitting} featured />
    </ContentEntityForm>
  );
}

type CommonEditValues = FieldValues & {
  description?: string;
  imageFile?: File;
  isPublished: boolean;
  name?: string;
  title?: string;
};

function getFormError<T extends FieldValues>(errors: FieldErrors<T>, key: Path<T>) {
  const record = errors as Record<string, { message?: unknown } | undefined>;
  const message = record[String(key)]?.message;
  return typeof message === "string" ? message : undefined;
}

function ContentEntityForm<T extends CommonEditValues>({
  detailHref,
  listHref,
  badge,
  children,
  currentImageUrl,
  description,
  form,
  imageFile,
  imageTitle,
  onImagePreviewChange,
  onSubmit,
  previewImageUrl,
  published,
  saveLabel,
  title,
  titlePath,
  titleText,
}: {
  detailHref: string;
  listHref: string;
  badge: string;
  children: ReactNode;
  currentImageUrl?: string | null;
  description?: string;
  form: UseFormReturn<T>;
  imageFile?: File;
  imageTitle: string;
  onImagePreviewChange: (url: string | null) => void;
  onSubmit: (data: T) => void;
  previewImageUrl?: string | null;
  published?: boolean;
  saveLabel: string;
  title: string;
  titlePath: Path<T>;
  titleText: string;
}) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <HeaderActions backHref={detailHref} title={titleText} />
      <form className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_480px]" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <Card className="rounded-xl border shadow-sm">
            <CardHeader>
              <CardTitle>Informacion principal</CardTitle>
              <CardDescription>Usa textos claros y breves para que el contenido sea facil de leer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">{titlePath === "name" ? "Nombre" : "Titulo"}</label>
                <Input placeholder={titlePath === "name" ? "Ej. Latte de vainilla" : "Ej. Noche de jazz"} {...form.register(titlePath)} />
                <FieldError message={getFormError(form.formState.errors, titlePath)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descripcion</label>
                <Controller
                  control={form.control}
                  name={"description" as Path<T>}
                  render={({ field }) => (
                    <RichTextEditor
                      error={getFormError(form.formState.errors, "description" as Path<T>)}
                      onChange={field.onChange}
                      placeholder="Describe el contenido..."
                      value={typeof field.value === "string" ? field.value : ""}
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border shadow-sm">
            <CardHeader>
              <CardTitle>Imagen</CardTitle>
              <CardDescription>JPG, PNG o WEBP. Maximo 5MB. Se reemplazara solo si eliges una nueva imagen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CurrentImage imageUrl={currentImageUrl} title={imageTitle} />
              <ContentImageUpload
                emptyLabel="Selecciona una imagen nueva si deseas cambiar la actual."
                error={getFormError(form.formState.errors, "imageFile" as Path<T>)}
                file={imageFile}
                onChange={(file) => form.setValue("imageFile" as Path<T>, file as T[Path<T>], { shouldDirty: true, shouldValidate: true })}
                onPreviewUrlChange={(url) => onImagePreviewChange(url ?? currentImageUrl ?? null)}
              />
            </CardContent>
          </Card>

          <Card className="rounded-xl border shadow-sm">
            <CardHeader>
              <CardTitle>Configuracion</CardTitle>
              <CardDescription>Los nuevos elementos se agregan automaticamente al final de la lista. El orden se cambia desde ordenar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">{children}</CardContent>
            <SaveFooter cancelHref={listHref} isSubmitting={form.formState.isSubmitting} label={saveLabel} />
          </Card>
        </div>

        <PreviewCard badge={badge} description={description} imageUrl={previewImageUrl} published={published} title={title} />
      </form>
    </div>
  );
}

function useStateOrCurrent(current?: string | null): [string | null, (value: string | null) => void] {
  return useState<string | null>(current ?? null);
}
