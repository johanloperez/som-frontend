"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth, LoadingOverlay, ToastProvider, RealtimeProvider, Avatar } from "@repo/ui";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar, type NavGroup } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Search, Bell, LayoutDashboard, Building2, Users, Package, BarChart3, Shield } from "lucide-react";

function DashboardInner({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [tenantName, setTenantName] = useState("");

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);

  useEffect(() => {
    if (user?.tenantSlug) {
      setTenantName(user.tenantSlug);
    }
  }, [user?.tenantSlug]);

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

  const groups: NavGroup[] = [
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
    <SidebarProvider defaultOpen={true}>
      <AppSidebar
        tenantName={tenantName || "Core Admin"}
        userName={user.fullName || user.email}
        userEmail={user.email}
        groups={groups}
        onLogout={logout}
      />
      <SidebarInset className="bg-background">
        <header className="sticky top-0 z-10 flex items-center gap-2 bg-background border-b border-border px-4 md:px-6 h-14">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-5" />
          <div className="relative flex-1 max-w-md ml-2">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Buscar..." className="h-8 w-full rounded-md bg-muted pl-8 pr-3 text-xs placeholder:text-muted-foreground border border-transparent focus-visible:outline-none focus-visible:border-ring focus-visible:bg-background transition-all" />
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button className="relative p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
              <Bell size={16} />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-primary text-[9px] text-primary-foreground font-bold flex items-center justify-center">3</span>
            </button>
            <Separator orientation="vertical" className="h-5" />
            <Avatar name={user.fullName || user.email || "U"} size="sm" />
            <span className="text-sm font-medium text-foreground max-md:hidden">{user.fullName || user.email}</span>
          </div>
        </header>
        <div className="mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-10 pt-5">
          <LoadingOverlay />
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TooltipProvider>
        <ToastProvider>
          <RealtimeProvider getToken={() => typeof window !== "undefined" ? sessionStorage.getItem("access_token") : null}>
            <DashboardInner>{children}</DashboardInner>
          </RealtimeProvider>
        </ToastProvider>
      </TooltipProvider>
    </AuthProvider>
  );
}
