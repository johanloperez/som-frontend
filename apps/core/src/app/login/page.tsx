"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseApiError, post, setSession } from "@repo/api";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { useToast } from "@repo/ui/toast";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Mobile keyboards often capitalize, autocorrect, or append a trailing
      // space (especially after tapping an autofill suggestion). Normalizing
      // here prevents a correct credential from being rejected as a 401.
      const res = await post<{
        userId: string; email: string; fullName: string; role: string; accessToken: string;
        permissions: Array<{ code: string; scope: string | null }>;
      }>("/auth/login", {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
      setSession({
        user: {
          id: res.userId,
          email: res.email,
          fullName: res.fullName,
          role: res.role,
          permissions: res.permissions.map((p) => ({ code: p.code, scope: p.scope ?? "" })),
        },
        accessToken: res.accessToken,
      });
      toast.success("Sesión iniciada", `Bienvenido, ${res.fullName}`);
      router.replace("/dashboard");
    } catch (err) {
      const { title, detail } = parseApiError(err);
      toast.error(title, detail);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <ShieldCheck className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Administración
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Accede al portal de la plataforma
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@plataforma.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={showPassword}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" loading={loading}>
              Iniciar sesión
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Plataforma Wholesale · Solo personal autorizado
        </p>
      </div>
    </div>
  );
}
