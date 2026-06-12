"use client";

import {
  Bell,
  ChevronLeft,
  LogOut,
  type LucideIcon,
  Menu,
  Search,
  X,
} from "lucide-react";
import * as React from "react";
import { avatarColor, cn, initials } from "../lib/utils";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface ShellUser {
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface AppShellProps {
  appName: string;
  tenantName?: string;
  logo?: React.ReactNode;
  nav: NavGroup[];
  user: ShellUser;
  pathname: string;
  onNavigate: (href: string) => void;
  onLogout: () => void;
  breadcrumb?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({
  appName,
  tenantName,
  logo,
  nav,
  user,
  pathname,
  onNavigate,
  onLogout,
  breadcrumb,
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  const go = (href: string) => {
    onNavigate(href);
    setMobileOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar transition-[width,transform] duration-200 md:static md:translate-x-0",
          collapsed ? "w-[4.5rem]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo / tenant */}
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            {logo ?? <span className="text-sm font-bold">{appName[0]}</span>}
          </div>
          {!collapsed && (
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-sidebar-foreground">
                {appName}
              </span>
              {tenantName && (
                <span className="truncate text-xs text-muted-foreground">
                  {tenantName}
                </span>
              )}
            </div>
          )}
          <button
            className="ml-auto text-muted-foreground hover:text-sidebar-foreground md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {nav.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      onClick={() => go(item.href)}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        collapsed && "justify-center px-0",
                      )}
                    >
                      <Icon className="size-[18px] shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-sidebar-border p-3">
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg p-2",
              collapsed && "justify-center",
            )}
          >
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: avatarColor(user.name) }}
            >
              {initials(user.name)}
            </div>
            {!collapsed && (
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-sidebar-foreground">
                  {user.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={onLogout}
                className="text-muted-foreground transition-colors hover:text-destructive"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut className="size-[18px]" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top navbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-md md:px-6">
          <button
            className="text-muted-foreground hover:text-foreground md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="size-5" />
          </button>
          <button
            className="hidden text-muted-foreground hover:text-foreground md:block"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Contraer menú"
          >
            <ChevronLeft
              className={cn("size-5 transition-transform", collapsed && "rotate-180")}
            />
          </button>

          {breadcrumb && <div className="min-w-0 flex-1">{breadcrumb}</div>}

          <div className="ml-auto flex items-center gap-1">
            <button
              className="hidden items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent sm:flex"
              aria-label="Buscar"
            >
              <Search className="size-4" />
              <span>Buscar…</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                ⌘K
              </kbd>
            </button>
            <button
              className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Notificaciones"
            >
              <Bell className="size-5" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive" />
            </button>
            <div
              className="ml-1 flex size-9 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: avatarColor(user.name) }}
              title={user.name}
            >
              {initials(user.name)}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1">
          <div className="mx-auto w-full max-w-7xl px-5 py-6 md:px-8 lg:px-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
