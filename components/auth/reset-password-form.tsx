"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { confirmPasswordReset } from "@/app/actions/auth";
import { FormSaveActions } from "@/components/forms/form-save-actions";
import { NexumLogo } from "@/components/app/nexum-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ResetPasswordFormProps = {
  token: string | null;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token?.trim()) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-0 p-5 pb-4 text-center">
          <div className="flex justify-center">
            <NexumLogo className="mb-3 max-h-[180px]" variant="login" />
          </div>
          <CardTitle className="mt-0 text-xl leading-tight">Enlace invalido</CardTitle>
          <CardDescription className="mt-1.5">
            Falta el token en la URL o el enlace esta incompleto. Solicita un nuevo correo de recuperacion.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href="/login">Ir al inicio de sesion</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedToken = token?.trim();
    if (!trimmedToken) {
      return;
    }

    if (!password.trim()) {
      toast.error("Datos incompletos", {
        description: "Introduce tu nueva contrasena.",
      });
      return;
    }

    if (password.length < 6) {
      toast.error("Contrasena muy corta", {
        description: "Usa al menos 6 caracteres.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("No coinciden", {
        description: "La confirmacion debe ser igual a la nueva contrasena.",
      });
      return;
    }

    setIsLoading(true);
    const result = await confirmPasswordReset({ token: trimmedToken, newPassword: password });
    setIsLoading(false);

    if (result.status === "error") {
      const first = result.errors[0];
      toast.error(first?.title ?? "No se pudo actualizar", {
        description: first?.message,
      });
      setError(first?.message ?? "No se pudo actualizar la contrasena");
      return;
    }

    toast.success("Contrasena actualizada", {
      description: result.data.message || "Ya puedes iniciar sesion con tu nueva contrasena.",
    });
    window.location.assign("/login");
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-0 p-5 pb-4 text-center">
        <div className="flex justify-center">
          <NexumLogo className="mb-3 max-h-[180px]" variant="login" />
        </div>
        <CardTitle className="mt-0 text-xl leading-tight">Nueva contrasena</CardTitle>
        <CardDescription className="mt-1.5">Define una contrasena nueva para tu cuenta</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="new-password">Nueva contrasena</Label>
            <div className="relative">
              <Input
                id="new-password"
                autoComplete="new-password"
                className="pr-10"
                disabled={isLoading}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                disabled={isLoading}
                onClick={() => setShowPassword((value) => !value)}
                type="button"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar contrasena</Label>
            <Input
              id="confirm-password"
              autoComplete="new-password"
              disabled={isLoading}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
            />
          </div>

          <FormSaveActions fullWidthSubmit isSubmitting={isLoading} submitLabel="Guardar contrasena" />

          <p className="text-center text-xs text-muted-foreground">
            <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/login">
              Volver al inicio de sesion
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
