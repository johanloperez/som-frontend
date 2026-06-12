"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { startConnection, stopConnection } from "@repo/api";
import { AppShell } from "@repo/ui/app-shell";
import { coreNav } from "@/lib/nav";
import { useAuth } from "@/lib/use-auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, ready, logout } = useAuth();

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.replace("/login");
    }
  }, [ready, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void startConnection();
    return () => {
      void stopConnection();
    };
  }, [isAuthenticated]);

  if (!ready || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <AppShell
      appName="Plataforma"
      tenantName="Administración"
      nav={coreNav}
      user={{ name: user.fullName, email: user.email, avatarUrl: user.avatarUrl }}
      pathname={pathname}
      onNavigate={(href) => router.push(href)}
      onLogout={() => {
        logout();
        router.replace("/login");
      }}
    >
      {children}
    </AppShell>
  );
}
