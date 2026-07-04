import type { Award, Banner, EventItem, MenuProduct, Project, User } from "@/app/actions/content";

export const fallbackProjects: Project[] = [
  { id: "demo-cafe", name: "Cafe de Reyes", slug: "cafe-de-reyes", domain: "cafedereyes.com", isActive: true },
  { id: "demo-terraza", name: "Restaurante La Terraza", slug: "la-terraza", domain: "laterraza.com", isActive: true },
  { id: "demo-hotel", name: "Hotel del Lago", slug: "hotel-del-lago", domain: "hoteldellago.com", isActive: true },
];

export const fallbackBanners: Banner[] = [
  { id: "1", title: "Banner principal", imageUrl: "", isPublished: true, createdAt: "2024-05-20" },
  { id: "2", title: "Promociones", imageUrl: "", isPublished: true, createdAt: "2024-05-18" },
  { id: "3", title: "Eventos", imageUrl: "", isPublished: true, createdAt: "2024-05-15" },
  { id: "4", title: "Banner secundario", imageUrl: "", isPublished: false, createdAt: "2024-05-10" },
];

export const fallbackProducts: MenuProduct[] = [
  { id: "1", name: "Latte Vainilla", type: "MENU_ITEM", menuCategory: "HOT_DRINKS", description: "Espuma cremosa y vainilla natural.", priceCents: 3000, isPublished: true, isAvailable: true, isFeatured: true },
  { id: "2", name: "Bolsa de cafe", type: "PACKAGED_COFFEE", measurementValue: 340, measurementUnit: "GRAMS", description: "Cafe de origen para preparar en casa.", priceCents: 9500, isPublished: true, isAvailable: true },
];

export const fallbackEvents: EventItem[] = [
  { id: "1", title: "Cata de cafes de origen", startDate: "2026-05-15", location: { fullAddress: "Terraza principal" }, status: "ACTIVE", isPublished: true },
  { id: "2", title: "Noche de Jazz", startDate: "2026-05-24", location: { fullAddress: "Salon privado" }, status: "ACTIVE", isPublished: false },
];

export const fallbackAwards: Award[] = [
  { id: "1", title: "Premio al mejor origen 2025", sourceName: "Guia Local", isPublished: true, isFeatured: true },
  { id: "2", title: "Top cafe de especialidad", sourceName: "City Awards", isPublished: true },
];

export const fallbackUsers: User[] = [
  { id: "1", name: "Daniel Martinez", email: "daniel@nexum.dev", platformRole: "SUPER_ADMIN", isActive: true },
  { id: "2", name: "Editor Cafe de Reyes", email: "editor@cafedereyes.com", platformRole: "USER", isActive: true },
];
