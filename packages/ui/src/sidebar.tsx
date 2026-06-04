"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut, type LucideIcon } from "lucide-react";
import { cn } from "./cn";
import { Avatar } from "./avatar";
import { Tooltip } from "./tooltip";

/* ─── Tipos ─── */

export interface SidebarItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

/* ─── Componente ─── */

interface SidebarProps {
  /** Título arriba del sidebar (ej: "Wholesale") */
  title: string;
  /** Subtítulo debajo del título (ej: nombre de usuario) */
  subtitle?: string;
  /** Grupos de navegación */
  groups: SidebarGroup[];
  /** Info del usuario abajo */
  user?: { name: string; email: string; avatar?: string } | null;
  /** Callback al hacer clic en "Cerrar sesión" */
  onLogout?: () => void;
  /** Contenido principal al lado */
  children: ReactNode;
  /** Ancho del sidebar expandido (default: w-64 = 256px) */
  width?: string;
  /** Color de fondo (CSS, ej: "var(--app-sidebar-bg)" o "#fff") */
  bgColor?: string;
  bgButton?: string;
  /** Color del título */
  titleColor?: string;
  /** Color del subtítulo */
  subtitleColor?: string;
  /** Color de los labels de grupo */
  groupLabelColor?: string;
  /** Color del texto de los ítems */
  itemTextColor?: string;
  /** Color de fondo hover de ítems */
  itemHoverColor?: string;
  /** Color de fondo del ítem activo */
  itemActiveBg?: string;
  /** Color del texto del ítem activo */
  itemActiveText?: string;
  /** Color del divisor */
  dividerColor?: string;
}

export function Sidebar({
  title,
  subtitle,
  groups,
  user,
  onLogout,
  children,
  width = "w-64",
  bgColor = "var(--app-sidebar-bg, #fff)",
  bgButton = "var(--app-sidebar-bg, #fff)",
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
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* ─── Sidebar ─── */}
      <aside
        className={cn("shrink-0 flex flex-col shadow-sm transition-all duration-300", collapsed ? "w-14" : width)}
        style={{ backgroundColor: bgColor }}
      >
        {/* Cabecera */}
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
            className="shrink-0 rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            style={{ color: subtitleColor }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navegación */}
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
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: active ? itemActiveBg : undefined,
                        color: active ? itemActiveText : itemTextColor,
                      }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = itemHoverColor; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = ""; }}
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

        {/* Usuario */}
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
                    className="shrink-0 rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    style={{ color: subtitleColor }}
                  >
                    <LogOut size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ─── Contenido ─── */}
      <main className="relative flex-1 p-6 overflow-x-auto">
        {children}
      </main>
    </div>
  );
}
