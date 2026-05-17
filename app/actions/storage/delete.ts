"use server";

import { getSupabaseEnv } from "@/utils/env";
import { createAdminClient } from "@/utils/supabase/admin";

const STORAGE_ROOT_FOLDER = "nexum-content-hub";

function storagePathFromPublicUrl(publicUrl: string) {
  const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_STORAGE_BUCKET_NAME } = getSupabaseEnv();

  try {
    const url = new URL(publicUrl);
    const supabaseUrl = new URL(NEXT_PUBLIC_SUPABASE_URL);
    if (url.origin !== supabaseUrl.origin) {
      return null;
    }

    const publicPrefix = `/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET_NAME}/`;
    if (!url.pathname.startsWith(publicPrefix)) {
      return null;
    }

    const path = decodeURIComponent(url.pathname.slice(publicPrefix.length));
    return path.startsWith(`${STORAGE_ROOT_FOLDER}/`) ? path : null;
  } catch {
    return null;
  }
}

export async function removeByPublicUrl(publicUrl?: string | null) {
  if (!publicUrl?.trim()) {
    return { removed: false, reason: "empty-url" as const };
  }

  const path = storagePathFromPublicUrl(publicUrl.trim());
  if (!path) {
    return { removed: false, reason: "not-owned-storage-url" as const };
  }

  const { SUPABASE_STORAGE_BUCKET_NAME } = getSupabaseEnv();
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET_NAME).remove([path]);

  if (error) {
    throw new Error(error.message);
  }

  return { removed: true as const, path };
}
