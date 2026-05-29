"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./button";
import { Tooltip } from "./tooltip";

interface LoginPageProps {
  title: string;
  description: string;
  onLogin: (email: string, password: string) => Promise<{ portal: string; tenantSlug?: string } | void>;
}

const PORTAL_URLS: Record<string, string> = {
  core: "http://localhost:3000",
  wholesaler: "http://localhost:3001",
  customer: "http://localhost:3002",
};

export function LoginPage({ title, description, onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await onLogin(email, password);
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
      setError(err?.response?.data?.error ?? err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <div className="space-y-1 text-center mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium"><Tooltip content="Correo electrónico registrado en la plataforma">Email</Tooltip></label>
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
            <label htmlFor="password" className="text-sm font-medium"><Tooltip content="Contraseña de acceso a la plataforma">Password</Tooltip></label>
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
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
