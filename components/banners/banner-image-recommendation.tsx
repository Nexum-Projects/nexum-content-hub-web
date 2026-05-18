"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ImageIcon, Info, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MIN_WIDTH = 1920;
const MIN_HEIGHT = 800;
const IDEAL_RATIO = 2.4;
const RATIO_TOLERANCE = 0.25;

type ImageDimensions = {
  width: number;
  height: number;
};

type ImageState = {
  dimensions: ImageDimensions | null;
  failed: boolean;
  src: string | null;
};

function formatRatio(width: number, height: number) {
  if (!height) {
    return "0:1";
  }

  return `${(width / height).toFixed(2)}:1`;
}

export function BannerImageRecommendation({
  className,
  imageUrl,
}: {
  className?: string;
  imageUrl?: string | null;
}) {
  const [imageState, setImageState] = useState<ImageState>({
    dimensions: null,
    failed: false,
    src: null,
  });

  useEffect(() => {
    if (!imageUrl) {
      return;
    }

    let ignore = false;

    const image = new Image();
    image.onload = () => {
      if (!ignore) {
        setImageState({
          dimensions: { width: image.naturalWidth, height: image.naturalHeight },
          failed: false,
          src: imageUrl,
        });
      }
    };
    image.onerror = () => {
      if (!ignore) {
        setImageState({ dimensions: null, failed: true, src: imageUrl });
      }
    };
    image.src = imageUrl;

    return () => {
      ignore = true;
    };
  }, [imageUrl]);

  const dimensions = imageState.src === imageUrl ? imageState.dimensions : null;
  const failed = imageState.src === imageUrl ? imageState.failed : false;
  const ratio = dimensions ? dimensions.width / dimensions.height : 0;
  const hasRecommendedSize = dimensions ? dimensions.width >= MIN_WIDTH && dimensions.height >= MIN_HEIGHT : false;
  const hasRecommendedRatio = dimensions ? Math.abs(ratio - IDEAL_RATIO) <= RATIO_TOLERANCE : false;
  const isRecommended = hasRecommendedSize && hasRecommendedRatio;

  if (!imageUrl) {
    return (
      <Alert className={cn("border-primary/20 bg-primary/5", className)}>
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle>Formato recomendado para banners</AlertTitle>
        <AlertDescription>
          Usa una imagen de 1920 x 800 px o mayor, con proporción aproximada 2.4:1. Este formato funciona mejor para heroes anchos.
        </AlertDescription>
      </Alert>
    );
  }

  if (failed) {
    return (
      <Alert className={cn("border-warning/30 bg-warning/10", className)}>
        <TriangleAlert className="h-4 w-4 text-warning" />
        <AlertTitle>No se pudo leer el tamaño</AlertTitle>
        <AlertDescription>
          Revisa que la imagen cumpla 1920 x 800 px o mayor y una proporción aproximada 2.4:1.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className={cn(isRecommended ? "border-success/30 bg-success/10" : "border-warning/30 bg-warning/10", className)}>
      {isRecommended ? <CheckCircle2 className="h-4 w-4 text-success" /> : <TriangleAlert className="h-4 w-4 text-warning" />}
      <AlertTitle className="flex flex-wrap items-center gap-2">
        Imagen para hero ancho
        {dimensions ? (
          <Badge variant={isRecommended ? "success" : "warning"}>
            {isRecommended ? "Recomendada" : "Revisar tamaño"}
          </Badge>
        ) : (
          <Badge variant="secondary">Leyendo imagen</Badge>
        )}
      </AlertTitle>
      <AlertDescription>
        <div className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
          <div className="rounded-lg border bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">Actual</p>
            <p className="mt-1 font-medium">
              {dimensions ? `${dimensions.width} x ${dimensions.height} px` : "Calculando..."}
            </p>
          </div>
          <div className="rounded-lg border bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">Proporción</p>
            <p className="mt-1 font-medium">{dimensions ? formatRatio(dimensions.width, dimensions.height) : "Calculando..."}</p>
          </div>
          <div className="rounded-lg border bg-background/60 p-3">
            <p className="text-xs text-muted-foreground">Recomendado</p>
            <p className="mt-1 flex items-center gap-1.5 font-medium">
              <ImageIcon className="h-3.5 w-3.5" />
              1920 x 800 px, 2.4:1
            </p>
          </div>
        </div>
        {!isRecommended && dimensions ? (
          <p className="mt-3">
            Para mejores resultados, usa una imagen más panorámica y con al menos 1920 px de ancho por 800 px de alto.
          </p>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
