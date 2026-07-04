"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { createMediaFromForm } from "@/app/actions/content";
import { ContentImageUpload } from "@/components/content/content-form-controls";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/radix-select";
import { Switch } from "@/components/ui/switch";
import {
  describeServerActionClientError,
  MAX_SERVER_ACTION_IMAGE_BYTES,
  MAX_SERVER_ACTION_IMAGE_LABEL,
  validateImageFile,
} from "@/lib/upload-limits";

export function MediaCreateDialog({ projectId }: { projectId: string }) {
  const router = useRouter();
  const videoUrlRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [isPublic, setIsPublic] = useState(true);
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [imageError, setImageError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  function reset() {
    setType("IMAGE");
    setIsPublic(true);
    setImageFile(undefined);
    setImageError(undefined);
    if (videoUrlRef.current) {
      videoUrlRef.current.value = "";
    }
  }

  function handleTypeChange(value: "IMAGE" | "VIDEO") {
    setType(value);
    setImageFile(undefined);
    setImageError(undefined);
    if (videoUrlRef.current) {
      videoUrlRef.current.value = "";
    }
  }

  function handleImageValidation(message: string | undefined) {
    setImageError(message);
    if (message) {
      toast.error("Imagen no valida", { description: message });
    }
  }

  function handleImageChange(file: File | undefined) {
    setImageFile(file);
    if (!file) {
      setImageError(undefined);
    }
  }

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (type === "IMAGE") {
      if (!imageFile) {
        const message = "Selecciona una imagen para subirla a la biblioteca.";
        setImageError(message);
        toast.error("Imagen requerida", { description: message });
        return;
      }

      const validationMessage = validateImageFile(imageFile, {
        maxBytes: MAX_SERVER_ACTION_IMAGE_BYTES,
        maxBytesLabel: MAX_SERVER_ACTION_IMAGE_LABEL,
      });
      if (validationMessage) {
        setImageError(validationMessage);
        toast.error("Imagen no valida", { description: validationMessage });
        return;
      }
    }

    const formData = new FormData();
    formData.set("type", type);
    if (isPublic) {
      formData.set("isPublic", "on");
    }

    if (type === "IMAGE" && imageFile) {
      formData.set("imageFile", imageFile);
    } else {
      const videoUrl = videoUrlRef.current?.value.trim();
      if (!videoUrl) {
        toast.error("URL requerida", { description: "Ingresa la URL del video." });
        return;
      }
      formData.set("value", videoUrl);
    }

    startTransition(async () => {
      try {
        const result = await createMediaFromForm(projectId, formData);

        if (result.status === "error") {
          toast.error(result.errors[0]?.title ?? "No se pudo crear el medio", {
            description: result.errors[0]?.message,
          });
          return;
        }

        toast.success("Medio creado", {
          description:
            type === "IMAGE"
              ? "La imagen ya esta disponible en la biblioteca."
              : "El video ya esta disponible en la biblioteca.",
        });
        setOpen(false);
        reset();
        router.refresh();
      } catch (error) {
        console.error("[media-client] unexpected create error", error);
        toast.error("No se pudo crear el medio", {
          description: describeServerActionClientError(error),
        });
      }
    });
  }

  return (
    <Dialog
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset();
        }
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button className="h-10 shrink-0 rounded-lg shadow-sm">
          <Upload className="h-4 w-4" />
          Nuevo medio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo medio</DialogTitle>
          <DialogDescription>
            Sube una imagen a la biblioteca o registra una URL de video para usarla en el contenido del proyecto.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={submitForm}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de medio</Label>
              <Select onValueChange={(value) => handleTypeChange(value as "IMAGE" | "VIDEO")} value={type}>
                <SelectTrigger className="h-10 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IMAGE">Imagen</SelectItem>
                  <SelectItem value="VIDEO">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
              <div>
                <p className="text-sm font-medium">Publicado</p>
                <p className="text-xs text-muted-foreground">Visible para la landing page.</p>
              </div>
              <Switch checked={isPublic} onClick={() => setIsPublic((current) => !current)} />
            </div>
          </div>

          {type === "IMAGE" ? (
            <div className="space-y-3">
              <div>
                <Label>Imagen</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  En produccion el limite es {MAX_SERVER_ACTION_IMAGE_LABEL} para evitar errores al subir.
                </p>
              </div>
              <ContentImageUpload
                emptyLabel="Selecciona una imagen desde tu equipo"
                error={imageError}
                file={imageFile}
                formatDescription={`JPG, PNG o WEBP · Maximo ${MAX_SERVER_ACTION_IMAGE_LABEL}`}
                maxBytes={MAX_SERVER_ACTION_IMAGE_BYTES}
                maxBytesLabel={MAX_SERVER_ACTION_IMAGE_LABEL}
                onChange={handleImageChange}
                onPreviewUrlChange={() => {}}
                onValidationError={handleImageValidation}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="value">URL del video</Label>
              <Input id="value" name="value" placeholder="https://..." ref={videoUrlRef} required type="url" />
              <p className="text-xs text-muted-foreground">Puede ser una URL publica de video o embed.</p>
            </div>
          )}

          <DialogFooter>
            <Button disabled={isPending} onClick={() => setOpen(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button disabled={isPending || (type === "IMAGE" && Boolean(imageError))} type="submit">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isPending ? "Creando…" : "Crear medio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
