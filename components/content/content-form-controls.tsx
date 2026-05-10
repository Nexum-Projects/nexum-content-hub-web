"use client";

import { ChangeEvent, DragEvent, type ReactNode, useEffect, useRef, useState, useSyncExternalStore } from "react";
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
  Bold,
  Heading1,
  Heading2,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Pencil,
  Trash2,
  UnderlineIcon,
  UploadCloud,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-destructive">{message}</p>;
}

export function sanitizeHtml(html?: string) {
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

function fileSize(size: number) {
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
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

export function RichTextEditor({
  error,
  onChange,
  placeholder = "Describe el contenido...",
  value,
}: {
  error?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value?: string;
}) {
  const mounted = useHydrated();

  if (!mounted) {
    return <RichTextEditorFallback error={error} placeholder={placeholder} />;
  }

  return <RichTextEditorInner error={error} onChange={onChange} placeholder={placeholder} value={value} />;
}

function RichTextEditorFallback({ error, placeholder }: { error?: string; placeholder: string }) {
  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex flex-wrap gap-1 border-b bg-muted/40 p-2">
          {Array.from({ length: 11 }).map((_, index) => (
            <div className="h-8 w-8 rounded-lg bg-muted" key={index} />
          ))}
        </div>
        <div className="min-h-40 rounded-b-xl bg-background px-3 py-3 text-sm text-muted-foreground">{placeholder}</div>
      </div>
      <FieldError message={error} />
    </div>
  );
}

function RichTextEditorInner({
  error,
  onChange,
  placeholder,
  value,
}: {
  error?: string;
  onChange: (value: string) => void;
  placeholder: string;
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
        placeholder,
      }),
    ],
    content: value ?? "",
    editorProps: {
      attributes: {
        class:
          "min-h-40 rounded-b-xl bg-background px-3 py-3 text-sm leading-6 outline-none [&_a]:text-primary [&_a]:underline [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5",
      },
    },
    immediatelyRender: false,
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

export function ContentImageUpload({
  emptyLabel = "Sin imagen seleccionada",
  error,
  file,
  onChange,
  onPreviewUrlChange,
  /** Imagen remota ya guardada (p. ej. avatar actual) cuando aún no hay archivo nuevo seleccionado. */
  remotePreviewUrl,
}: {
  emptyLabel?: string;
  error?: string;
  file?: File;
  onChange: (file: File | undefined) => void;
  onPreviewUrlChange: (url: string | null) => void;
  remotePreviewUrl?: string | null;
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
    onPreviewUrlChange(remotePreviewUrl ?? null);
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

  const displayPreview = previewUrl ?? remotePreviewUrl ?? null;
  const hasLocalSelection = Boolean(previewUrl);

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
          {displayPreview ? (
            <>
              <div className="relative h-36 bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="Vista previa del archivo" className="h-full w-full object-cover" src={displayPreview} />
                {hasLocalSelection ? (
                  <Button className="absolute right-2 top-2" onClick={removeFile} size="icon" type="button" variant="secondary">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {file?.name ?? (remotePreviewUrl ? "Imagen actual" : "")}
                  </p>
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
                <p className="mt-2 text-sm">{emptyLabel}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <FieldError message={error} />
    </div>
  );
}
