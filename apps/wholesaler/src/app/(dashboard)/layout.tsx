"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn, Tooltip, AuthProvider, useAuth } from "@repo/ui";
import { useEffect } from "react";

interface NavItem { href: string; label: string; tooltip: string }

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "General",
    items: [{ href: "/dashboard", label: "Dashboard", tooltip: "Resumen del mayorista" }],
  },
  {
    label: "Gestión",
    items: [
      { href: "/customers", label: "Clientes", tooltip: "Gestión de clientes del mayorista" },
      { href: "/products", label: "Productos", tooltip: "Catálogo de productos y control de stock" },
      { href: "/orders", label: "Pedidos", tooltip: "Pedidos recibidos de clientes" },
      { href: "/sellers", label: "Vendedores", tooltip: "Gestión de vendedores y asignación a clientes" },
      { href: "/associations", label: "Vinculaciones", tooltip: "Solicitudes de vinculación de clientes" },
    ],
  },
  {
    label: "Configuración",
    items: [
      { href: "/settings/regions", label: "Regiones", tooltip: "Gestión de regiones geográficas" },
    ],
  },
  {
    label: "Mi Cuenta",
    items: [
      { href: "/account/billing", label: "Facturación", tooltip: "Historial de pagos y métodos de pago" },
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
           <h1 className="text-lg font-bold">Wholesaler Portal</h1>
           <p className="text-xs text-muted-foreground truncate">{user.fullName || user.email}</p>
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
