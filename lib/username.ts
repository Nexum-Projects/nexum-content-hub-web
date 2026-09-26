import { z } from "zod";

/**
 * Misma regla que el API (`@Username` de nexum-spring-commons, `nexum.commons.username.*`).
 * Si la regla se desactiva o cambia en el API, cambiarla también aquí.
 */
export const USERNAME_PATTERN = /^[a-z][a-z0-9_]{2,31}$/;

export const USERNAME_HINT = "3-32 caracteres: empieza con letra, luego minúsculas, números o _";

export const USERNAME_ERROR =
  "Usa un nombre de usuario como danieltistoj1 o maria_hernandez23. Sin espacios ni caracteres especiales.";

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Mínimo 3 caracteres")
  .max(32, "Máximo 32 caracteres")
  .regex(USERNAME_PATTERN, USERNAME_ERROR);
