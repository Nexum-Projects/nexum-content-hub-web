"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { replaceMemberPermissions } from "@/app/actions/content/permissions";
import { FormSaveActions } from "@/components/forms/form-save-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { CMS_RESOURCE_LABELS, type AccessLevel, type CmsResource, type ResourcePermissions } from "@/lib/cms-resources";

type Level = AccessLevel | "NONE";

const LEVEL_LABELS: Record<Level, string> = {
  NONE: "Sin acceso",
  READ: "Lectura",
  WRITE: "Escritura",
};

/** Dependencias que el API no infiere: el formulario y la lista de productos leen las categorías. */
function dependencyWarning(permissions: ResourcePermissions, planResources: CmsResource[]) {
  if (permissions.MENU_PRODUCTS && !permissions.PRODUCT_CATEGORIES && planResources.includes("PRODUCT_CATEGORIES")) {
    return "Menú / Productos necesita al menos lectura en Categorías para listar y editar productos.";
  }
  return null;
}

export function MemberPermissionsForm({
  projectId,
  memberId,
  planResources,
  initialPermissions,
}: {
  projectId: string;
  memberId: string;
  /** Recursos del plan vigente del proyecto. */
  planResources: CmsResource[];
  initialPermissions: ResourcePermissions;
}) {
  const router = useRouter();
  const [permissions, setPermissions] = useState<ResourcePermissions>(initialPermissions);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const warning = dependencyWarning(permissions, planResources);

  function setLevel(resource: CmsResource, level: Level) {
    setPermissions((current) => {
      const next = { ...current };
      if (level === "NONE") {
        delete next[resource];
      } else {
        next[resource] = level;
      }
      return next;
    });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await replaceMemberPermissions(projectId, memberId, permissions);
    setIsSubmitting(false);

    if (result.status === "error") {
      toast.error(result.errors[0]?.title ?? "No se pudieron guardar los permisos", { description: result.errors[0]?.message });
      return;
    }

    toast.success("Permisos actualizados");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Permisos por sección</CardTitle>
          <CardDescription>
            Solo aparecen las secciones del plan del proyecto. Escritura incluye lectura; los cambios aplican en la siguiente
            carga de página del miembro.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {planResources.length === 0 ? (
            <p className="text-sm text-muted-foreground">El plan del proyecto no tiene secciones habilitadas.</p>
          ) : (
            <div className="divide-y rounded-lg border">
              {planResources.map((resource) => (
                <div className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between" key={resource}>
                  <label className="text-sm font-medium" htmlFor={`perm-${resource}`}>
                    {CMS_RESOURCE_LABELS[resource]}
                  </label>
                  <Select
                    className="sm:w-48"
                    id={`perm-${resource}`}
                    onChange={(event) => setLevel(resource, event.target.value as Level)}
                    value={permissions[resource] ?? "NONE"}
                  >
                    {(Object.keys(LEVEL_LABELS) as Level[]).map((level) => (
                      <option key={level} value={level}>
                        {LEVEL_LABELS[level]}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          )}
          {warning ? (
            <Alert className="border-warning/30 bg-warning/10">
              <AlertTitle>Revisa las dependencias</AlertTitle>
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-wrap justify-end gap-2 border-t pt-5">
          <FormSaveActions
            cancelHref={`/dashboard/projects/${projectId}/members`}
            isSubmitting={isSubmitting}
            submitDisabled={planResources.length === 0}
            submitLabel="Guardar permisos"
          />
        </CardFooter>
      </Card>
    </form>
  );
}
