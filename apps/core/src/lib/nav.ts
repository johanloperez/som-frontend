import type { NavGroup } from "@repo/ui/app-shell";
import {
  Building2,
  LayoutDashboard,
  Layers,
  ShieldCheck,
  TrendingUp,
  Users,
  UserCog,
  KeyRound,
} from "lucide-react";

export const coreNav: NavGroup[] = [
  {
    label: "General",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Gestión",
    items: [
      { label: "Mayoristas", href: "/tenants", icon: Building2 },
      { label: "Clientes", href: "/customers", icon: Users },
      { label: "Planes", href: "/plans", icon: Layers },
      { label: "Finanzas", href: "/profit", icon: TrendingUp },
    ],
  },
  {
    label: "Acceso (RBAC)",
    items: [
      { label: "Roles", href: "/rbac/roles", icon: ShieldCheck },
      { label: "Usuarios", href: "/rbac/users", icon: UserCog },
      { label: "Recursos", href: "/rbac/resources", icon: KeyRound },
    ],
  },
];
