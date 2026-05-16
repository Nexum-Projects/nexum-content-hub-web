import { ResetPasswordForm } from "@/components/auth/reset-password-form";

type SearchParams = Promise<{ token?: string | string[] }>;

export default async function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const raw = sp.token;
  const token = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : undefined;

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background p-4">
      <ResetPasswordForm token={token?.trim() ? token : null} />
    </main>
  );
}
