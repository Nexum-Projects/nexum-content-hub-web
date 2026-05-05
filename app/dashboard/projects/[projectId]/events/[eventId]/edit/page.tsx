import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EventEditPage({ params }: { params: Promise<{ projectId: string; eventId: string }> }) {
  const { projectId, eventId } = await params;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Button asChild className="rounded-lg" size="sm" variant="outline">
        <Link href={`/dashboard/projects/${projectId}/events/${eventId}`}>Volver al detalle</Link>
      </Button>
      <Card className="rounded-xl border border-border shadow-sm">
        <CardHeader>
          <CardTitle>Editar evento</CardTitle>
          <CardDescription>Actualizacion vía PUT al recurso events del API.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Formulario de edicion en preparacion.</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="rounded-lg" variant="secondary">
              <Link href={`/dashboard/projects/${projectId}/events/${eventId}`}>Ver</Link>
            </Button>
            <Button asChild className="rounded-lg" variant="outline">
              <Link href={`/dashboard/projects/${projectId}/events`}>Listado</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
