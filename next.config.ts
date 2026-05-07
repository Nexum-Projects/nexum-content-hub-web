import type { NextConfig } from "next";

const supabaseStorageRemotePatterns = [
  new URL("http://127.0.0.1:54321/storage/v1/object/public/**"),
  ...(process.env.NEXT_PUBLIC_SUPABASE_URL
    ? [new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/**`)]
    : []),
];

const nextConfig: NextConfig = {
  images: {
    contentDispositionType: "inline",
    remotePatterns: supabaseStorageRemotePatterns,
  },
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
