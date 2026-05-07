"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Resolver } from "react-hook-form";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CalendarDays, ImagePlus, Loader2, MapPin, Star } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { createEventFromForm } from "@/app/actions/content";
import { ContentImageUpload, FieldError, RichTextEditor, sanitizeHtml } from "@/components/content/content-form-controls";
import { EventDateTimePicker } from "@/components/events/event-datetime-picker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Switch } from "@/components/ui/switch";
import { guatemalaLocalInputToUtcMs } from "@/lib/datetime-guatemala";
import { humanizeEventStatus } from "@/utils/helpers/humanize-enum";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function normalizeOptionalFiniteNumber(val: unknown): number | undefined {
  if (val === "" || val === undefined || val === null) {
    return undefined;
  }
  if (typeof val !== "number" || Number.isNaN(val) || !Number.isFinite(val)) {
    return undefined;
  }
  return val;
}

const optionalPriceGtq = z
  .unknown()
  .transform(normalizeOptionalFiniteNumber)
  .pipe(z.number().min(0, "El precio no puede ser negativo").optional());

const optionalCapacity = z
  .unknown()
  .transform(normalizeOptionalFiniteNumber)
  .pipe(
    z
      .number()
      .int("La capacidad debe ser un numero entero")
      .min(0, "La capacidad no puede ser negativa")
      .optional(),
  );

const eventSchema = z
  .object({
    title: z.string().min(1, "El titulo es requerido").max(180, "Maximo 180 caracteres"),
    slug: z.string().max(200, "Maximo 200 caracteres").optional(),
    description: z.string().optional(),
    imageFile: z
      .custom<File>((file) => file instanceof File, "Selecciona una imagen")
      .refine((file) => ACCEPTED_TYPES.includes(file.type), "Usa JPG, PNG o WEBP")
      .refine((file) => file.size <= MAX_FILE_SIZE, "La imagen no debe superar 5MB"),
    startDate: z.string().min(1, "La fecha de inicio es requerida"),
    endDate: z.string().optional(),
    location: z.string().max(255, "Maximo 255 caracteres").optional(),
    hasCapacity: z.boolean(),
    hasPrice: z.boolean(),
    capacity: optionalCapacity,
    price: optionalPriceGtq,
    status: z.enum(["ACTIVE", "CANCELLED", "FINISHED"]),
    sortOrder: z.number().int("El orden debe ser un numero entero").min(0, "El orden debe ser 0 o mayor"),
    isPublished: z.boolean(),
    isFeatured: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.endDate || !data.startDate) {
      return;
    }

    const startMs = guatemalaLocalInputToUtcMs(data.startDate);
    const endMs = guatemalaLocalInputToUtcMs(data.endDate);
    if (startMs !== null && endMs !== null && endMs < startMs) {
      ctx.addIssue({
        code: "custom",
        message: "La fecha fin no puede ser anterior a la fecha inicio",
        path: ["endDate"],
      });
    }

    if (data.hasCapacity) {
      if (typeof data.capacity !== "number" || !Number.isFinite(data.capacity)) {
        ctx.addIssue({
          code: "custom",
          message: "Ingresa el cupo maximo o desactiva la opcion.",
          path: ["capacity"],
        });
      }
    }

    if (data.hasPrice) {
      if (typeof data.price !== "number" || !Number.isFinite(data.price)) {
        ctx.addIssue({
          code: "custom",
          message: "Ingresa el precio o desactiva la opcion.",
          path: ["price"],
        });
      }
    }
  });

type EventFormValues = {
  title: string;
  slug?: string;
  description?: string;
  imageFile: File;
  startDate: string;
  endDate?: string;
  location?: string;
  hasCapacity: boolean;
  hasPrice: boolean;
  capacity?: number;
  price?: number;
  status: "ACTIVE" | "CANCELLED" | "FINISHED";
  sortOrder: number;
  isPublished: boolean;
  isFeatured: boolean;
};

function formatPrice(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "Sin precio";
  }

  return `Q${value.toFixed(2)}`;
}

function formatDate(value?: string) {
  return value ? value.replace("T", " ") : "Fecha por definir";
}

