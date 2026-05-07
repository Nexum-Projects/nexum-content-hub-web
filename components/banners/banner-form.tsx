"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, DragEvent, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Controller, type FieldErrors, type UseFormRegister, useFieldArray, useForm, useWatch } from "react-hook-form";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { zodResolver } from "@hookform/resolvers/zod";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  GripVertical,
  Heading1,
  Heading2,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UnderlineIcon,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { createBannerFromForm } from "@/app/actions/content";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const buttonSchema = z.object({
  label: z.string().min(1, "El texto del boton es requerido"),
  url: z.string().min(1, "La URL del boton es requerida"),
  variant: z.enum(["PRIMARY", "SECONDARY"]),
  target: z.enum(["_self", "_blank"]),
  sortOrder: z.number().min(0, "El orden debe ser 0 o mayor"),
});

const bannerSchema = z.object({
  title: z.string().min(1, "El titulo es requerido").max(100, "Maximo 100 caracteres"),
  description: z.string().optional(),
  imageFile: z
    .custom<File>((file) => file instanceof File, "Selecciona una imagen")
    .refine((file) => ACCEPTED_TYPES.includes(file.type), "Usa JPG, PNG o WEBP")
    .refine((file) => file.size <= MAX_FILE_SIZE, "La imagen no debe superar 5MB"),
  sortOrder: z.number().int("El orden debe ser un numero entero").min(0, "El orden debe ser 0 o mayor"),
  isPublished: z.boolean(),
  buttons: z.array(buttonSchema).optional(),
});

type BannerFormValues = z.infer<typeof bannerSchema>;
type BannerButtonFormValues = z.infer<typeof buttonSchema>;

function fileSize(size: number) {
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function sanitizeHtml(html?: string) {
  if (!html?.trim()) {
    return "";
  }

  if (typeof window === "undefined") {
    return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  }

  const allowedTags = new Set(["A", "B", "BLOCKQUOTE", "BR", "EM", "H1", "H2", "I", "LI", "OL", "P", "STRONG", "U", "UL"]);
  const allowedAttributes = new Set(["href", "target", "rel", "style"]);
  const doc = new DOMParser().parseFromString(html, "text/html");

  doc.body.querySelectorAll("*").forEach((node) => {
    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(...Array.from(node.childNodes));
      return;
    }

    Array.from(node.attributes).forEach((attr) => {
      const isSafeHref = attr.name !== "href" || /^(https?:|mailto:|tel:|\/|#)/i.test(attr.value);
      const isSafeStyle = attr.name !== "style" || /^text-align:\s*(left|center|right);?$/i.test(attr.value);

      if (!allowedAttributes.has(attr.name) || !isSafeHref || !isSafeStyle) {
        node.removeAttribute(attr.name);
      }
    });

    if (node.tagName === "A") {
      node.setAttribute("rel", "noopener noreferrer");
    }
  });

  return doc.body.innerHTML;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}

function ToolbarButton({
  active,
  children,
  disabled,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      className={cn("h-8 w-8", active && "bg-primary text-primary-foreground hover:bg-primary/90")}
      disabled={Boolean(disabled)}
      onClick={onClick}
      size="icon"
      type="button"
      variant={active ? "default" : "ghost"}
    >
      {children}
    </Button>
  );
}

function RichTextEditor({
  error,
  onChange,
  value,
}: {
  error?: string;
  onChange: (value: string) => void;
  value?: string;
}) {
  const mounted = useHydrated();

  if (!mounted) {
    return <RichTextEditorFallback error={error} />;
  }

  return <RichTextEditorInner error={error} onChange={onChange} value={value} />;
}

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function RichTextEditorFallback({ error }: { error?: string }) {
  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap gap-1 border-b bg-muted/40 p-2">
          {Array.from({ length: 11 }).map((_, index) => (
            <div className="h-8 w-8 rounded-lg bg-muted" key={index} />
          ))}
        </div>
        <div className="min-h-40 rounded-b-xl bg-background px-3 py-3 text-sm text-muted-foreground">
          Describe el mensaje del banner...
        </div>
      </div>
      <FieldError message={error} />
    </div>
  );
}

