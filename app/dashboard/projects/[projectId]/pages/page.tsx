import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PagesPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <h1 className="text-2xl font-semibold leading-7">Paginas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Estructura y secciones publicables del sitio.</p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Paginas del proyecto</CardTitle>
          <CardDescription>Esta seccion queda lista para conectar al modelo de paginas cuando el backend lo exponga.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">No hay paginas configuradas todavia.</CardContent>
      </Card>
    </div>
  );
}
