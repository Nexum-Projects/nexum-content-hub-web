"use client";

import Link from "next/link";

import type { Project } from "@/app/actions/content";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { resolveAvatarUrl } from "@/lib/utils";

export function ProjectCard({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  const avatarSrc = resolveAvatarUrl(project);
  const initials = project.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <Card className="relative overflow-hidden p-0 shadow-sm transition-shadow hover:shadow-md">
      <Link
        aria-label={`Abrir proyecto ${project.name}`}
        className="block rounded-xl text-inherit no-underline outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        href={`/dashboard/projects/${project.id}`}
        prefetch
      >
        <div className="relative h-28 overflow-hidden">
          {avatarSrc ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- URL remota del CMS */}
              <img alt="" className="absolute inset-0 h-full w-full object-cover" src={avatarSrc} />
              <div className="absolute inset-0 bg-slate-950/35" />
            </>
          ) : (
            <div className="h-full bg-[linear-gradient(135deg,#0f172a,#2563eb)]" style={{ opacity: 0.95 - index * 0.08 }} />
          )}
        </div>
        <CardContent className="p-4 pb-5 text-center">
          <div className="relative z-1 mx-auto -mt-12 grid h-16 w-16 place-items-center overflow-hidden rounded-full border-4 border-card bg-card text-xl font-semibold shadow-sm">
            {avatarSrc ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element -- URL remota del CMS */}
                <img alt={`Avatar de ${project.name}`} className="h-full w-full object-cover" src={avatarSrc} />
              </>
            ) : (
              <span aria-hidden>{initials}</span>
            )}
          </div>
          <h3 className="mt-3 text-base font-semibold">{project.name}</h3>
          <p className="text-sm text-muted-foreground">{project.domain ?? project.slug}</p>
          <div className="mt-3 flex justify-center">
            {project.isActive === false ? <Badge variant="secondary">Inactivo</Badge> : <Badge variant="success">Activo</Badge>}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
