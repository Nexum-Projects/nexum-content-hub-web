"use server";

import { cookies } from "next/headers";

export async function setAuthCookies(
  tokens: { accessToken: string; refreshToken: string },
  remember = false,
) {
  const cookieStore = await cookies();
  const sessionExpires = new Date(
    Date.now() + (remember ? 1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 * 24 * 7),
  );
  const accessExpires = new Date(Date.now() + 1000 * 60 * 60 * 8);

  cookieStore.set("session", tokens.refreshToken, {
    expires: sessionExpires,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  cookieStore.set("accessToken", tokens.accessToken, {
    expires: accessExpires,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
