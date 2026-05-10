"use server";

import { cookies } from "next/headers";

import { decodeJwt, type SessionClaims } from "@/utils/auth-token";

/** Formato UUID v1–v5 (hex + guiones). */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuidString(value: string): boolean {
  return UUID_RE.test(value.trim());
}

/**
 * Obtiene el identificador de usuario para `GET /admin/users/:id`.
 *
 * En este backend, **`sub` puede ser el correo** (no sirve como `:id`).
 * El UUID del usuario suele ir en **`jti`**, o en `id` / `userId`.
 *
 * No usamos `sub` si parece email; solo si coincide con formato UUID.
 *
 * Se revisa primero **access token** y luego **refresh** (`session`).
 */
function pickUserId(claims: SessionClaims | null): string | null {
  if (!claims) {
    return null;
  }

  const uuidKeys = ["id", "userId", "user_id", "jti"] as const;
  for (const key of uuidKeys) {
    const raw = claims[key];
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed && isUuidString(trimmed)) {
        return trimmed;
      }
    }
  }

  if (typeof claims.sub === "string") {
    const trimmed = claims.sub.trim();
    if (trimmed && isUuidString(trimmed)) {
      return trimmed;
    }
  }

  return null;
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  const store = await cookies();
  const access = store.get("accessToken")?.value;
  const refresh = store.get("session")?.value;

  for (const token of [access, refresh]) {
    if (!token) {
      continue;
    }
    const id = pickUserId(decodeJwt(token));
    if (id) {
      return id;
    }
  }

  return null;
}
