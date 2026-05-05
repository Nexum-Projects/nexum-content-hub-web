import { ArrowRight, Calendar, Clock, ExternalLink, ImagePlus, Trophy, Utensils } from "lucide-react";

import { getProjectContent } from "@/app/actions/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fallbackAwards, fallbackBanners, fallbackEvents, fallbackProducts, fallbackProjects } from "../fallback-data";

function StatCard({ icon: Icon, label, value, tone }: { icon: typeof ImagePlus; label: string; value: number; tone: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold leading-7">{value}</p>
          <p className="text-xs text-muted-foreground">Publicados</p>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const result = await getProjectContent(projectId);
  const data = result.status === "success" ? result.data : null;
  const project = data?.selectedProject ?? fallbackProjects[0];
  const banners = data?.banners.length ? data.banners : fallbackBanners;
  const products = data?.products.length ? data.products : fallbackProducts;
  const events = data?.events.length ? data.events : fallbackEvents;
  const awards = data?.awards.length ? data.awards : fallbackAwards;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {result.status === "error" && (
        <Card className="border-warning/40 bg-warning/10">
          <CardContent className="p-4 text-sm text-warning">
            {result.errors[0]?.title}: {result.errors[0]?.message}. Se muestra una vista previa local.
          </CardContent>
        </Card>
      )}

      <section>
        <h1 className="text-2xl font-semibold leading-7">{project.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Dashboard del proyecto y accesos rapidos.</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ImagePlus} label="Banners" tone="bg-blue-500/10 text-blue-500" value={banners.filter((item) => item.isPublished).length} />
        <StatCard icon={Utensils} label="Productos" tone="bg-emerald-500/10 text-emerald-500" value={products.filter((item) => item.isPublished).length} />
        <StatCard icon={Calendar} label="Eventos" tone="bg-orange-500/10 text-orange-500" value={events.length} />
        <StatCard icon={Trophy} label="Logros" tone="bg-yellow-500/10 text-yellow-500" value={awards.filter((item) => item.isPublished).length} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
            <CardDescription>Ultimos cambios del proyecto.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              `Nuevo producto agregado: ${products[0]?.name ?? "Latte Vainilla"}`,
              `Nuevo evento creado: ${events[0]?.title ?? "Noche de Jazz"}`,
              `Banner actualizado: ${banners[0]?.title ?? "Banner principal"}`,
              `Logro publicado: ${awards[0]?.title ?? "Mejor experiencia"}`,
            ].map((item, index) => (
              <div className="flex items-center gap-3 rounded-lg border p-3 text-sm" key={item}>
                <Clock className="h-4 w-4 text-primary" />
                <span className="min-w-0 flex-1 truncate">{item}</span>
                <span className="text-xs text-muted-foreground">Hace {index + 2} h</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vista previa del sitio</CardTitle>
            <CardDescription>{project.domain ?? project.slug}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border bg-[linear-gradient(135deg,#0f172a,#2563eb)] p-5 text-white">
              <div className="mb-20 flex items-center justify-between">
                <span className="font-semibold">{project.name}</span>
                <ExternalLink className="h-4 w-4" />
              </div>
              <p className="text-2xl font-semibold">Contenido listo para publicar</p>
              <p className="mt-2 text-sm text-white/80">Banners, menu, eventos y logros conectados al proyecto.</p>
              <Button className="mt-5 bg-white text-slate-950 hover:bg-white/90">
                Ver sitio web
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
