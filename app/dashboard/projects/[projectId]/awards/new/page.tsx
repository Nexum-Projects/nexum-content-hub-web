import { createAward } from "@/app/actions/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckboxField, Field, Textarea } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";

export default async function NewAwardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const action = createAward.bind(null, projectId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section>
        <h1 className="text-2xl font-semibold leading-7">Nuevo logro / premio</h1>
        <p className="mt-1 text-sm text-muted-foreground">Campos del modelo `Award`.</p>
      </section>
      <Card>
        <CardHeader><CardTitle>Informacion del reconocimiento</CardTitle><CardDescription>Fuente, enlace, fecha y publicacion.</CardDescription></CardHeader>
        <CardContent>
          <form action={action} className="grid gap-4 sm:grid-cols-2">
            <Field label="Titulo"><Input name="title" required /></Field>
            <Field label="Imagen URL"><Input name="imageUrl" placeholder="https://..." /></Field>
            <Field label="Fuente"><Input name="sourceName" /></Field>
            <Field label="URL fuente"><Input name="sourceUrl" placeholder="https://..." /></Field>
            <Field label="Fecha del reconocimiento"><Input name="awardedAt" type="datetime-local" /></Field>
            <Field label="Orden"><Input defaultValue="0" name="sortOrder" type="number" /></Field>
            <Field className="sm:col-span-2" label="Descripcion"><Textarea name="description" /></Field>
            <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
              <CheckboxField label="Publicado" name="isPublished" />
              <CheckboxField label="Destacado" name="isFeatured" />
            </div>
            <div className="flex justify-end sm:col-span-2"><Button type="submit">Crear logro</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
