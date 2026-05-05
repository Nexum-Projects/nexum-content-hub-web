import { createEvent } from "@/app/actions/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckboxField, Field, Select, Textarea } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";

export default async function NewEventPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const action = createEvent.bind(null, projectId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section>
        <h1 className="text-2xl font-semibold leading-7">Crear evento</h1>
        <p className="mt-1 text-sm text-muted-foreground">Campos del modelo `Event`.</p>
      </section>
      <Card>
        <CardHeader><CardTitle>Informacion del evento</CardTitle><CardDescription>Fechas, cupo, precio, estado y publicacion.</CardDescription></CardHeader>
        <CardContent>
          <form action={action} className="grid gap-4 sm:grid-cols-2">
            <Field label="Titulo"><Input name="title" required /></Field>
            <Field label="Slug"><Input name="slug" /></Field>
            <Field label="Imagen URL"><Input name="imageUrl" placeholder="https://..." /></Field>
            <Field label="Ubicacion"><Input name="location" /></Field>
            <Field label="Fecha inicio"><Input name="startDate" required type="datetime-local" /></Field>
            <Field label="Fecha fin"><Input name="endDate" type="datetime-local" /></Field>
            <Field label="Capacidad"><Input min="0" name="capacity" type="number" /></Field>
            <Field label="Precio"><Input min="0" name="price" step="0.01" type="number" /></Field>
            <Field label="Estado"><Select defaultValue="DRAFT" name="status"><option value="DRAFT">DRAFT</option><option value="PUBLISHED">PUBLISHED</option><option value="CANCELLED">CANCELLED</option><option value="FINISHED">FINISHED</option></Select></Field>
            <Field label="Orden"><Input defaultValue="0" name="sortOrder" type="number" /></Field>
            <Field className="sm:col-span-2" label="Descripcion"><Textarea name="description" /></Field>
            <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
              <CheckboxField label="Publicado" name="isPublished" />
              <CheckboxField label="Destacado" name="isFeatured" />
            </div>
            <div className="flex justify-end sm:col-span-2"><Button type="submit">Crear evento</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
