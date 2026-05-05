import { getProjectContent } from "@/app/actions/content";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fallbackProjects } from "../../fallback-data";

export default async function ProjectSettingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const result = await getProjectContent(projectId);
  const project = result.status === "success" ? result.data.selectedProject : fallbackProjects[0];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <h1 className="text-2xl font-semibold leading-7">Configuracion</h1>
        <p className="mt-1 text-sm text-muted-foreground">Informacion del sitio, contacto y presencia digital.</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Datos del proyecto</CardTitle>
          <CardDescription>Campos base de {project?.name ?? "Proyecto"}.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Input defaultValue={project?.name ?? ""} placeholder="Nombre del proyecto" />
          <Input defaultValue={project?.slug ?? ""} placeholder="Slug" />
          <Input defaultValue={project?.domain ?? ""} placeholder="Dominio" />
          <Input defaultValue={project?.logoUrl ?? ""} placeholder="Logo URL" />
          <Input placeholder="Color principal opcional" />
          <Input placeholder="Direccion" />
          <Input placeholder="Telefono" />
          <Input placeholder="Email" />
          <Input placeholder="Instagram" />
          <Input placeholder="Facebook" />
          <Input placeholder="Google Maps URL" />
          <Input placeholder="Horarios" />
        </CardContent>
      </Card>
    </div>
  );
}
