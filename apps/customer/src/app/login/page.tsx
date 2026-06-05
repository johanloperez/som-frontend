"use client";

import { LoginPage } from "@repo/ui";
import { api } from "@repo/api";

const CORE_URL = process.env.NEXT_PUBLIC_CORE_URL ?? "http://localhost:3000";

export default function CustomerLogin() {
  const handleLogin = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password, portal: "customer" });
    const data = res.data as {
      userId: string; email: string; fullName: string; role: string;
      permissions: { code: string; scope: string | null }[]; accessToken: string; expiresAt: string;
      portal?: string; mustChangePassword?: boolean;
    };

    sessionStorage.setItem("auth_user", JSON.stringify({
      id: data.userId, email: data.email, fullName: data.fullName,
      role: data.role, permissions: data.permissions,
      portal: data.portal ?? "customer",
    }));
    if (data.accessToken) sessionStorage.setItem("access_token", data.accessToken);

    if (data.mustChangePassword) {
      window.location.href = "/dashboard/change-password";
      return;
    }

    if (data.portal && data.portal !== "customer") {
      window.location.href = `${CORE_URL}/login`;
      return;
    }
  };

  const handleGoogleLogin = () => {
    if (typeof window === "undefined" || !(window as any).google) {
      alert("Google Sign-In no está disponible. Usa email y contraseña.");
      return;
    }

    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
      scope: "email profile openid",
      callback: async (response: any) => {
        if (response.access_token) {
          try {
            const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${response.access_token}` },
            });
            const googleUser = await userRes.json();
            const res = await api.post("/auth/google-login", {
              credential: response.access_token,
              email: googleUser.email,
              name: googleUser.name,
              sub: googleUser.sub,
            });
            const data = res.data as any;
            sessionStorage.setItem("auth_user", JSON.stringify({
              id: data.userId, email: data.email, fullName: data.fullName,
              role: data.role, permissions: data.permissions ?? [],
              portal: data.portal ?? "customer",
            }));
            if (data.accessToken) sessionStorage.setItem("access_token", data.accessToken);
            window.location.href = "/dashboard";
          } catch (e: any) {
            alert("Error al iniciar con Google: " + (e?.response?.data?.error ?? "Intenta de nuevo"));
          }
        }
      },
    });
    client.requestAccessToken();
  };

  return (
    <LoginPage
      title="Portal Minorista"
      description="Gestiona tus pedidos y proveedores"
      onLogin={handleLogin}
      showRegister
      registerUrl="/register"
      showGoogleLogin
      onGoogleLogin={handleGoogleLogin}
    />
  );
}
