import { Badge } from "@/components/ui/badge";
import type { EventItem, MenuProduct } from "@/app/actions/content";
import { humanizeMenuProductType, productCategoryLabel } from "@/lib/menu-product-type";

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
  return <Badge variant="secondary">{humanizeMenuProductType(type)}</Badge>;
}

export function productCategoryBadge(product: Pick<MenuProduct, "category" | "menuCategory">) {
  const label = productCategoryLabel(product);
  if (label === "Sin categoria") {
    return null;
  }
  return <Badge variant="outline">{label}</Badge>;
}

export function eventStatusBadge(status?: EventItem["status"]) {
  switch (status) {
    case "ACTIVE":
      return <Badge variant="success">Activo</Badge>;
    case "CANCELLED":
      return <Badge variant="destructive">Cancelado</Badge>;
    case "FINISHED":
      return <Badge variant="inactive">Finalizado</Badge>;
    default:
      return <Badge variant="success">Activo</Badge>;
  }
}
