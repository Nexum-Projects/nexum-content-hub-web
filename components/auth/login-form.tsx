"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { login } from "@/app/actions/auth";
import { NexumLogo } from "@/components/app/nexum-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Datos incompletos", {
        description: "Introduce correo y contrasena.",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await login({ email, password, remember });
    setIsLoading(false);

    if (result.status === "error") {
      const error = result.errors[0];
      toast.error(error?.title ?? "No se pudo iniciar sesion", {
        description: error?.message,
      });
      setError(error?.message ?? "No se pudo iniciar sesion");
      return;
    }

    toast.success("Sesion iniciada", {
      description: "Bienvenido a Nexum Content Hub.",
    });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-0 p-5 pb-4 text-center">
        <div className="flex justify-center">
          <NexumLogo className="-mb-7" variant="login" />
        </div>
        <CardTitle className="mt-0 text-xl leading-tight">Bienvenido de vuelta</CardTitle>
        <CardDescription className="mt-1.5">Inicia sesion para continuar a Nexum Content Hub</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Correo electronico</Label>
            <Input
              id="email"
              autoComplete="email"
              disabled={isLoading}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@ejemplo.com"
              type="email"
              value={email}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contrasena</Label>
            <div className="relative">
              <Input
                id="password"
                autoComplete="current-password"
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
          <div className="flex items-center justify-between gap-3 text-xs">
            <label className="flex items-center gap-2 text-muted-foreground">
              <input
                checked={remember}
                className="h-4 w-4 rounded border-input accent-primary"
                onChange={(event) => setRemember(event.target.checked)}
                type="checkbox"
              />
              Recordarme
            </label>
            <Link className="font-medium text-primary hover:underline" href="/reset-password">
              ¿Olvidaste tu contrasena?
            </Link>
          </div>
          <Button className="w-full" disabled={isLoading} type="submit">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Iniciar sesion
          </Button>

          <div className="text-center text-sm">
            <Link className="text-primary underline-offset-4 hover:underline" href="/reset-password">
              ¿Olvidaste tu contrasena?
            </Link>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            ¿No tienes una cuenta?{" "}
            <span className="font-medium text-primary">Contacta al administrador</span>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
