"use server";

import { getSupabaseEnv } from "@/utils/env";
import { createAdminClient } from "@/utils/supabase/admin";

export async function getPublicUrl(filePath: string) {
  const { SUPABASE_STORAGE_BUCKET_NAME } = getSupabaseEnv();
  const supabase = createAdminClient();

  const { data } = supabase.storage.from(SUPABASE_STORAGE_BUCKET_NAME).getPublicUrl(filePath);

  return data;
}
