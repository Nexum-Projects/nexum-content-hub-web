import type { ActionButtonType } from "@/lib/action-button-type";
import type { MenuProductType } from "@/lib/menu-product-type";

export type { ActionButtonType, MenuProductType };

export type Project = {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  logoUrl?: string | null;
  /** Columna `logo_url` en BD; la API puede enviar `logo_url` o `logoUrl`. */
  logo_url?: string | null;
  /** Imagen del proyecto (columna `avatar_url` en BD; la API puede enviar `avatar_url` o `avatarUrl`). */
  avatarUrl?: string | null;
  avatar_url?: string | null;
  isActive?: boolean;
};

/** Rol del usuario dentro de un proyecto (API `ProjectMember`). */
export type ProjectMemberRole = "OWNER" | "ADMIN" | "MARKETING";

export type ProjectMember = {
  id: string;
  /** Identificador del usuario de plataforma asociado al miembro. */
  userId?: string;
  /** Identificador del proyecto asociado al miembro. */
  projectId?: string;
  role: ProjectMemberRole;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  platformRole: "SUPER_ADMIN" | "USER";
  isActive?: boolean;
  /** Columna `avatar_url` en BD; la API puede enviar `avatar_url` o `avatarUrl`. */
  avatarUrl?: string | null;
  avatar_url?: string | null;
  emailVerifiedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Banner = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
  buttons?: BannerButton[];
  createdAt?: string;
  updatedAt?: string;
};

export type BannerButton = {
  id?: string;
  label: string;
  url: string;
  variant?: "PRIMARY" | "SECONDARY" | null;
  target?: "_self" | "_blank" | null;
  isActive?: boolean | null;
  sortOrder?: number | null;
};

export type MenuProduct = {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  type: MenuProductType;
  priceCents?: number | null;
  isAvailable?: boolean;
  isActive?: boolean;
  isPublished?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type EventItem = {
  id: string;
  title: string;
  slug?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  startDate?: string;
  endDate?: string | null;
  location?: EventLocation | null;
  capacity?: number | null;
  priceCents?: number | null;
  status?: "ACTIVE" | "CANCELLED" | "FINISHED";
  isActive?: boolean;
  isPublished?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type EventLocation = {
  id?: string;
  eventId?: string;
  latitude?: number | null;
  longitude?: number | null;
  fullAddress?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Award = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  awardedAt?: string | null;
  isActive?: boolean;
  isPublished?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type MediaItem = {
  id: string;
  projectId?: string;
  type: "IMAGE" | "VIDEO";
  value: string;
  sortOrder?: number;
  isPublic?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ActionButton = {
  id: string;
  projectId?: string;
  type: ActionButtonType;
  value: string;
  sortOrder?: number;
  isActive?: boolean;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type OpeningHour = {
  id: string;
  projectId?: string;
  day: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  startTime: string;
  endTime: string;
  isActive?: boolean;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectLocation = {
  id: string;
  projectId?: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  latitude: number;
  longitude: number;
  fullAddress: string;
  isActive?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type DataResponse<T> = {
  data: T[];
  meta?: {
    page: number;
    limit: number;
    totalObjects: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
};

export type DashboardData = {
  projects: Project[];
  selectedProject: Project | null;
  banners: Banner[];
  products: MenuProduct[];
  events: EventItem[];
  awards: Award[];
};
