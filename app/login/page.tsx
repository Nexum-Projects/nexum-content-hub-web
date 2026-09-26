import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams;

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background p-4">
      {reason === "session-expired" && (
        <p role="status" className="w-full max-w-md rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
          Tu sesion expiro o ya no es valida. Inicia sesion nuevamente.
        </p>
      )}
      <LoginForm />
    </main>
  );
}
