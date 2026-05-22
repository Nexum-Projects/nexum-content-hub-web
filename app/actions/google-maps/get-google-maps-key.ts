"use server";

import { env } from "@/utils/env";

export async function getGoogleMapsKey() {
  return env.GOOGLE_MAPS_KEY ?? "";
}
