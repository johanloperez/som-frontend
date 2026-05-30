"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn, AuthProvider, useAuth } from "@repo/ui";
import { api } from "@repo/api";
import { LayoutDashboard, Users, Package, ShoppingCart, UserCheck, Handshake, CreditCard, MapPin, type LucideIcon } from "lucide-react";

interface NavItem { href: string; label: string; icon: LucideIcon }
interface NavGroup { label: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  { label: "General", items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
  { label: "Gestión", items: [
    { href: "/customers", label: "Clientes", icon: Users },
    { href: "/products", label: "Productos", icon: Package },
    { href: "/orders", label: "Pedidos", icon: ShoppingCart },
    { href: "/sellers", label: "Vendedores", icon: UserCheck },
    { href: "/associations", label: "Vinculaciones", icon: Handshake },
  ]},
  { label: "Configuración", items: [{ href: "/settings/regions", label: "Regiones", icon: MapPin }] },
  { label: "Mi Cuenta", items: [{ href: "/account/billing", label: "Facturación", icon: CreditCard }] },
];

function SidebarInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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

  if (loading || !user) return <div className="flex min-h-screen items-center justify-center" style={{ color: "var(--app-text)" }}>Cargando...</div>;

  const s = (v: string) => `var(${v})`;

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 flex flex-col shadow-sm" style={{ backgroundColor: s("--app-sidebar-bg") }}>
        <div className="px-5 py-5" style={{ borderBottom: `1px solid ${s("--app-sidebar-divider")}` }}>
          <h1 className="text-lg font-bold" style={{ color: s("--app-sidebar-title") }}>{tenantName || user.tenantSlug || "Portal"}</h1>
          <p className="text-xs mt-0.5 truncate" style={{ color: s("--app-sidebar-subtitle") }}>{user.fullName || user.email}</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-5 py-3 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: s("--app-sidebar-group-label") }}>{group.label}</p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-colors"
                      style={active ? {
                        backgroundColor: s("--app-sidebar-item-active-bg"),
                        color: s("--app-sidebar-item-active-text"),
                      } : {
                        color: s("--app-sidebar-item-text"),
                      }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = s("--app-sidebar-item-hover"); }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = ""; }}
                    >
                      <Icon size={20} className="shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <button onClick={logout} className="text-sm text-left px-5 py-4" style={{ color: s("--app-sidebar-subtitle") }}>
          Cerrar sesión
        </button>
      </aside>
      <main className="flex-1 p-8" style={{ backgroundColor: s("--color-background") }}>{children}</main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider><SidebarInner>{children}</SidebarInner></AuthProvider>;
}
