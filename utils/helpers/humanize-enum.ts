export type ProjectMemberRole = "OWNER" | "ADMIN" | "MARKETING";

const PROJECT_MEMBER_ROLE_LABELS: Record<ProjectMemberRole, string> = {
  OWNER: "Propietario",
  ADMIN: "Administrador del proyecto",
  MARKETING: "Marketing",
};

export type PlatformRole = "SUPER_ADMIN" | "USER";
export type EventStatus = "ACTIVE" | "CANCELLED" | "FINISHED";

const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  SUPER_ADMIN: "Super administrador",
  USER: "Usuario",
};

const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  ACTIVE: "Activo",
  CANCELLED: "Cancelado",
  FINISHED: "Finalizado",
};

export type { ActionButtonType } from "@/lib/action-button-type";
export { humanizeActionButtonType } from "@/lib/action-button-type";

export type BannerButtonVariant = "PRIMARY" | "SECONDARY";
export type WeekDay = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

const BANNER_BUTTON_VARIANT_LABELS: Record<BannerButtonVariant, string> = {
  PRIMARY: "Principal",
  SECONDARY: "Secundario",
};

const WEEK_DAY_LABELS: Record<WeekDay, string> = {
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes",
  SATURDAY: "Sábado",
  SUNDAY: "Domingo",
};

export function humanizeProjectMemberRole(role: string | null | undefined): string {
  if (!role) {
    return "Sin rol";
  }
  return PROJECT_MEMBER_ROLE_LABELS[role as ProjectMemberRole] ?? role;
}

export function humanizePlatformRole(role: string | null | undefined): string {
  if (!role) {
    return "Sin rol";
  }
  return PLATFORM_ROLE_LABELS[role as PlatformRole] ?? role;
}

export function humanizeEventStatus(status: string | null | undefined): string {
  if (!status) {
    return "Sin estado";
  }
  return EVENT_STATUS_LABELS[status as EventStatus] ?? status;
}

export function humanizeBannerButtonVariant(variant: string | null | undefined): string {
  const key = (variant ?? "PRIMARY") as BannerButtonVariant;
  return BANNER_BUTTON_VARIANT_LABELS[key] ?? String(variant ?? "PRIMARY");
}

export function humanizeWeekDay(day: string | null | undefined): string {
  if (!day) {
    return "Sin día";
  }
  return WEEK_DAY_LABELS[day as WeekDay] ?? day;
}
