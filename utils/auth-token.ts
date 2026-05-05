export type SessionClaims = {
  exp?: number;
  iat?: number;
  jti?: string;
  sub?: string;
  name?: string;
  email?: string;
  platformRole?: string;
  isActive?: boolean;
  avatarUrl?: string;
  avatar_url?: string;
  [key: string]: unknown;
};

function decodeBase64Url(input: string) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "===".slice((base64.length + 3) % 4);

  if (typeof atob === "function") {
    return atob(padded);
  }

  return Buffer.from(padded, "base64").toString("utf8");
}

export function decodeJwt(token: string): SessionClaims | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }

    return JSON.parse(decodeBase64Url(payload)) as SessionClaims;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string) {
  const claims = decodeJwt(token);
  if (!claims) {
    return true;
  }

  if (typeof claims.exp !== "number") {
    return false;
  }

  return claims.exp * 1000 <= Date.now();
}
