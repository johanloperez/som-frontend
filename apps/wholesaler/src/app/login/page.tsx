"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { post, setSession } from "@repo/api";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { useToast } from "@repo/ui/toast";
import { Store } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const slug = process.env.NEXT_PUBLIC_TENANT_SLUG;
      const res = await post<{
        userId: string; email: string; fullName: string; role: string; accessToken: string;
        permissions: Array<{ code: string; scope: string | null }>;
      }>(`/tenant/${slug}/auth/login`, { email, password });
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
    } catch {
      toast.error("No se pudo iniciar sesión", "Verifica tus credenciales");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <Store className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Portal Mayorista
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Accede para gestionar tu negocio
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ventas@miempresa.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" loading={loading}>
              Iniciar sesión
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Plataforma Wholesale · Portal de mayoristas
        </p>
      </div>
    </div>
  );
}
