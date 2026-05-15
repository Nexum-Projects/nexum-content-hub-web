"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Award as AwardIcon, ExternalLink, ImagePlus, Star } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { createAwardFromForm } from "@/app/actions/content";
import { FormSaveActions } from "@/components/forms/form-save-actions";
import { ContentImageUpload, FieldError, RichTextEditor, sanitizeHtml } from "@/components/content/content-form-controls";
import { EventDateTimePicker } from "@/components/events/event-datetime-picker";
import { formatDateGuatemala, guatemalaLocalInputToUtcIso } from "@/lib/datetime-guatemala";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const optionalUrl = z
  .string()
  .optional()
  .refine((value) => !value || /^(https?:\/\/|\/)/i.test(value), "Ingresa una URL valida");

const awardSchema = z.object({
  title: z.string().min(1, "El titulo es requerido").max(180, "Maximo 180 caracteres"),
  description: z.string().optional(),
  imageFile: z
    .custom<File>((file) => file instanceof File, "Selecciona una imagen")
    .refine((file) => ACCEPTED_TYPES.includes(file.type), "Usa JPG, PNG o WEBP")
    .refine((file) => file.size <= MAX_FILE_SIZE, "La imagen no debe superar 5MB"),
  sourceName: z.string().max(180, "Maximo 180 caracteres").optional(),
  sourceUrl: optionalUrl,
  awardedAt: z.string().optional(),
  isPublished: z.boolean(),
  isFeatured: z.boolean(),
});

type AwardFormValues = z.infer<typeof awardSchema>;

function previewAwardDate(value?: string) {
  const v = value?.trim();
  if (!v) {
    return "Fecha por definir";
  }
  const utcIso = guatemalaLocalInputToUtcIso(v);
  return utcIso ? formatDateGuatemala(utcIso) : "Fecha por definir";
}

