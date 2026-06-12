import type { NavGroup } from "@repo/ui/app-shell";
import {
  Bell,
  LayoutDashboard,
  Network,
  Megaphone,
  Package,
  Settings,
  ShoppingCart,
  Tags,
  TrendingUp,
  Users,
  UserSquare,
} from "lucide-react";

export const wholesalerNav: NavGroup[] = [
  {
    label: "General",
    items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Catálogo",
    items: [
      { label: "Productos", href: "/products", icon: Package },
      { label: "Categorías", href: "/categories", icon: Tags },
    ],
  },
  {
    label: "Ventas",
    items: [
      { label: "Pedidos", href: "/orders", icon: ShoppingCart },
      { label: "Clientes", href: "/customers", icon: Users },
      { label: "Vendedores", href: "/sellers", icon: UserSquare },
      { label: "Reportes", href: "/reports", icon: TrendingUp },
    ],
  },
  {
    label: "Networking",
    items: [
      { label: "Directorio", href: "/directory", icon: Network },
      { label: "Publicaciones", href: "/publications", icon: Megaphone },
      { label: "Notificaciones", href: "/notifications", icon: Bell },
    ],
  },
  {
    label: "Cuenta",
    items: [{ label: "Configuración", href: "/settings", icon: Settings }],
  },
];
