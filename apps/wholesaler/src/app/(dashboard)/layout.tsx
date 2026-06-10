"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthProvider, useAuth, LoadingOverlay, RealtimeProvider } from "@repo/ui";
import { api } from "@repo/api";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Search, Bell } from "lucide-react";
import { Avatar } from "@repo/ui";

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

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar
        tenantName={tenantName || user.tenantSlug || "Portal"}
        userName={user.fullName || user.email}
        userEmail={user.email}
        userAvatar={undefined}
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
        <RealtimeProvider getToken={() => typeof window !== "undefined" ? sessionStorage.getItem("access_token") : null}>
          <DashboardInner>{children}</DashboardInner>
        </RealtimeProvider>
      </TooltipProvider>
    </AuthProvider>
  );
}