export function AwardForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
  } = useForm<AwardFormValues>({
    resolver: zodResolver(awardSchema),
    defaultValues: {
      title: "",
      description: "",
      sourceName: "",
      sourceUrl: "",
      awardedAt: "",
      isPublished: false,
      isFeatured: false,
    },
  });

  const values = useWatch({ control });
  const previewTitle = values.title?.trim() || "Titulo del logro";
  const previewDescription = sanitizeHtml(values.description) || "<p>Descripcion breve del reconocimiento.</p>";

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
    router.push(`/dashboard/projects/${projectId}/awards`);
  }

  async function onSubmit(data: AwardFormValues) {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description ?? "");
    formData.append("imageFile", data.imageFile);
    if (data.sourceName?.trim()) formData.append("sourceName", data.sourceName);
    if (data.sourceUrl?.trim()) formData.append("sourceUrl", data.sourceUrl);
    if (data.awardedAt?.trim()) formData.append("awardedAt", data.awardedAt);
    if (data.isPublished) formData.append("isPublished", "on");
    if (data.isFeatured) formData.append("isFeatured", "on");

    const result = await createAwardFromForm(projectId, formData);
    setIsSubmitting(false);

    if (result.status === "error") {
      toast.error(result.errors[0]?.title ?? "No se pudo crear el logro", {
        description: result.errors[0]?.message,
      });
      return;
    }

    toast.success("Logro creado", {
      description: "El reconocimiento se guardo correctamente.",
    });
    reset(data);
    router.push(`/dashboard/projects/${projectId}/awards`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="space-y-4">
        <Button asChild className="rounded-lg" variant="outline">
          <Link href={`/dashboard/projects/${projectId}/awards`}>
            <ArrowLeft className="h-4 w-4" />
            Volver a logros
          </Link>
        </Button>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Link className="font-medium text-primary hover:underline" href={`/dashboard/projects/${projectId}/awards`}>
              Logros / Premios
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">Nuevo logro</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-7">Nuevo logro / premio</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Registra reconocimientos, premios o menciones con fuente, imagen y estado de publicacion.
            </p>
          </div>
        </div>
      </header>

      <form className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.9fr)]" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informacion principal</CardTitle>
              <CardDescription>Define el contenido del reconocimiento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="title">
                  Titulo <span className="text-destructive">*</span>
                </label>
                <Input id="title" placeholder="Ej. Mejor experiencia 2025" {...register("title")} />
                <FieldError message={errors.title?.message} />
              </div>

              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descripcion</label>
                    <RichTextEditor error={errors.description?.message} onChange={field.onChange} placeholder="Describe el reconocimiento..." value={field.value} />
                    <p className="text-xs text-muted-foreground">El contenido se guarda como HTML para mantener el formato en la landing page.</p>
                  </div>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Imagen del reconocimiento</CardTitle>
              <CardDescription>Sube una imagen o arte del premio. Recomendado: 1200x900px o superior.</CardDescription>
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
              <CardTitle>Fuente y fecha</CardTitle>
              <CardDescription>Agrega informacion de quien otorgo o publico el reconocimiento.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="sourceName">Fuente</label>
                <Input id="sourceName" placeholder="Ej. Revista Gastronomica" {...register("sourceName")} />
                <FieldError message={errors.sourceName?.message} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="sourceUrl">URL fuente</label>
                <Input id="sourceUrl" placeholder="https://..." {...register("sourceUrl")} />
                <FieldError message={errors.sourceUrl?.message} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Controller
                  control={control}
                  name="awardedAt"
                  render={({ field }) => (
                    <>
                      <EventDateTimePicker
                        hint="Opcional. Solo fecha civil del reconocimiento."
                        id="awardedAt"
                        label="Fecha del reconocimiento"
                        onChange={field.onChange}
                        value={field.value}
                        variant="date"
                      />
                      <FieldError message={errors.awardedAt?.message} />
                    </>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publicacion</CardTitle>
              <CardDescription>Controla si el logro se muestra y si debe destacarse.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                Los nuevos elementos se agregan automaticamente al final de la lista.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
              <Controller
                control={control}
                name="isPublished"
                render={({ field }) => (
                  <div className="flex items-start justify-between gap-4 rounded-xl border p-4">
                    <div>
                      <p className="text-sm font-medium">Publicado</p>
                      <p className="mt-1 text-xs text-muted-foreground">Visible en la landing page.</p>
                    </div>
                    <Switch checked={field.value} onClick={() => field.onChange(!field.value)} />
                  </div>
                )}
              />
              <Controller
                control={control}
                name="isFeatured"
                render={({ field }) => (
                  <div className="flex items-start justify-between gap-4 rounded-xl border p-4">
                    <div>
                      <p className="text-sm font-medium">Destacado</p>
                      <p className="mt-1 text-xs text-muted-foreground">Resalta este reconocimiento.</p>
                    </div>
                    <Switch checked={field.value} onClick={() => field.onChange(!field.value)} />
                  </div>
                )}
              />
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2 border-t pt-5">
              <FormSaveActions isSubmitting={isSubmitting} onCancel={onCancel} submitLabel="Crear logro" />
            </CardFooter>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Vista previa</CardTitle>
              <CardDescription>Asi se vera el logro dentro de la landing page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-xl border bg-card">
                <div className="relative aspect-[4/3] bg-muted">
                  {values.imageFile && previewImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="Reconocimiento seleccionado" className="h-full w-full object-cover" src={previewImageUrl} />
                  ) : (
                    <div className="grid h-full place-items-center bg-[linear-gradient(135deg,#0f172a,#2563eb)] text-white/75">
                      <div className="text-center">
                        <ImagePlus className="mx-auto h-10 w-10" />
                        <p className="mt-2 text-sm">Imagen del logro</p>
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
                    <Badge variant="secondary"><AwardIcon className="h-3 w-3" />Reconocimiento</Badge>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{previewTitle}</h2>
                    <div className="mt-2 text-sm leading-6 text-muted-foreground [&_a]:text-primary [&_a]:underline [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5" dangerouslySetInnerHTML={{ __html: previewDescription }} />
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <p>{previewAwardDate(values.awardedAt)}</p>
                    <p className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-primary" />
                      {values.sourceName?.trim() || "Fuente por definir"}
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertTitle>Consejo</AlertTitle>
                <AlertDescription>Usa una fuente clara y una descripcion corta para que el reconocimiento sea facil de validar.</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </aside>
      </form>
    </div>
  );
}
