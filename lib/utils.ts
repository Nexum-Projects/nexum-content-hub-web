import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Acepta `avatarUrl` (JSON camelCase) o `avatar_url` (snake_case desde la API). */
export function resolveAvatarUrl(source: unknown): string | null {
  if (source == null || typeof source !== "object") {
    return null;
  }

  const o = source as Record<string, unknown>;
  for (const key of ["avatarUrl", "avatar_url"] as const) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) {
      return v.trim();
    }
  }

  return null;
}
