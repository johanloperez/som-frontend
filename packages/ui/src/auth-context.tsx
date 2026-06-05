"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@repo/api";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  permissions: { code: string; scope: string | null }[];
  tenantSlug?: string;
  portal: "core" | "customer" | "wholesaler";
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (code: string, scope?: string | null) => boolean;
}

const AuthContext = createContext<AuthContextValue>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("auth_user");
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const data = res.data as {
      userId: string; email: string; fullName: string; role: string;
      permissions: { code: string; scope: string | null }[];
      accessToken: string; expiresAt: string;
      tenantSlug?: string; portal: "core" | "customer" | "wholesaler";
    };
    const authUser: AuthUser = {
      id: data.userId, email: data.email, fullName: data.fullName,
      role: data.role, permissions: data.permissions ?? [],
      tenantSlug: data.tenantSlug, portal: data.portal,
    };
    sessionStorage.setItem("access_token", data.accessToken);
    sessionStorage.setItem("auth_user", JSON.stringify(authUser));
    setUser(authUser);
  };

  const logout = () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("auth_user");
    setUser(null);
  };

  const hasPermission = (code: string, scope?: string | null) => {
    if (!user) return false;
    return user.permissions.some(p => p.code === code && (!scope || !p.scope || p.scope === scope));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
