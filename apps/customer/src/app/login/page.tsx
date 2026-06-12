"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { post, setSession } from "@repo/api";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { useToast } from "@repo/ui/toast";
import { ShoppingBag } from "lucide-react";

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const demo = process.env.NEXT_PUBLIC_DEMO_AUTH === "true";

  function loginDemo(provider: "email" | "google") {
    setSession({
      user: {
        id: "demo",
        email: email || (provider === "google" ? "minorista@gmail.com" : "compras@minegocio.com"),
        fullName: provider === "google" ? "Bodega San Martín" : "Bodega San Martín",
        role: "retail-customer",
        permissions: [],
        avatarUrl: undefined,
      },
      accessToken: "demo-token",
    });
    router.replace("/catalog");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (demo) {
        loginDemo("email");
        return;
      }
      const res = await post<{
        userId: string; email: string; fullName: string; role: string; accessToken: string;
        tenantSlug: string | null;
        permissions: Array<{ code: string; scope: string | null }>;
      }>("/auth/login", { email, password, portal: "customer" });
      setSession({
        user: {
          id: res.userId,
          email: res.email,
          fullName: res.fullName,
          role: res.role,
          tenantSlug: res.tenantSlug ?? undefined,
          permissions: (res.permissions ?? []).map((p) => ({ code: p.code, scope: p.scope ?? "" })),
        },
        accessToken: res.accessToken,
      });
      router.replace("/catalog");
    } catch {
      toast.error("No se pudo iniciar sesión", "Verifica tus credenciales");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
    if (demo) {
      loginDemo("google");
      return;
    }
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirect = `${window.location.origin}/login`;
    const url =
      "https://accounts.google.com/o/oauth2/v2/auth?" +
      new URLSearchParams({
        client_id: clientId ?? "",
        redirect_uri: redirect,
        response_type: "code",
        scope: "openid email profile",
        prompt: "select_account",
      }).toString();
    window.location.href = url;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-accent px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <ShoppingBag className="size-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tienda Mayorista</h1>
          <p className="mt-1 text-sm text-muted-foreground">Compra al por mayor para tu negocio</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
            <GoogleIcon /> Continuar con Google
          </Button>

          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">o con tu correo</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="compras@minegocio.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full" loading={loading}>Iniciar sesión</Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Plataforma Wholesale · Portal de minoristas
        </p>
      </div>
    </div>
  );
}