export function EventForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema) as Resolver<EventFormValues>,
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      startDate: "",
      endDate: "",
      location: "",
      hasCapacity: false,
      hasPrice: false,
      capacity: undefined,
      price: undefined,
      status: "ACTIVE",
      sortOrder: 0,
      isPublished: false,
      isFeatured: false,
    },
  });

  const values = useWatch({ control });

  useEffect(() => {
    if (values.hasCapacity === false) {
      setValue("capacity", undefined, { shouldValidate: true });
    }
  }, [values.hasCapacity, setValue]);

  useEffect(() => {
    if (values.hasPrice === false) {
      setValue("price", undefined, { shouldValidate: true });
    }
  }, [values.hasPrice, setValue]);
  const previewTitle = values.title?.trim() || "Titulo del evento";
  const previewDescription = sanitizeHtml(values.description) || "<p>Descripcion breve del evento.</p>";

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

  function onCancel() {
    router.push(`/dashboard/projects/${projectId}/events`);
  }

  async function onSubmit(data: EventFormValues) {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("title", data.title);
    if (data.slug?.trim()) formData.append("slug", data.slug);
    formData.append("description", data.description ?? "");
    formData.append("imageFile", data.imageFile);
    formData.append("startDate", data.startDate);
    if (data.endDate?.trim()) formData.append("endDate", data.endDate);
    if (data.location?.trim()) formData.append("location", data.location);
    if (data.hasCapacity && typeof data.capacity === "number") formData.append("capacity", String(data.capacity));
    if (data.hasPrice && typeof data.price === "number") formData.append("price", String(data.price));
    formData.append("status", "ACTIVE");
    formData.append("sortOrder", String(data.sortOrder));
    if (data.isPublished) formData.append("isPublished", "on");
    if (data.isFeatured) formData.append("isFeatured", "on");

    const result = await createEventFromForm(projectId, formData);
    setIsSubmitting(false);

    if (result.status === "error") {
      toast.error(result.errors[0]?.title ?? "No se pudo crear el evento", {
        description: result.errors[0]?.message,
      });
      return;
    }

    toast.success("Evento creado", {
      description: "El evento se guardo correctamente.",
    });
    reset(data);
    router.push(`/dashboard/projects/${projectId}/events`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Link className="font-medium text-primary hover:underline" href={`/dashboard/projects/${projectId}/events`}>
              Eventos
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">Nuevo evento</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-7">Nuevo evento</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Configura eventos para la landing page con fechas, cupo, imagen y estado de publicacion.
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/dashboard/projects/${projectId}/events`}>
            <ArrowLeft className="h-4 w-4" />
            Volver a eventos
          </Link>
        </Button>
      </header>

      <form className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.9fr)]" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informacion principal</CardTitle>
              <CardDescription>Define el contenido base del evento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="title">
                    Titulo <span className="text-destructive">*</span>
                  </label>
                  <Input id="title" placeholder="Ej. Noche de jazz" {...register("title")} />
                  <FieldError message={errors.title?.message} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="slug">Slug</label>
                  <Input id="slug" placeholder="noche-de-jazz" {...register("slug")} />
                  <FieldError message={errors.slug?.message} />
                </div>
              </div>

              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descripcion</label>
                    <RichTextEditor error={errors.description?.message} onChange={field.onChange} placeholder="Describe la experiencia del evento..." value={field.value} />
                    <p className="text-xs text-muted-foreground">El contenido se guarda como HTML para mantener el formato en la landing page.</p>
                  </div>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Imagen del evento</CardTitle>
              <CardDescription>Sube una imagen clara del evento. Recomendado: 1600x900px o superior.</CardDescription>
            </CardHeader>
            <CardContent>
              <Controller
                control={control}
                name="imageFile"
                render={({ field }) => (
                  <ContentImageUpload error={errors.imageFile?.message} file={field.value} onChange={field.onChange} onPreviewUrlChange={setPreviewImageUrl} />
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fecha, lugar y cupo</CardTitle>
              <CardDescription>Define cuando ocurre y como se comunica al visitante.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <Controller
                  control={control}
                  name="startDate"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <EventDateTimePicker
                        hint="Lenguaje natural (ES/EN) o calendario; luego ajusta la hora."
                        id="startDate"
                        label="Fecha y hora de inicio"
                        onChange={field.onChange}
                        value={field.value}
                      />
                      <FieldError message={errors.startDate?.message} />
                    </div>
                  )}
                />
              </div>
              <div className="md:col-span-2">
                <Controller
                  control={control}
                  name="endDate"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <EventDateTimePicker
                        hint="Opcional. Si no la defines, el evento usa solo la fecha de inicio. Borra el texto para limpiar."
                        id="endDate"
                        label="Fecha y hora de fin"
                        onChange={field.onChange}
                        value={field.value}
                      />
                      <FieldError message={errors.endDate?.message} />
                    </div>
                  )}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="location">Ubicacion</label>
                <Input id="location" placeholder="Ej. Salon principal" {...register("location")} />
                <FieldError message={errors.location?.message} />
              </div>

              <div className="space-y-3 rounded-xl border p-4 md:col-span-2">
                <Controller
                  control={control}
                  name="hasCapacity"
                  render={({ field }) => (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">Definir cupo maximo</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Activa esta opcion solo si quieres guardar un cupo maximo.
                        </p>
                      </div>
                      <Switch checked={field.value} onClick={() => field.onChange(!field.value)} type="button" />
                    </div>
                  )}
                />
                {values.hasCapacity ? (
                  <div className="space-y-2 pt-1">
                    <label className="text-sm font-medium" htmlFor="capacity">
                      Cupo
                    </label>
                    <Input
                      id="capacity"
                      min="0"
                      step="1"
                      type="number"
                      {...register("capacity", {
                        setValueAs: (value) => {
                          if (value === "") return undefined;
                          const n = Number(value);
                          return Number.isFinite(n) ? n : undefined;
                        },
                      })}
                    />
                    <FieldError message={errors.capacity?.message} />
                  </div>
                ) : null}
              </div>

              <div className="space-y-3 rounded-xl border p-4 md:col-span-2">
                <Controller
                  control={control}
                  name="hasPrice"
                  render={({ field }) => (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">Definir precio de entrada</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Activa esta opcion solo si quieres guardar un precio de entrada.
                        </p>
                      </div>
                      <Switch checked={field.value} onClick={() => field.onChange(!field.value)} type="button" />
                    </div>
                  )}
                />
                {values.hasPrice ? (
                  <div className="space-y-2 pt-1">
                    <label className="text-sm font-medium" htmlFor="price">
                      Precio
                    </label>
                    <Input
                      id="price"
                      min="0"
                      placeholder="Ej. 75"
                      step="0.01"
                      type="number"
                      {...register("price", {
                        setValueAs: (value) => {
                          if (value === "") return undefined;
                          const n = Number(value);
                          return Number.isFinite(n) ? n : undefined;
                        },
                      })}
                    />
                    <FieldError message={errors.price?.message} />
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publicacion y orden</CardTitle>
              <CardDescription>Controla visibilidad y orden del evento.</CardDescription>
            </CardHeader>
            <CardContent className="flex w-full flex-col gap-4">
              <Controller
                control={control}
                name="sortOrder"
                render={({ field }) => (
                  <div className="w-full">
                    <NumberInput
                      className="max-w-none"
                      description="Menor numero = aparece primero."
                      errorMessage={errors.sortOrder?.message}
                      label="Orden"
                      minValue={0}
                      onChange={(nextValue) => field.onChange(Number.isFinite(nextValue) ? nextValue : 0)}
                      value={Number.isFinite(field.value) ? field.value : 0}
                    />
                  </div>
                )}
              />
              <Controller
                control={control}
                name="isPublished"
                render={({ field }) => (
                  <div className="flex w-full items-start justify-between gap-4 rounded-xl border p-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">Publicado</p>
                      <p className="mt-1 text-xs text-muted-foreground">Visible en la landing page.</p>
                    </div>
                    <Switch checked={field.value} onClick={() => field.onChange(!field.value)} type="button" />
                  </div>
                )}
              />
              <Controller
                control={control}
                name="isFeatured"
                render={({ field }) => (
                  <div className="flex w-full items-start justify-between gap-4 rounded-xl border p-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">Destacado</p>
                      <p className="mt-1 text-xs text-muted-foreground">Resalta este evento.</p>
                    </div>
                    <Switch checked={field.value} onClick={() => field.onChange(!field.value)} type="button" />
                  </div>
                )}
              />
            </CardContent>
            <CardFooter className="justify-end gap-2 border-t pt-5">
              <Button disabled={isSubmitting} onClick={onCancel} type="button" variant="outline">Cancelar</Button>
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear evento
              </Button>
            </CardFooter>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Vista previa</CardTitle>
              <CardDescription>Asi se vera el evento en la landing page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-xl border bg-card">
                <div className="relative aspect-video bg-muted">
                  {values.imageFile && previewImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="Evento seleccionado" className="h-full w-full object-cover" src={previewImageUrl} />
                  ) : (
                    <div className="grid h-full place-items-center bg-[linear-gradient(135deg,#0f172a,#2563eb)] text-white/75">
                      <div className="text-center">
                        <ImagePlus className="mx-auto h-10 w-10" />
                        <p className="mt-2 text-sm">Imagen del evento</p>
                      </div>
                    </div>
                  )}
                  {values.isFeatured && (
                    <Badge className="absolute left-3 top-3 bg-amber-500 text-white">
                      <Star className="h-3 w-3 fill-current" />
                      Destacado
                    </Badge>
                  )}
                </div>
                <div className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={values.isPublished ? "success" : "warning"}>{values.isPublished ? "Publicado" : "Borrador"}</Badge>
                    <Badge variant="secondary">{humanizeEventStatus("ACTIVE")}</Badge>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{previewTitle}</h2>
                    <div className="mt-2 text-sm leading-6 text-muted-foreground [&_a]:text-primary [&_a]:underline [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: previewDescription }} />
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" />{formatDate(values.startDate)}</p>
                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{values.location?.trim() || "Ubicacion por definir"}</p>
                    <p>
                      {values.hasPrice ? formatPrice(values.price) : "Sin precio"}
                      {values.hasCapacity && typeof values.capacity === "number" ? ` · Cupo ${values.capacity}` : ""}
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertTitle>Estado visual</AlertTitle>
                <AlertDescription>El estado administrativo y el switch publicado pueden manejarse por separado cuando necesites preparar eventos antes de publicarlos.</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </aside>
      </form>
    </div>
  );
}
