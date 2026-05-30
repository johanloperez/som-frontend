"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn, AuthProvider, useAuth } from "@repo/ui";
import { useEffect } from "react";
import { LayoutDashboard, Building2, Users, Package, Shield, BarChart3, type LucideIcon } from "lucide-react";

interface NavItem { href: string; label: string; icon: LucideIcon }
interface NavGroup { label: string; items: NavItem[] }

function SidebarInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);
  if (loading || !user) return <div className="flex min-h-screen items-center justify-center" style={{ color: "var(--app-text)" }}>Cargando...</div>;

  const s = (v: string) => `var(${v})`;

  const navGroups: NavGroup[] = [
    { label: "General", items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] },
    { label: "Administración", items: [
      { href: "/tenants", label: "Mayoristas", icon: Building2 },
      { href: "/customers", label: "Clientes", icon: Users },
      { href: "/plans", label: "Planes", icon: Package },
    ]},
    { label: "Finanzas", items: [{ href: "/profit", label: "Ganancias", icon: BarChart3 }] },
    { label: "RBAC", items: [
      { href: "/rbac/users", label: "Usuarios Core", icon: Users },
      { href: "/rbac/roles", label: "Roles", icon: Shield },
      { href: "/rbac/resources", label: "Recursos", icon: Shield },
    ]},
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 flex flex-col shadow-sm" style={{ backgroundColor: s("--app-sidebar-bg") }}>
        <div className="px-5 py-5" style={{ borderBottom: `1px solid ${s("--app-sidebar-divider")}` }}>
          <h1 className="text-lg font-bold" style={{ color: s("--app-sidebar-title") }}>Core Portal</h1>
          <p className="text-xs mt-0.5 truncate" style={{ color: s("--app-sidebar-subtitle") }}>{user.email}</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-5 py-3 space-y-5">
          {navGroups.map((group) => (
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
