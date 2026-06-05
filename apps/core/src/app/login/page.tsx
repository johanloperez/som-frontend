"use client";

import { LoginPage } from "@repo/ui";
import { api } from "@repo/api";

const PORTAL_URLS: Record<string, string> = {
  customer: process.env.NEXT_PUBLIC_CUSTOMER_URL ?? "http://localhost:3002",
  wholesaler: process.env.NEXT_PUBLIC_WHOLESALER_URL ?? "http://localhost:3001",
};

const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL ?? "http://localhost:3000";

export default function CoreLogin() {
  const handleLogin = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password, portal: "core" });
    const data = res.data as {
      userId: string; email: string; fullName: string; role: string;
      permissions: { code: string; scope: string | null }[]; accessToken: string; expiresAt: string;
      tenantSlug?: string; portal?: string;
    };

    sessionStorage.setItem("auth_user", JSON.stringify({
      id: data.userId, email: data.email, fullName: data.fullName,
      role: data.role, permissions: data.permissions,
      tenantSlug: data.tenantSlug, portal: data.portal ?? "core",
    }));
    if (data.accessToken) sessionStorage.setItem("access_token", data.accessToken);

    if (data.portal && data.portal !== "core") {
      const baseUrl = PORTAL_URLS[data.portal] ?? CORE_URL;
      const params = new URLSearchParams();
      if (data.accessToken) params.set("accessToken", data.accessToken);
      if (data.tenantSlug) params.set("tenantSlug", data.tenantSlug);
      params.set("userId", data.userId);
      params.set("email", data.email);
      params.set("fullName", data.fullName);
      params.set("role", data.role);
      params.set("permissions", JSON.stringify(data.permissions));
      window.location.href = `${baseUrl}/auth/callback?${params.toString()}`;
      return;
    }
  };

  return (
    <LoginPage
      title="Plataforma Principal"
      description="Inicie sesión para gestionar todo su negocio"
      onLogin={handleLogin}
    />
  );
}
