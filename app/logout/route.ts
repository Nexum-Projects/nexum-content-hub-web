import { NextResponse, type NextRequest } from "next/server";

/**
 * Cierra la sesión: borra las cookies y lleva al login. Es un Route Handler porque las cookies solo se pueden
 * modificar aquí o en una Server Action (no durante el render de una página).
 * `baseAxios` redirige aquí cuando el API responde 401.
 */
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login?reason=session-expired", request.url));
  response.cookies.delete("session");
  response.cookies.delete("accessToken");
  return response;
}
