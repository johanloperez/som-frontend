"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth, Sidebar, type SidebarGroup } from "@repo/ui";
import { api } from "@repo/api";
import { LayoutDashboard, Users, Package, ShoppingCart, UserCheck, Handshake, CreditCard, MapPin, Store } from "lucide-react";

function DashboardInner({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [tenantName, setTenantName] = useState("");

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);

  useEffect(() => {
    if (user?.tenantSlug) {
      api.get(`/directory/wholesalers?search=${user.tenantSlug}`)
        .then(r => { const t = r.data.find((w: any) => w.slug === user.tenantSlug); if (t) setTenantName(t.displayName); })
        .catch(() => {});
    }
  }, [user?.tenantSlug]);

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Cargando...</div>;

  const groups: SidebarGroup[] = [
    { label: "General", items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
    { label: "Gestión", items: [
      { href: "/customers", label: "Clientes", icon: Users },
      { href: "/products", label: "Productos", icon: Package },
      { href: "/orders", label: "Pedidos", icon: ShoppingCart },
      { href: "/sellers", label: "Vendedores", icon: UserCheck },
      { href: "/associations", label: "Vinculaciones", icon: Handshake },
      { href: "/publications", label: "Publicaciones", icon: Store },
    ]},
    { label: "Configuración", items: [{ href: "/settings/regions", label: "Regiones", icon: MapPin }] },
    { label: "Mi Cuenta", items: [{ href: "/account/billing", label: "Facturación", icon: CreditCard }] },
  ];

  return (
    <Sidebar title={tenantName || user.tenantSlug || "Portal"} subtitle={user.fullName || user.email} groups={groups}
      onLogout={logout} user={{ name: user.fullName || user.email, email: user.email }}>
      {children}
    </Sidebar>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider><DashboardInner>{children}</DashboardInner></AuthProvider>;
}
