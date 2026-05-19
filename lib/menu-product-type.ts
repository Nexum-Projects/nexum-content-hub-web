/** Alineado con `com.contenthub_api.ContentHubApi.enums.MenuProductType`. */
export const MENU_PRODUCT_TYPES = [
  "HOT_DRINKS",
  "COLD_DRINKS",
  "PLATES",
  "BRUNCH",
  "SEASONAL_FOOD",
  "SEASONAL_DRINK",
] as const;

export type MenuProductType = (typeof MENU_PRODUCT_TYPES)[number];

export const DEFAULT_MENU_PRODUCT_TYPE: MenuProductType = "HOT_DRINKS";

export const MENU_PRODUCT_TYPE_LABELS: Record<MenuProductType, string> = {
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

export function humanizeMenuProductType(type: MenuProductType | string | null | undefined): string {
  if (type && isMenuProductType(type)) {
    return MENU_PRODUCT_TYPE_LABELS[type];
  }
  return "Desconocido";
}
