"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { cn } from "./cn";
import { Avatar } from "./avatar";
import { Tooltip } from "./tooltip";
import { TopNavbar } from "./top-navbar";
import { Breadcrumbs } from "./breadcrumbs";

export interface SidebarItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

interface SidebarProps {
  title: string;
  subtitle?: string;
  groups: SidebarGroup[];
  user?: { name: string; email: string; avatar?: string } | null;
  onLogout?: () => void;
  children: ReactNode;
  showTopNavbar?: boolean;
  showBreadcrumbs?: boolean;
  width?: string;
  bgColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  groupLabelColor?: string;
  itemTextColor?: string;
  itemHoverColor?: string;
  itemActiveBg?: string;
  itemActiveText?: string;
  dividerColor?: string;
}

export function Sidebar({
  title,
  subtitle,
  groups,
  user,
  onLogout,
  children,
  showTopNavbar = true,
  showBreadcrumbs = true,
  width = "w-64",
  bgColor = "var(--app-sidebar-bg, #fff)",
  titleColor = "var(--app-sidebar-title, #1a1a2e)",
  subtitleColor = "var(--app-sidebar-subtitle, #888)",
  groupLabelColor = "var(--app-sidebar-group-label, #999)",
  itemTextColor = "var(--app-sidebar-item-text, #555)",
  itemHoverColor = "var(--app-sidebar-item-hover, #f0f0f5)",
  itemActiveBg = "var(--app-sidebar-item-active-bg)",
  itemActiveText = "var(--app-sidebar-item-active-text, #fff)",
  dividerColor = "var(--app-sidebar-divider, #e5e5ea)",
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const sidebarContent = (
    <>
      <div
        className="flex items-center justify-between gap-2 px-4 py-4 shrink-0"
        style={{ borderBottom: `1px solid ${dividerColor}` }}
      >
        {!collapsed && (
          <div className="min-w-0 overflow-hidden">
            <h1 className="text-base font-bold truncate" style={{ color: titleColor }}>{title}</h1>
            {subtitle && <p className="text-xs mt-0.5 truncate" style={{ color: subtitleColor }}>{subtitle}</p>}
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="shrink-0 rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors max-md:hidden"
          style={{ color: subtitleColor }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="shrink-0 rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors md:hidden"
          style={{ color: subtitleColor }}
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5">
        {groups.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[11px] font-semibold uppercase tracking-widest px-2 mb-1.5" style={{ color: groupLabelColor }}>
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;
                const link = (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      active && "bg-primary text-primary-foreground",
                      !active && "hover:bg-accent"
                    )}
                    style={{
                      color: active ? undefined : itemTextColor,
                    }}
                  >
                    <Icon size={18} className="shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
                if (collapsed) return <Tooltip key={item.href} content={item.label} side="right">{link}</Tooltip>;
                return link;
              })}
            </div>
          </div>
        ))}
      </nav>

      {user && (
        <div
          className={cn("px-4 py-3", collapsed && "flex justify-center")}
          style={{ borderTop: `1px solid ${dividerColor}` }}
        >
          {collapsed ? (
            <Avatar name={user.name} src={user.avatar} size="md" />
          ) : (
            <div className="flex items-center gap-3">
              <Avatar name={user.name} src={user.avatar} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: titleColor }}>{user.name}</p>
                <p className="text-xs truncate" style={{ color: subtitleColor }}>{user.email}</p>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="shrink-0 rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  style={{ color: subtitleColor }}
                >
                  <LogOut size={15} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 rounded-lg p-2 bg-card shadow-md border border-border/50"
        style={{ color: titleColor }}
      >
        <Menu size={20} />
      </button>

      {/* Mobile sidebar overlay */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col shadow-xl transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ backgroundColor: bgColor, width: "16rem" }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "shrink-0 flex-col shadow-sm transition-all duration-300 max-md:hidden",
          collapsed ? "w-14" : width
        )}
        style={{ backgroundColor: bgColor }}
      >
        <div className="flex flex-col min-h-0 h-full">
          {sidebarContent}
        </div>
      </aside>

      {/* Main content */}
      <main className="relative flex-1 min-w-0 overflow-x-auto bg-[var(--color-background)] flex flex-col">
        {showTopNavbar && (
          <TopNavbar userName={user?.name} userAvatar={user?.avatar} />
        )}
        {showBreadcrumbs && (
          <div className="mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-10 pt-4">
            <Breadcrumbs />
          </div>
        )}
        <div className={cn(
          "mx-auto w-full max-w-7xl",
          showBreadcrumbs ? "p-5 md:p-8 lg:p-10 pt-4" : "p-5 md:p-8 lg:p-10"
        )}>
          {children}
        </div>
      </main>
    </div>
  );
}
