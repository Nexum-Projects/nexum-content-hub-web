import { NextResponse, type NextRequest } from "next/server";

import { isJwtExpired } from "@/utils/auth-token";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const session = request.cookies.get("session")?.value;
  const hasValidSession = !!session && !isJwtExpired(session);

  if (session && !hasValidSession) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("session");
    response.cookies.delete("accessToken");
    return response;
  }

  if (pathname === "/login" && hasValidSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if ((pathname === "/" || pathname.startsWith("/dashboard")) && !hasValidSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/login"],
};
