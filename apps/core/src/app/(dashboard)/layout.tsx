"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn, Tooltip } from "@repo/ui";
import { AuthProvider, useAuth } from "@repo/ui";
import { useEffect } from "react";

interface NavItem { href: string; label: string; tooltip: string }

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "General",
    items: [{ href: "/dashboard", label: "Dashboard", tooltip: "Resumen general de la plataforma" }],
  },
  {
    label: "Administración",
    items: [
      { href: "/tenants", label: "Mayoristas", tooltip: "Gestión de mayoristas registrados en la plataforma" },
      { href: "/customers", label: "Clientes", tooltip: "Listado de clientes minoristas registrados" },
      { href: "/plans", label: "Planes", tooltip: "Planes de suscripción disponibles para mayoristas" },
    ],
  },
  {
    label: "Finanzas",
    items: [
      { href: "/profit", label: "Ganancias", tooltip: "Reporte de ingresos, facturación y métricas financieras" },
    ],
  },
  {
    label: "RBAC",
    items: [
      { href: "/rbac/users", label: "Usuarios Core", tooltip: "Administradores de la plataforma y sus roles" },
      { href: "/rbac/roles", label: "Roles", tooltip: "Roles con permisos asignables a usuarios" },
      { href: "/rbac/resources", label: "Recursos", tooltip: "Recursos del sistema para control de permisos" },
    ],
  },
];

function SidebarInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p>Loading...</p></div>;
  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-background p-4 flex flex-col">
        <div className="mb-6">
          <h1 className="text-lg font-bold">Core Portal</h1>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <nav className="flex-1 space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">
                {group.label}
              </p>
              {group.items.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Tooltip key={item.href} content={item.tooltip}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      )}
                    >
                      {item.label}
                    </Link>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </nav>
        <Tooltip content="Cerrar la sesión actual">
          <button onClick={logout} className="text-sm text-muted-foreground hover:text-foreground text-left py-2 mt-4">
            Cerrar sesión
          </button>
        </Tooltip>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SidebarInner>{children}</SidebarInner>
    </AuthProvider>
  );
}