function RichTextEditorInner({
  error,
  onChange,
  value,
}: {
  error?: string;
  onChange: (value: string) => void;
  value?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
        link: false,
        underline: false,
      }),
      Underline,
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: "Describe el mensaje del banner...",
      }),
    ],
    content: value ?? "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-40 rounded-b-xl bg-background px-3 py-3 text-sm outline-none prose prose-sm max-w-none dark:prose-invert",
      },
    },
    onUpdate({ editor: tiptapEditor }) {
      onChange(tiptapEditor.getHTML());
    },
  });

  const toolbarDisabled = editor == null;

  function setLink() {
    if (!editor) {
      return;
    }

    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL del enlace", previousUrl ?? "");

    if (url === null) {
      return;
    }

    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap gap-1 border-b bg-muted/40 p-2">
          <ToolbarButton active={editor?.isActive("bold")} disabled={toolbarDisabled} onClick={() => editor?.chain().focus().toggleBold().run()}>
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton active={editor?.isActive("italic")} disabled={toolbarDisabled} onClick={() => editor?.chain().focus().toggleItalic().run()}>
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton active={editor?.isActive("underline")} disabled={toolbarDisabled} onClick={() => editor?.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton active={editor?.isActive("heading", { level: 1 })} disabled={toolbarDisabled} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}>
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton active={editor?.isActive("heading", { level: 2 })} disabled={toolbarDisabled} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton active={editor?.isActive("bulletList")} disabled={toolbarDisabled} onClick={() => editor?.chain().focus().toggleBulletList().run()}>
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton active={editor?.isActive("orderedList")} disabled={toolbarDisabled} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton active={editor?.isActive({ textAlign: "left" })} disabled={toolbarDisabled} onClick={() => editor?.chain().focus().setTextAlign("left").run()}>
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton active={editor?.isActive({ textAlign: "center" })} disabled={toolbarDisabled} onClick={() => editor?.chain().focus().setTextAlign("center").run()}>
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton active={editor?.isActive({ textAlign: "right" })} disabled={toolbarDisabled} onClick={() => editor?.chain().focus().setTextAlign("right").run()}>
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton active={editor?.isActive("link")} disabled={toolbarDisabled} onClick={setLink}>
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
        </div>
        <EditorContent editor={editor} />
      </div>
      <FieldError message={error} />
    </div>
  );
}

