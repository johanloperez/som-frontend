"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@repo/api";

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
  tenantSlug?: string;
  portal: "core" | "customer" | "wholesaler";
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem("auth_user");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser({ portal: "core", ...parsed });
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const data = res.data as { userId: string; email: string; fullName: string; role: string; permissions: string[]; accessToken: string; expiresAt: string; tenantSlug?: string; portal: "core" | "customer" | "wholesaler" };
    const authUser: AuthUser = {
      id: data.userId,
      email: data.email,
      fullName: data.fullName,
      role: data.role,
      permissions: data.permissions,
      tenantSlug: data.tenantSlug,
      portal: data.portal ?? "core",
    };
    sessionStorage.setItem("auth_user", JSON.stringify(authUser));
    if (data.accessToken) {
      sessionStorage.setItem("access_token", data.accessToken);
    }
    setUser(authUser);
  };

  const logout = () => {
    sessionStorage.removeItem("auth_user");
    sessionStorage.removeItem("access_token");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
