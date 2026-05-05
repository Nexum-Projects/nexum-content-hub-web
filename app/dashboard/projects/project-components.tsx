import Link from "next/link";
import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function isAdminRole(role?: unknown) {
  return role === "SUPER_ADMIN" || role === "SYSADMIN";
}

export function statusBadge(isPublished?: boolean) {
  return isPublished ? <Badge variant="success">Publicado</Badge> : <Badge variant="warning">Borrador</Badge>;
}

export function formatPrice(cents?: number | null) {
  if (!cents) {
    return "Opcional";
  }

  return new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" }).format(cents / 100);
}

export function CreateProjectCard() {
  return (
    <Card className="grid min-h-[260px] place-items-center border-dashed">
      <Link className="flex flex-col items-center gap-3 text-sm text-muted-foreground" href="/dashboard/projects/new">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-accent text-primary">
          <Plus className="h-6 w-6" />
        </span>
        Crear nuevo proyecto
      </Link>
    </Card>
  );
}
