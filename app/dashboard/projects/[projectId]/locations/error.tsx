"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function LocationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[locations-page] render error", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">No se pudo cargar ubicaciones</h1>
        <p className="text-sm text-muted-foreground">
          {error.message || "Ocurrio un error al renderizar esta seccion."}
        </p>
        {error.digest ? (
          <p className="text-xs tabular-nums text-muted-foreground">Referencia: {error.digest}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={() => reset()} type="button">
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </Button>
        <Button asChild type="button" variant="outline">
          <Link href="../">Volver al proyecto</Link>
        </Button>
      </div>
    </div>
  );
}
