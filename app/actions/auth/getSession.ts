"use server";

import { cookies } from "next/headers";

import { decodeJwt, isJwtExpired, type SessionClaims } from "@/utils/auth-token";

export default async function getSession(): Promise<SessionClaims | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  if (!session || isJwtExpired(session)) {
    return null;
  }

  return decodeJwt(session);
}
