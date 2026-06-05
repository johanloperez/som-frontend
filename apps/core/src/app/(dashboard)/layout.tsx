"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth, Sidebar, LoadingOverlay, type SidebarGroup } from "@repo/ui";
import { LayoutDashboard, Building2, Users, Package, BarChart3, Shield } from "lucide-react";

function DashboardInner({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);
  if (loading || !user) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Cargando...</div>;

  const isAdmin = user.role === "platform_admin" || !user.permissions || user.permissions.length === 0;
  const permissionMap: Record<string, string> = {
    "/tenants": "tenants.view",
    "/customers": "customers.view",
    "/plans": "plans.view",
    "/profit": "profit.view",
    "/rbac/users": "users.manage",
    "/rbac/roles": "roles.manage",
    "/rbac/resources": "resources.manage",
  };
  const userPerms = (user.permissions ?? []).map(p => p.code ?? p);
  const canAccess = (href: string) => isAdmin || !permissionMap[href] || userPerms.includes(permissionMap[href]);

  const groups: SidebarGroup[] = [
    { label: "General", items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
    { label: "Administración", items: [
      { href: "/tenants", label: "Mayoristas", icon: Building2 },
      { href: "/customers", label: "Clientes", icon: Users },
      { href: "/plans", label: "Planes", icon: Package },
    ].filter(i => canAccess(i.href)) },
    { label: "Finanzas", items: [{ href: "/profit", label: "Ganancias", icon: BarChart3 }].filter(i => canAccess(i.href)) },
    { label: "RBAC", items: [
      { href: "/rbac/users", label: "Usuarios", icon: Users },
      { href: "/rbac/roles", label: "Roles", icon: Shield },
      { href: "/rbac/resources", label: "Recursos", icon: Shield },
    ].filter(i => canAccess(i.href)) },
  ].filter(g => g.items.length > 0);

  return (
    <Sidebar title="Core Admin" subtitle={user.email} groups={groups}
      onLogout={logout} user={{ name: user.fullName || user.email, email: user.email }}>
      <LoadingOverlay />
      {children}
    </Sidebar>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider><DashboardInner>{children}</DashboardInner></AuthProvider>;
}
