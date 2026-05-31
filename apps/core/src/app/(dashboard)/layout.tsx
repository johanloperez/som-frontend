"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth, Sidebar, type SidebarGroup } from "@repo/ui";
import { LayoutDashboard, Building2, Users, Package, BarChart3, Shield } from "lucide-react";

function DashboardInner({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);
  if (loading || !user) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Cargando...</div>;

  const groups: SidebarGroup[] = [
    { label: "General", items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
    { label: "Administración", items: [
      { href: "/tenants", label: "Mayoristas", icon: Building2 },
      { href: "/customers", label: "Clientes", icon: Users },
      { href: "/plans", label: "Planes", icon: Package },
    ]},
    { label: "Finanzas", items: [{ href: "/profit", label: "Ganancias", icon: BarChart3 }] },
    { label: "RBAC", items: [
      { href: "/rbac/users", label: "Usuarios", icon: Users },
      { href: "/rbac/roles", label: "Roles", icon: Shield },
      { href: "/rbac/resources", label: "Recursos", icon: Shield },
    ]},
  ];

  return (
    <Sidebar title="Core Admin" subtitle={user.email} groups={groups}
      onLogout={logout} user={{ name: user.fullName || user.email, email: user.email }}>
      {children}
    </Sidebar>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider><DashboardInner>{children}</DashboardInner></AuthProvider>;
}
