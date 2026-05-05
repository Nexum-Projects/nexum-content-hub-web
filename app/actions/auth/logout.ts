"use server";

import { cookies } from "next/headers";

import type { ActionResponse } from "../types";

export default async function logout(): ActionResponse<null> {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  cookieStore.delete("accessToken");

  return {
    status: "success",
    data: null,
  };
}
