"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { cn, AuthProvider, useAuth } from "@repo/ui";

function SidebarInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p>Cargando...</p></div>;
  if (!user) return null;

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/associations", label: "Mis Asociaciones" },
    { href: "/dashboard/wholesalers", label: "Mayoristas" },
    { href: "/dashboard/orders", label: "Pedidos" },
    { href: "/dashboard/profile", label: "Mi Perfil" },
    { href: "/dashboard/change-password", label: "Contraseña" },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r bg-background p-4 flex flex-col">
        <div className="mb-6">
          <h1 className="text-lg font-bold">Customer Portal</h1>
          <p className="text-xs text-muted-foreground truncate">{user.fullName || user.email}</p>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button onClick={logout} className="text-sm text-muted-foreground hover:text-foreground text-left py-2 mt-4">
          Cerrar sesión
        </button>
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
