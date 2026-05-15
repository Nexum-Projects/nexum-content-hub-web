"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { register } from "@/app/actions/auth";
import { FormSaveActions } from "@/components/forms/form-save-actions";
import { NexumLogo } from "@/components/app/nexum-logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName || !email.trim() || !password.trim()) {
      toast.error("Datos incompletos", {
        description: "Completa nombre, correo y contrasena.",
      });
      return;
    }

    if (password.length < 6) {
      toast.error("Contrasena corta", {
        description: "La contrasena debe tener al menos 6 caracteres.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Las contrasenas no coinciden");
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await register({ name: trimmedName, email, password });
    setIsLoading(false);

    if (result.status === "error") {
      const err = result.errors[0];
      toast.error(err?.title ?? "No se pudo crear la cuenta", {
        description: err?.message,
      });
      setError(err?.message ?? "No se pudo crear la cuenta");
      return;
    }

    toast.success("Cuenta creada", {
      description: "Revisa tu correo para verificar la cuenta e inicia sesion cuando este listo.",
    });
    router.push("/login");
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-0 p-5 pb-4 text-center">
        <div className="flex justify-center">
          <NexumLogo className="mb-3 max-h-[180px]" variant="login" />
        </div>
        <CardTitle className="mt-0 text-xl leading-tight">Crear cuenta</CardTitle>
        <CardDescription className="mt-1.5">Registro interno de Nexum Content Hub</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              autoComplete="name"
              disabled={isLoading}
              maxLength={150}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej. Maria Lopez"
              type="text"
              value={name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo electronico</Label>
            <Input
              id="email"
              autoComplete="email"
              disabled={isLoading}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="usuario@ejemplo.com"
              type="email"
              value={email}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contrasena</Label>
            <div className="relative">
              <Input
                id="password"
                autoComplete="new-password"
                className="pr-10"
                disabled={isLoading}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimo 6 caracteres"
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
            <Label htmlFor="confirmPassword">Confirmar contrasena</Label>
            <Input
              id="confirmPassword"
              autoComplete="new-password"
              disabled={isLoading}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repite la contrasena"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
            />
          </div>

          <FormSaveActions fullWidthSubmit isSubmitting={isLoading} submitLabel="Crear cuenta" />

          <p className="text-center text-xs text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/login">
              Iniciar sesion
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
