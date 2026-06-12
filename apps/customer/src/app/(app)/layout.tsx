"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Package, ShoppingBag, ShoppingCart, Store, User } from "lucide-react";
import { startConnection, stopConnection } from "@repo/api";
import { avatarColor, cn, initials } from "@repo/ui/lib/utils";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/use-auth";

const NAV = [
  { label: "Catálogo", href: "/catalog", icon: ShoppingBag },
  { label: "Mayoristas", href: "/associations", icon: Store },
  { label: "Mis pedidos", href: "/orders", icon: Package },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, ready, logout } = useAuth();
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (ready && !isAuthenticated) router.replace("/login");
  }, [ready, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void startConnection();
    return () => { void stopConnection(); };
  }, [isAuthenticated]);

  if (!ready || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 md:px-6">
          <button onClick={() => router.push("/catalog")} className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShoppingBag className="size-5" />
            </span>
            <span className="hidden text-lg font-bold tracking-tight text-foreground sm:block">Tienda Mayorista</span>
          </button>

          <nav className="flex items-center gap-1">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive(item.href) ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" /> <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => router.push("/cart")}
              className={cn(
                "relative flex size-10 items-center justify-center rounded-lg transition-colors hover:bg-accent",
                isActive("/cart") ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
              aria-label="Carrito"
            >
              <ShoppingCart className="size-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex size-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: avatarColor(user.fullName) }}
                title={user.fullName}
              >
                {initials(user.fullName)}
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-11 z-20 w-56 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                    <div className="border-b border-border px-4 py-3">
                      <p className="truncate text-sm font-medium text-foreground">{user.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <button
                      onClick={() => { setMenuOpen(false); router.push("/profile"); }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-accent"
                    >
                      <User className="size-4" /> Mi perfil
                    </button>
                    <button
                      onClick={() => { logout(); router.replace("/login"); }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-accent"
                    >
                      <LogOut className="size-4" /> Cerrar sesión
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">{children}</main>
    </div>
  );
}
