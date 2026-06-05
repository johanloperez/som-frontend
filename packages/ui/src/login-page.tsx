"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { Tooltip } from "./tooltip";

interface LoginPageProps {
  title: string;
  description: string;
  onLogin: (email: string, password: string, tenantCode?: string) => Promise<{ portal: string; tenantSlug?: string } | void>;
  showRegister?: boolean;
  registerUrl?: string;
  showGoogleLogin?: boolean;
  onGoogleLogin?: () => void;
  showTenantCode?: boolean;
}

const PORTAL_URLS: Record<string, string> = {
  core: "https://som-core.azurewebsites.net",
  wholesaler: "https://som-wholesaler.azurewebsites.net",
  customer: "https://som-customer.azurewebsites.net",
};

export function LoginPage({ title, description, onLogin, showRegister, registerUrl, showGoogleLogin, onGoogleLogin, showTenantCode }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantCode, setTenantCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await onLogin(email, password, showTenantCode ? tenantCode : undefined);
      if (result) {
        if (result.tenantSlug) sessionStorage.setItem("tenantSlug", result.tenantSlug);
        sessionStorage.setItem("portal", result.portal);
        const targetUrl = PORTAL_URLS[result.portal];
        if (targetUrl && targetUrl !== window.location.origin) {
          window.location.href = targetUrl + "/dashboard";
          return;
        }
      }
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.response?.data?.message ?? err?.response?.data?.detail ?? err?.message ?? "Error al iniciar sesión";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md rounded-xl bg-card-bg p-8 shadow-sm">
        <div className="space-y-1 text-center mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-card-foreground">{description}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
          {showTenantCode && (
            <div className="space-y-2">
              <label htmlFor="tenantCode" className="text-sm font-medium">
                <Tooltip content="Código único de tu mayorista (ej: WH8XK92A). Visible en tu dashboard.">Código de mayorista</Tooltip>
              </label>
              <input
                id="tenantCode"
                type="text"
                required
                value={tenantCode}
                onChange={(e) => setTenantCode(e.target.value.toUpperCase())}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="WH8XK92A"
                maxLength={8}
              />
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium"><Tooltip content="Correo electrónico registrado en la plataforma">Correo</Tooltip></label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium"><Tooltip content="Contraseña de acceso a la plataforma">Clave</Tooltip></label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button variant="outline" type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>

          {showGoogleLogin && (
            <div className="space-y-3 pt-2">
              <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">o continúa con</span></div></div>
              <Button type="button" variant="outline" className="w-full" onClick={onGoogleLogin}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Google
              </Button>
            </div>
          )}

          {showRegister && (
            <p className="text-center text-sm text-muted-foreground pt-2">
              ¿No tienes cuenta?{" "}
              <a href={registerUrl || "/register"} className="text-primary hover:underline font-medium">Crear cuenta</a>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
