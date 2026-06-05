"use client";

import { useRouter } from "next/navigation";
import { LoginPage } from "@repo/ui";
import { api } from "@repo/api";

export default function WholesalerLogin() {
  const router = useRouter();

  const handleLogin = async (email: string, password: string) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const data = res.data as { userId: string; email: string; fullName: string; role: string; permissions: string[]; accessToken: string; expiresAt: string; tenantSlug?: string; portal?: string; mustChangePassword?: boolean };

      sessionStorage.setItem("auth_user", JSON.stringify({
        id: data.userId,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        permissions: data.permissions,
        tenantSlug: data.tenantSlug,
        portal: data.portal ?? "wholesaler",
      }));
      if (data.accessToken) {
        sessionStorage.setItem("access_token", data.accessToken);
      }

      if (data.mustChangePassword) {
        router.push("/change-password");
        return;
      }

      if (data.portal && data.portal !== "wholesaler") {
        window.location.href = `http://localhost:3000/login`;
        return;
      }
    } catch (e: any) {
      throw new Error(e?.response?.data?.error ?? e?.response?.data?.message ?? e?.response?.data?.detail ?? "Error al iniciar sesión");
    }
  };

  return (
    <LoginPage
      title="Portal Mayorista"
      description="Inicie sesión para gestionar su negocio"
      onLogin={handleLogin}
    />
  );
}
