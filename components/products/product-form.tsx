"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, DragEvent, type ReactNode, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Resolver } from "react-hook-form";
import { Controller, useForm, useWatch } from "react-hook-form";
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
  Heading1,
  Heading2,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Pencil,
  Star,
  Trash2,
  UnderlineIcon,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { createProductFromForm } from "@/app/actions/content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

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

const productSchema = z
  .object({
    name: z.string().min(1, "El nombre es requerido").max(160, "Maximo 160 caracteres"),
    description: z.string().optional(),
    imageFile: z
      .custom<File>((file) => file instanceof File, "Selecciona una imagen")
      .refine((file) => ACCEPTED_TYPES.includes(file.type), "Usa JPG, PNG o WEBP")
      .refine((file) => file.size <= MAX_FILE_SIZE, "La imagen no debe superar 5MB"),
    type: z.enum(["DRINK", "FOOD"]),
    hasPrice: z.boolean(),
    price: optionalPriceGtq,
    isPublished: z.boolean(),
    isFeatured: z.boolean(),
  })
  .superRefine((data, ctx) => {
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

type ProductFormValues = {
  name: string;
  description?: string;
  imageFile: File;
  type: "DRINK" | "FOOD";
  hasPrice: boolean;
  price?: number;
  isPublished: boolean;
  isFeatured: boolean;
};

function fileSize(size: number) {
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}

function formatPrice(value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "Sin precio";
  }

  return `Q${value.toFixed(2)}`;
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

function ToolbarButton({
  active,
  children,
  disabled,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
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

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
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
          Describe el producto...
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
        autolink: true,
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: "Describe el producto...",
      }),
    ],
    content: value ?? "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-40 rounded-b-xl bg-background px-3 py-3 text-sm leading-6 outline-none [&_a]:text-primary [&_a]:underline [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5",
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

function ProductImageUpload({
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
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
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
                <img alt="Vista previa del producto" className="h-full w-full object-cover" src={previewUrl} />
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

export function ProductForm({ projectId }: { projectId: string }) {
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
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormValues>,
    defaultValues: {
      name: "",
      description: "",
      type: "DRINK",
      hasPrice: false,
      price: undefined,
      isPublished: false,
      isFeatured: false,
    },
  });

  const values = useWatch({ control });
  const previewName = values.name?.trim() || "Nombre del producto";
  const previewDescription = sanitizeHtml(values.description) || "<p>Descripcion breve del producto.</p>";
  const productStatus = values.isPublished ? "Publicado" : "Borrador";
  const productType = values.type === "FOOD" ? "Comida" : "Bebida";

  useEffect(() => {
    if (values.hasPrice === false) {
      setValue("price", undefined, { shouldValidate: true });
    }
  }, [values.hasPrice, setValue]);

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
    router.push(`/dashboard/projects/${projectId}/products`);
  }

  async function onSubmit(data: ProductFormValues) {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description ?? "");
    formData.append("imageFile", data.imageFile);
    formData.append("type", data.type);
    if (data.hasPrice && typeof data.price === "number") formData.append("price", String(data.price));
    if (data.isPublished) formData.append("isPublished", "on");
    if (data.isFeatured) formData.append("isFeatured", "on");

    const result = await createProductFromForm(projectId, formData);
    setIsSubmitting(false);

    if (result.status === "error") {
      toast.error(result.errors[0]?.title ?? "No se pudo crear el producto", {
        description: result.errors[0]?.message,
      });
      return;
    }

    toast.success("Producto creado", {
      description: "El producto se guardo correctamente.",
    });
    reset(data);
    router.push(`/dashboard/projects/${projectId}/products`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Link className="font-medium text-primary hover:underline" href={`/dashboard/projects/${projectId}/products`}>
              Menu / Productos
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">Nuevo producto</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-7">Nuevo producto</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Agrega comida o bebida al menu de la landing page con imagen, precio y estado de publicacion.
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/dashboard/projects/${projectId}/products`}>
            <ArrowLeft className="h-4 w-4" />
            Volver a productos
          </Link>
        </Button>
      </header>

      <form className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.9fr)]" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informacion principal</CardTitle>
              <CardDescription>Define el nombre, tipo y descripcion que vera el visitante.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="name">
                  Nombre <span className="text-destructive">*</span>
                </label>
                <Input id="name" placeholder="Ej. Latte de Vainilla" {...register("name")} />
                <FieldError message={errors.name?.message} />
              </div>

              <div className="max-w-xs space-y-2">
                <label className="text-sm font-medium" htmlFor="type">
                  Tipo
                </label>
                <Select id="type" {...register("type")}>
                  <option value="DRINK">Bebida</option>
                  <option value="FOOD">Comida</option>
                </Select>
              </div>

              <div className="space-y-3 rounded-xl border p-4">
                <Controller
                  control={control}
                  name="hasPrice"
                  render={({ field }) => (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">Definir precio</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Activa esta opcion solo si quieres guardar un precio para el producto.
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
                      placeholder="Ej. 28.50"
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

              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Descripcion</label>
                    <RichTextEditor error={errors.description?.message} onChange={field.onChange} value={field.value} />
                    <p className="text-xs text-muted-foreground">El contenido se guarda como HTML para mantener el formato en la landing page.</p>
                  </div>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Imagen del producto</CardTitle>
              <CardDescription>Sube una imagen limpia del producto. Recomendado: 1200x900px o superior.</CardDescription>
            </CardHeader>
            <CardContent>
              <Controller
                control={control}
                name="imageFile"
                render={({ field }) => (
                  <ProductImageUpload
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
              <CardTitle>Publicacion</CardTitle>
              <CardDescription>Controla la visibilidad del producto.</CardDescription>
            </CardHeader>
            <CardContent className="flex w-full flex-col gap-4">
              <p className="rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                Los nuevos elementos se agregan automaticamente al final de la lista.
              </p>

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
                      <p className="mt-1 text-xs text-muted-foreground">Resalta el producto en la vista publica.</p>
                    </div>
                    <Switch checked={field.value} onClick={() => field.onChange(!field.value)} type="button" />
                  </div>
                )}
              />
            </CardContent>
            <CardFooter className="justify-end gap-2 border-t pt-5">
              <Button disabled={isSubmitting} onClick={onCancel} type="button" variant="outline">
                Cancelar
              </Button>
              <Button disabled={isSubmitting} type="submit">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear producto
              </Button>
            </CardFooter>
          </Card>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Vista previa</CardTitle>
              <CardDescription>Asi se vera el producto dentro del menu.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-xl border bg-card">
                <div className="relative aspect-[4/3] bg-muted">
                  {values.imageFile && previewImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="Producto seleccionado" className="h-full w-full object-cover" src={previewImageUrl} />
                  ) : (
                    <div className="grid h-full place-items-center bg-[linear-gradient(135deg,#0f172a,#2563eb)] text-white/75">
                      <div className="text-center">
                        <ImagePlus className="mx-auto h-10 w-10" />
                        <p className="mt-2 text-sm">Imagen del producto</p>
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
                    <Badge variant="secondary">{productType}</Badge>
                    <Badge variant={values.isPublished ? "success" : "warning"}>{productStatus}</Badge>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{previewName}</h2>
                    <div
                      className="mt-2 text-sm leading-6 text-muted-foreground [&_a]:text-primary [&_a]:underline [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:text-lg [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
                      dangerouslySetInnerHTML={{ __html: previewDescription }}
                    />
                  </div>
                  <p
                    className={cn(
                      "font-semibold",
                      values.hasPrice && typeof values.price === "number" && Number.isFinite(values.price)
                        ? "text-lg text-primary"
                        : "text-base font-medium text-muted-foreground",
                    )}
                  >
                    {values.hasPrice ? formatPrice(values.price) : "Sin precio"}
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>
        </aside>
      </form>
    </div>
  );
}
