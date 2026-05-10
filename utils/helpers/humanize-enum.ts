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

export type BannerButtonVariant = "PRIMARY" | "SECONDARY";

const BANNER_BUTTON_VARIANT_LABELS: Record<BannerButtonVariant, string> = {
  PRIMARY: "Principal",
  SECONDARY: "Secundario",
};

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
