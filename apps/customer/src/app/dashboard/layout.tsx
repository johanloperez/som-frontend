"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth, Sidebar, LoadingOverlay, RealtimeProvider, type SidebarGroup } from "@repo/ui";
import { api } from "@repo/api";
import { LayoutDashboard, Handshake, ShoppingCart, User, Key, Search } from "lucide-react";

function DashboardInner({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);
  useEffect(() => { api.get("/customers/me").then(r => setBusinessName(r.data?.businessName || "")).catch(() => {}); }, []);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Cargando...</div>;

  const groups: SidebarGroup[] = [
    { label: "General", items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/associations", label: "Mis Asociaciones", icon: Handshake },
      { href: "/dashboard/wholesalers", label: "Mayoristas", icon: Search },
      { href: "/dashboard/orders", label: "Pedidos", icon: ShoppingCart },
    ]},
    { label: "Mi Cuenta", items: [
      { href: "/dashboard/profile", label: "Mi Perfil", icon: User },
      { href: "/dashboard/change-password", label: "Contraseña", icon: Key },
    ]},
  ];

  return (
    <Sidebar title={businessName || user.fullName} subtitle={user.email} groups={groups}
      onLogout={logout} user={{ name: user.fullName, email: user.email }}>
      <LoadingOverlay />
      {children}
    </Sidebar>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider><RealtimeProvider getToken={() => typeof window !== "undefined" ? sessionStorage.getItem("access_token") : null}><DashboardInner>{children}</DashboardInner></RealtimeProvider></AuthProvider>;
}
