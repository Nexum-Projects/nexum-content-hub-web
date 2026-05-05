import { Copy, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MediaPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold leading-7">Medios</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestiona imagenes y recursos del proyecto.</p>
        </div>
        <Button><Upload className="h-4 w-4" />Subir imagen</Button>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Biblioteca de imagenes</CardTitle>
          <CardDescription>Copia URLs, revisa detalles o elimina recursos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <div className="group relative aspect-square rounded-lg bg-[linear-gradient(135deg,#0f172a,#2563eb)]" key={index}>
                <Button className="absolute right-1 top-1 hidden group-hover:inline-flex" size="icon" variant="secondary">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
