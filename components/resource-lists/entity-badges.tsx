import { Badge } from "@/components/ui/badge";
import type { EventItem, MenuProduct } from "@/app/actions/content";

export function publishBadge(isPublished?: boolean) {
  if (isPublished) {
    return <Badge variant="success">Publicado</Badge>;
  }
  return <Badge variant="warning">Borrador</Badge>;
}

export function featuredBadge(isFeatured?: boolean) {
  if (!isFeatured) {
    return null;
  }
  return (
    <Badge variant="featured">
      Destacado
    </Badge>
  );
}

export function productTypeBadge(type: MenuProduct["type"]) {
  return <Badge variant="secondary">{type === "DRINK" ? "Bebida" : "Comida"}</Badge>;
}

export function eventStatusBadge(status?: EventItem["status"]) {
  switch (status) {
    case "PUBLISHED":
      return <Badge variant="success">Publicado</Badge>;
    case "CANCELLED":
      return <Badge variant="destructive">Cancelado</Badge>;
    case "FINISHED":
      return <Badge variant="inactive">Finalizado</Badge>;
    case "DRAFT":
    default:
      return <Badge variant="warning">Borrador</Badge>;
  }
}
