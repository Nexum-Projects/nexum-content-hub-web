"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext } from "react";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CMS_RESOURCE_LABELS, canRead, canWrite, routeAccess, type CmsResource, type ResourcePermissions } from "@/lib/cms-resources";

/** `null`: no se pudieron cargar los permisos; la UI no oculta nada y el API responde 403 donde toque. */
const PermissionsContext = createContext<ResourcePermissions | null>(null);

function NoAccessCard({ projectId, resource, needsWrite }: { projectId: string; resource: CmsResource; needsWrite: boolean }) {
  const label = CMS_RESOURCE_LABELS[resource];

  return (
    <Card className="mx-auto max-w-md rounded-xl border border-dashed">
      <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <Lock className="h-6 w-6" />
        </span>
        <div className="space-y-1">
          <p className="text-base font-semibold">{needsWrite ? `Solo lectura en ${label}` : `Sin acceso a ${label}`}</p>
          <p className="text-sm text-muted-foreground">
            {needsWrite
              ? "Tu permiso en esta sección no permite crear, editar ni ordenar."
              : "El plan del proyecto no incluye esta sección o no tienes permiso. Pide acceso al propietario del proyecto."}
          </p>
        </div>
        <Button asChild className="rounded-lg" variant="outline">
          <Link href={`/dashboard/projects/${projectId}`}>Volver al proyecto</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/** Bloquea las rutas de contenido sin permiso y expone los permisos a `useCanWrite`. */
export function ProjectPermissionsProvider({
  projectId,
  permissions,
  children,
}: {
  projectId: string;
  permissions: ResourcePermissions | null;
  children: React.ReactNode;
}) {
  const route = routeAccess(usePathname());
  const denied =
    permissions && route && !(route.needsWrite ? canWrite(permissions, route.resource) : canRead(permissions, route.resource));

  return (
    <PermissionsContext.Provider value={permissions}>
      {denied ? <NoAccessCard needsWrite={route.needsWrite} projectId={projectId} resource={route.resource} /> : children}
    </PermissionsContext.Provider>
  );
}

/** `true` si el usuario puede escribir en el recurso de la ruta actual (o si la ruta no es de contenido). */
export function useCanWrite() {
  const permissions = useContext(PermissionsContext);
  const route = routeAccess(usePathname());
  return !permissions || !route || canWrite(permissions, route.resource);
}

export function WriteOnly({ children }: { children: React.ReactNode }) {
  return useCanWrite() ? children : null;
}
