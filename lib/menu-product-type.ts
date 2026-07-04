/** Alineado con `ProductType`, `MenuProductCategory` y `ProductMeasurementUnit` del ContentHubApi. */
export const MENU_PRODUCT_TYPES = [
  "MENU_ITEM",
  "PACKAGED_COFFEE",
  "MERCHANDISE",
  "OTHER",
] as const;

export const MENU_PRODUCT_CATEGORIES = [
  "HOT_DRINKS",
  "COLD_DRINKS",
  "PLATES",
  "BRUNCH",
  "SEASONAL_FOOD",
  "SEASONAL_DRINK",
] as const;

export type MenuProductType = (typeof MENU_PRODUCT_TYPES)[number];
export type MenuProductCategory = (typeof MENU_PRODUCT_CATEGORIES)[number];

export const PRODUCT_MEASUREMENT_UNITS = ["GRAMS", "KILOGRAMS", "MILLILITERS", "LITERS", "UNITS"] as const;
export type ProductMeasurementUnit = (typeof PRODUCT_MEASUREMENT_UNITS)[number];

export const DEFAULT_MENU_PRODUCT_TYPE: MenuProductType = "MENU_ITEM";

export const MENU_PRODUCT_TYPE_LABELS: Record<MenuProductType, string> = {
  MENU_ITEM: "Producto de menu",
  PACKAGED_COFFEE: "Cafe empacado",
  MERCHANDISE: "Mercancia",
  OTHER: "Otro",
};

export const MENU_PRODUCT_CATEGORY_LABELS: Record<MenuProductCategory, string> = {
  HOT_DRINKS: "Bebidas calientes",
  COLD_DRINKS: "Bebidas frías",
  PLATES: "Platos",
  BRUNCH: "Brunch",
  SEASONAL_FOOD: "Comida de temporada",
  SEASONAL_DRINK: "Bebida de temporada",
};

export function isMenuProductType(value: string | undefined | null): value is MenuProductType {
  return MENU_PRODUCT_TYPES.includes(value as MenuProductType);
}

export function isMenuProductCategory(value: string | undefined | null): value is MenuProductCategory {
  return MENU_PRODUCT_CATEGORIES.includes(value as MenuProductCategory);
}

export function isProductMeasurementUnit(value: string | undefined | null): value is ProductMeasurementUnit {
  return PRODUCT_MEASUREMENT_UNITS.includes(value as ProductMeasurementUnit);
}

export function humanizeMenuProductType(type: MenuProductType | string | null | undefined): string {
  if (type && isMenuProductType(type)) {
    return MENU_PRODUCT_TYPE_LABELS[type];
  }
  return "Desconocido";
}

export function humanizeMenuProductCategory(category: MenuProductCategory | string | null | undefined): string {
  if (category && isMenuProductCategory(category)) {
    return MENU_PRODUCT_CATEGORY_LABELS[category];
  }
  return "Sin categoria";
}

export function humanizeProductMeasurementUnit(unit: ProductMeasurementUnit | string | null | undefined): string {
  switch (unit) {
    case "GRAMS":
      return "g";
    case "KILOGRAMS":
      return "kg";
    case "MILLILITERS":
      return "ml";
    case "LITERS":
      return "L";
    case "UNITS":
      return "unidades";
    default:
      return "";
  }
}
