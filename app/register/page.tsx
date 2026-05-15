import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Registro",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background p-4">
      <RegisterForm />
    </main>
  );
}
