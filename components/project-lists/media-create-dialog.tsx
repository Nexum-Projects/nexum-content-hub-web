"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { createMediaFromForm } from "@/app/actions/content";
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

export function MediaCreateDialog({ projectId }: { projectId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"IMAGE" | "VIDEO">("IMAGE");
  const [isPublic, setIsPublic] = useState(true);
  const [selectedImageName, setSelectedImageName] = useState<string | null>(null);
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (selectedImagePreviewUrl) {
        URL.revokeObjectURL(selectedImagePreviewUrl);
      }
    };
  }, [selectedImagePreviewUrl]);

  function reset() {
    setType("IMAGE");
    setIsPublic(true);
    setSelectedImageName(null);
    setSelectedImagePreviewUrl(null);
    formRef.current?.reset();
  }

  function handleTypeChange(value: "IMAGE" | "VIDEO") {
    setType(value);
    setSelectedImageName(null);
    setSelectedImagePreviewUrl(null);
    formRef.current?.reset();
  }

  function handleImageChange(file: File | undefined) {
    setSelectedImageName(file?.name ?? null);
    setSelectedImagePreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  function onSubmit(formData: FormData) {
    formData.set("type", type);
    if (isPublic) {
      formData.set("isPublic", "on");
    } else {
      formData.delete("isPublic");
    }

    startTransition(async () => {
      const result = await createMediaFromForm(projectId, formData);

      if (result.status === "error") {
        toast.error(result.errors[0]?.title ?? "No se pudo crear el medio", {
          description: result.errors[0]?.message,
        });
        return;
      }

      toast.success("Medio creado", {
        description: type === "IMAGE" ? "La imagen ya esta disponible en la biblioteca." : "El video ya esta disponible en la biblioteca.",
      });
      setOpen(false);
      reset();
      router.refresh();
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

        <form action={onSubmit} className="space-y-5" ref={formRef}>
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
              <Label htmlFor="imageFile">Imagen</Label>
              <label
                className="grid min-h-44 cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed bg-muted/20 text-center transition-colors hover:border-primary/60 hover:bg-muted/40"
                htmlFor="imageFile"
              >
                {selectedImagePreviewUrl ? (
                  <span className="grid w-full gap-3 p-3">
                    <span className="relative block aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                      <Image
                        alt={selectedImageName ?? "Vista previa de la imagen seleccionada"}
                        className="object-cover"
                        fill
                        sizes="(min-width: 640px) 512px, 100vw"
                        src={selectedImagePreviewUrl}
                        unoptimized
                      />
                    </span>
                    <span className="block text-sm font-medium">{selectedImageName}</span>
                    <span className="block text-xs text-muted-foreground">Haz clic para cambiar la imagen.</span>
                  </span>
                ) : (
                  <span className="space-y-2 p-6">
                    <ImagePlus className="mx-auto h-8 w-8 text-primary" />
                    <span className="block text-sm font-medium">Selecciona una imagen desde tu equipo</span>
                    <span className="block text-xs text-muted-foreground">JPG, PNG o WEBP. Maximo 5MB.</span>
                  </span>
                )}
              </label>
              <Input
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                id="imageFile"
                name="imageFile"
                onChange={(event) => handleImageChange(event.target.files?.[0])}
                required={type === "IMAGE"}
                type="file"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="value">URL del video</Label>
              <Input id="value" name="value" placeholder="https://..." required type="url" />
              <p className="text-xs text-muted-foreground">Puede ser una URL publica de video o embed.</p>
            </div>
          )}

          <DialogFooter>
            <Button disabled={isPending} onClick={() => setOpen(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {isPending ? "Creando…" : "Crear medio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
