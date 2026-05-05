export type PlatformRole = "SUPER_ADMIN" | "USER";

const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  SUPER_ADMIN: "Super administrador",
  USER: "Usuario",
};

export function humanizePlatformRole(role: string | null | undefined): string {
  if (!role) {
    return "Sin rol";
  }
  return PLATFORM_ROLE_LABELS[role as PlatformRole] ?? role;
}
