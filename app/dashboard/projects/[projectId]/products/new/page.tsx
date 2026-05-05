import { createProduct } from "@/app/actions/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckboxField, Field, Select, Textarea } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";

export default async function NewProductPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const action = createProduct.bind(null, projectId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section>
        <h1 className="text-2xl font-semibold leading-7">Nuevo producto</h1>
        <p className="mt-1 text-sm text-muted-foreground">Campos del modelo `MenuProduct`.</p>
      </section>
      <Card>
        <CardHeader><CardTitle>Informacion del producto</CardTitle><CardDescription>Comida, bebida, precio y publicacion.</CardDescription></CardHeader>
        <CardContent>
          <form action={action} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre"><Input name="name" required /></Field>
            <Field label="Slug"><Input name="slug" /></Field>
            <Field label="Tipo"><Select defaultValue="DRINK" name="type"><option value="DRINK">DRINK</option><option value="FOOD">FOOD</option></Select></Field>
            <Field label="Precio"><Input min="0" name="price" step="0.01" type="number" /></Field>
            <Field label="Imagen URL"><Input name="imageUrl" placeholder="https://..." /></Field>
            <Field label="Orden"><Input defaultValue="0" name="sortOrder" type="number" /></Field>
            <Field className="sm:col-span-2" label="Descripcion"><Textarea name="description" /></Field>
            <div className="grid gap-2 sm:col-span-2 sm:grid-cols-3">
              <CheckboxField defaultChecked label="Disponible" name="isAvailable" />
              <CheckboxField label="Publicado" name="isPublished" />
              <CheckboxField label="Destacado" name="isFeatured" />
            </div>
            <div className="flex justify-end sm:col-span-2"><Button type="submit">Crear producto</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
