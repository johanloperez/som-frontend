"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseApiError, post, setSession } from "@repo/api";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { useToast } from "@repo/ui/toast";
import { Eye, EyeOff, ShoppingBag } from "lucide-react";

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
        tenantSlug: string | null;
        permissions: Array<{ code: string; scope: string | null }>;
      }>("/auth/login", {
        email: email.trim().toLowerCase(),
        password: password.trim(),
        portal: "customer",
      });
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
    } catch (err) {
      const { title, detail } = parseApiError(err);
      toast.error(title, detail);
    } finally {
      setLoading(false);
    }
  }

  function handleGoogle() {
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
              <Input id="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="compras@minegocio.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pr-10" />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={showPassword}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
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
