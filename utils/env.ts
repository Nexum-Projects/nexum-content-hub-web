import { z } from "zod";

const optionalNonEmptyString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.url("Debe ser una URL valida").optional(),
);

const EnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().min(1, "NEXT_PUBLIC_API_URL es requerido"),
  NEXT_PUBLIC_SITE_NAME: z.string().min(1, "NEXT_PUBLIC_SITE_NAME es requerido"),
  NEXT_PUBLIC_SITE_URL: z.url("NEXT_PUBLIC_SITE_URL debe ser una URL valida"),
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalNonEmptyString,
  SUPABASE_SERVICE_ROLE_KEY: optionalNonEmptyString,
  SUPABASE_STORAGE_BUCKET_NAME: optionalNonEmptyString,
});

export const env = EnvSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api",
  NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME ?? "Nexum Content Hub",
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_STORAGE_BUCKET_NAME: process.env.SUPABASE_STORAGE_BUCKET_NAME,
});

export function getSupabaseEnv() {
  const requiredKeys = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_STORAGE_BUCKET_NAME",
  ] as const;
  const missingKeys = requiredKeys.filter((key) => !env[key]);

  if (missingKeys.length > 0) {
    throw new Error(`Faltan variables de entorno de Supabase: ${missingKeys.join(", ")}`);
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_STORAGE_BUCKET_NAME: env.SUPABASE_STORAGE_BUCKET_NAME,
  } as {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    SUPABASE_STORAGE_BUCKET_NAME: string;
  };
}
