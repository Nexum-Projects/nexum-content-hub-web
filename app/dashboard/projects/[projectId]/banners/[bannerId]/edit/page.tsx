import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BannerEditPage({ params }: { params: Promise<{ projectId: string; bannerId: string }> }) {
  const { projectId, bannerId } = await params;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Button asChild className="rounded-lg" size="sm" variant="outline">
        <Link href={`/dashboard/projects/${projectId}/banners/${bannerId}`}>Volver al detalle</Link>
      </Button>
      <Card className="rounded-xl border border-border shadow-sm">
        <CardHeader>
          <CardTitle>Editar banner</CardTitle>
          <CardDescription>El formulario de edicion se conectara al endpoint PUT del API.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Esta vista esta en preparacion. Mientras tanto puedes ver el registro o volver al listado.</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="rounded-lg" variant="secondary">
              <Link href={`/dashboard/projects/${projectId}/banners/${bannerId}`}>Ver</Link>
            </Button>
            <Button asChild className="rounded-lg" variant="outline">
              <Link href={`/dashboard/projects/${projectId}/banners`}>Listado</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
