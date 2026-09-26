import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Cierra la sesión: borra las cookies y lleva al login. Las cookies solo se pueden modificar aquí o en una Server
 * Action, no durante el render de una página; por eso `baseAxios` redirige aquí (con `reason=session-expired`) cuando
 * el API responde 401, y el login muestra el aviso.
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  cookieStore.delete("accessToken");

  const target = new URL("/login", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
  if (request.nextUrl.searchParams.get("reason") === "session-expired") {
    target.searchParams.set("reason", "session-expired");
  }
  return NextResponse.redirect(target);
}