function FileUpload({
  error,
  file,
  onChange,
  onPreviewUrlChange,
}: {
  error?: string;
  file?: File;
  onChange: (file: File | undefined) => void;
  onPreviewUrlChange: (url: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  function selectFile(nextFile?: File) {
    if (!nextFile) {
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const nextPreview = URL.createObjectURL(nextFile);
    objectUrlRef.current = nextPreview;
    setPreviewUrl(nextPreview);
    onPreviewUrlChange(nextPreview);
    onChange(nextFile);
  }

  function removeFile() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setPreviewUrl(null);
    onPreviewUrlChange(null);
    onChange(undefined);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    selectFile(event.target.files?.[0]);
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div
          className={cn(
            "grid min-h-44 cursor-pointer place-items-center rounded-xl border border-dashed bg-background p-6 text-center transition-colors",
            isDragging && "border-primary bg-primary/10",
          )}
          onClick={() => inputRef.current?.click()}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDrop={onDrop}
        >
          <input accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onFileChange} ref={inputRef} type="file" />
          <div className="space-y-3">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <p className="font-medium">Arrastra una imagen o haz clic para seleccionar</p>
              <p className="text-sm text-muted-foreground">JPG, PNG o WEBP · Max. 5MB</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card">
          {previewUrl ? (
            <>
              <div className="relative h-36 bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="Vista previa del archivo" className="h-full w-full object-cover" src={previewUrl} />
                <Button className="absolute right-2 top-2" onClick={removeFile} size="icon" type="button" variant="secondary">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{file?.name}</p>
                  <p className="text-xs text-muted-foreground">{file ? fileSize(file.size) : ""}</p>
                </div>
                <Button onClick={() => inputRef.current?.click()} size="sm" type="button" variant="outline">
                  <Pencil className="h-4 w-4" />
                  Cambiar
                </Button>
              </div>
            </>
          ) : (
            <div className="grid h-full min-h-44 place-items-center p-4 text-center text-muted-foreground">
              <div>
                <ImagePlus className="mx-auto h-8 w-8" />
                <p className="mt-2 text-sm">Sin imagen seleccionada</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <FieldError message={error} />
    </div>
  );
}

function SortableButtonCard({
  button,
  errors,
  id,
  index,
  onRemove,
  register,
}: {
  button?: Partial<BannerButtonFormValues>;
  errors: FieldErrors<BannerFormValues>;
  id: string;
  index: number;
  onRemove: () => void;
  register: UseFormRegister<BannerFormValues>;
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden border bg-card",
        isDragging && "z-10 opacity-80 ring-2 ring-primary",
      )}
      ref={setNodeRef}
      style={style}
    >
      <Button
        aria-label="Eliminar boton"
        className="absolute right-2 top-2 z-10 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={onRemove}
        size="icon"
        type="button"
        variant="ghost"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <CardHeader className="flex-row items-start gap-3 space-y-0 p-4 pr-12">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <button
            aria-label="Arrastrar boton"
            className="mt-0.5 shrink-0 cursor-grab rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:cursor-grabbing"
            type="button"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="truncate text-sm">
                {button?.label?.trim() || "Boton sin titulo"}
              </CardTitle>
              <Badge variant={button?.variant === "SECONDARY" ? "secondary" : "default"}>
                {button?.variant ?? "PRIMARY"}
              </Badge>
            </div>
            <CardDescription className="mt-1 truncate">
              {button?.url?.trim() || "Sin URL configurada"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-4 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Texto</label>
            <Input placeholder="Ej. Ver menu" {...register(`buttons.${index}.label`)} />
            <FieldError message={errors.buttons?.[index]?.label?.message} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">URL</label>
            <Input placeholder="Ej. /menu" {...register(`buttons.${index}.url`)} />
            <FieldError message={errors.buttons?.[index]?.url?.message} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Variante</label>
            <Select {...register(`buttons.${index}.variant`)}>
              <option value="PRIMARY">PRIMARY</option>
              <option value="SECONDARY">SECONDARY</option>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Abrir en</label>
            <Select {...register(`buttons.${index}.target`)}>
              <option value="_self">Misma pestana</option>
              <option value="_blank">Nueva pestana</option>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BannerForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const {
    control,
    formState: { errors, isDirty },
    handleSubmit,
    register,
    reset,
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: "",
      description: "",
      sortOrder: 0,
      isPublished: false,
      buttons: [],
    },
  });

  const { append, fields, move, remove } = useFieldArray({
    control,
    name: "buttons",
  });
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const values = useWatch({ control });
  const previewTitle = values.title?.trim() || "Titulo del banner";
  const previewDescription = sanitizeHtml(values.description) || "<p>Descripcion del banner aqui</p>";
  const previewButtons = values.buttons ?? [];
  const imageFile = values.imageFile;
  const bannerStatus = values.isPublished ? "Publicado" : "Borrador";

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
    if (isDirty && !window.confirm("Tienes cambios sin guardar. ¿Quieres salir?")) {
      return;
    }

    router.push(`/dashboard/projects/${projectId}/banners`);
  }

  function onButtonDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = fields.findIndex((field) => field.id === active.id);
    const newIndex = fields.findIndex((field) => field.id === over.id);

    if (oldIndex >= 0 && newIndex >= 0) {
      move(oldIndex, newIndex);
    }
  }

  async function onSubmit(data: BannerFormValues) {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description ?? "");
    formData.append("imageFile", data.imageFile);
    formData.append("sortOrder", String(data.sortOrder));
    if (data.isPublished) formData.append("isPublished", "on");
    formData.append(
      "buttonsJson",
      JSON.stringify(
        (data.buttons ?? []).map((button, index) => ({
          label: button.label,
          url: button.url,
          variant: button.variant,
          target: button.target,
          isActive: true,
          sortOrder: index,
        })),
      ),
    );

    const result = await createBannerFromForm(projectId, formData);
    setIsSubmitting(false);

    if (result.status === "error") {
      toast.error(result.errors[0]?.title ?? "No se pudo crear el banner", {
        description: result.errors[0]?.message,
      });
      return;
    }

    toast.success("Banner creado", {
      description: "El banner se guardo correctamente.",
    });
    reset(data);
    router.push(`/dashboard/projects/${projectId}/banners`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Link className="font-medium text-primary hover:underline" href={`/dashboard/projects/${projectId}/banners`}>
              Banners
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">Nuevo banner</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-7">Nuevo banner</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Configura el contenido principal que se mostrara en el carrusel de la landing page.
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/dashboard/projects/${projectId}/banners`}>
            <ArrowLeft className="h-4 w-4" />
            Volver a banners
          </Link>
        </Button>
      </header>

      <form className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.9fr)]" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informacion principal</CardTitle>
              <CardDescription>Define el contenido que aparecera en el banner.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="title">
                  Titulo <span className="text-destructive">*</span>
                </label>
                <Input id="title" placeholder="Ej. Disfruta nuestros cafes de especialidad" {...register("title")} />
                <div className="flex justify-between gap-3 text-xs">
                  <FieldError message={errors.title?.message} />
                  <span className="ml-auto text-muted-foreground">{values.title?.length ?? 0} / 100</span>
                </div>
              </div>

              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descripcion</label>
                    <RichTextEditor error={errors.description?.message} onChange={field.onChange} value={field.value} />
                  </div>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Imagen del banner</CardTitle>
              <CardDescription>Sube una imagen de alta calidad. Recomendado: 1920x800px o superior.</CardDescription>
            </CardHeader>
            <CardContent>
              <Controller
                control={control}
                name="imageFile"
                render={({ field }) => (
                  <FileUpload
                    error={errors.imageFile?.message}
                    file={field.value}
                    onChange={(file) => field.onChange(file)}
                    onPreviewUrlChange={setPreviewImageUrl}
                  />
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publicacion y orden</CardTitle>
              <CardDescription>Controla la visibilidad y posicion del banner.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Controller
                control={control}
                name="sortOrder"
                render={({ field }) => (
                  <NumberInput
                    description="Menor numero = aparece primero."
                    errorMessage={errors.sortOrder?.message}
                    label="Orden"
                    minValue={0}
                    onChange={(nextValue) => field.onChange(Number.isFinite(nextValue) ? nextValue : 0)}
                    value={Number.isFinite(field.value) ? field.value : 0}
                  />
                )}
              />

              <Controller
                control={control}
                name="isPublished"
                render={({ field }) => (
                  <div className="flex items-start justify-between gap-4 rounded-xl border p-4">
                    <div>
                      <p className="text-sm font-medium">Publicado</p>
                      <p className="mt-1 text-xs text-muted-foreground">El banner sera visible en la landing page.</p>
                    </div>
                    <Switch checked={field.value} onClick={() => field.onChange(!field.value)} />
                  </div>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle>Botones del banner</CardTitle>
                <CardDescription>Agrega llamadas a la accion y ordenalas como quieras.</CardDescription>
              </div>
              <Button
                onClick={() => append({ label: "", url: "", variant: "PRIMARY", target: "_self", sortOrder: fields.length })}
                type="button"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                Agregar boton
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.length > 2 && (
                <Alert className="border-warning/30 bg-warning/10">
                  <AlertTitle>Muchos botones</AlertTitle>
                  <AlertDescription>Recomendamos usar maximo 2 botones para mantener el banner claro.</AlertDescription>
                </Alert>
              )}

              {fields.length === 0 && (
                <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No hay botones agregados. Puedes crear el banner sin botones.
                </div>
              )}

              {fields.length > 0 && (
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={onButtonDragEnd}
                  sensors={sensors}
                >
                  <SortableContext items={fields.map((field) => field.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <SortableButtonCard
                          button={values.buttons?.[index]}
                          errors={errors}
                          id={field.id}
                          index={index}
                          key={field.id}
                          onRemove={() => remove(index)}
                          register={register}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
            <CardFooter className="justify-between border-t pt-5">
              <p className="hidden text-sm text-muted-foreground md:block">Los botones se mostraran en el mismo orden visual.</p>
              <div className="ml-auto flex gap-2">
                <Button disabled={isSubmitting} onClick={onCancel} type="button" variant="outline">
                  Cancelar
                </Button>
                <Button disabled={isSubmitting} type="submit">
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Crear banner
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Vista previa</CardTitle>
              <CardDescription>Asi se vera tu banner en la landing page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative min-h-[420px] overflow-hidden rounded-xl border bg-slate-950 text-white">
                {imageFile && previewImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="Banner seleccionado" className="absolute inset-0 h-full w-full object-cover" src={previewImageUrl} />
                ) : (
                  <div className="absolute inset-0 grid place-items-center bg-[linear-gradient(135deg,#0f172a,#2563eb)]">
                    <div className="text-center text-white/75">
                      <ImagePlus className="mx-auto h-10 w-10" />
                      <p className="mt-2 text-sm">Imagen del banner</p>
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/45 to-transparent" />
                <div className="relative flex min-h-[420px] max-w-md flex-col justify-center p-8">
                  <Badge className="mb-4 w-fit bg-primary/80 text-white">Titulo del banner</Badge>
                  <h2 className="text-3xl font-semibold leading-tight">{previewTitle}</h2>
                  <div
                    className="mt-3 text-sm leading-6 text-white/85 [&_a]:underline [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: previewDescription }}
                  />
                  <div className="mt-6 flex flex-wrap gap-2">
                    {previewButtons.length ? (
                      previewButtons.map((button, index) => (
                        <Button key={`${button?.label ?? "button"}-${index}`} type="button" variant={button?.variant === "SECONDARY" ? "secondary" : "default"}>
                          {button?.label?.trim() || "Texto del boton"}
                        </Button>
                      ))
                    ) : (
                      <Button type="button">Texto del boton</Button>
                    )}
                  </div>
                </div>
              </div>

              <Alert>
                <AlertTitle>
                  Estado: <Badge variant={values.isPublished ? "success" : "warning"}>{bannerStatus}</Badge>
                </AlertTitle>
                <AlertDescription>
                  {values.isPublished
                    ? "Este banner sera visible en la landing page."
                    : "Este banner no estara publicado hasta que lo actives."}
                </AlertDescription>
              </Alert>

              <Alert className="border-primary/20 bg-primary/5">
                <AlertTitle className="text-primary">Consejo</AlertTitle>
                <AlertDescription>Usa imagenes de alta calidad y textos cortos para obtener mejores resultados.</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </aside>
      </form>
    </div>
  );
}
