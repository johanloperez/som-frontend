"use client";

import { LoginPage } from "@repo/ui";
import { api } from "@repo/api";

export default function CustomerLogin() {
  const handleLogin = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const data = res.data as { userId: string; email: string; fullName: string; role: string; permissions: string[]; accessToken: string; expiresAt: string; portal?: string };

    sessionStorage.setItem("auth_user", JSON.stringify({
      id: data.userId,
      email: data.email,
      fullName: data.fullName,
      role: data.role,
      permissions: data.permissions,
      portal: data.portal ?? "customer",
    }));
    if (data.accessToken) {
      sessionStorage.setItem("access_token", data.accessToken);
    }

    if (data.portal && data.portal !== "customer") {
      window.location.href = `http://localhost:3000/login`;
      return;
    }
  };

  return (
    <LoginPage
      title="Customer Portal"
      description="Sign in to discover wholesale opportunities"
      onLogin={handleLogin}
    />
  );
}
