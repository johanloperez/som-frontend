import type { OrderStatus } from "./types";

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "destructive" | "outline";

export const orderStatusMeta: Record<OrderStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: "Pendiente", variant: "warning" },
  confirmed: { label: "Confirmado", variant: "default" },
  shipped: { label: "Enviado", variant: "secondary" },
  delivered: { label: "Entregado", variant: "success" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

export const orderStatusTabs: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendientes" },
  { value: "confirmed", label: "Confirmados" },
  { value: "shipped", label: "Enviados" },
  { value: "delivered", label: "Entregados" },
  { value: "cancelled", label: "Cancelados" },
];

export const countryOptions = [
  { value: "Perú", label: "Perú" },
  { value: "Colombia", label: "Colombia" },
  { value: "Chile", label: "Chile" },
  { value: "Argentina", label: "Argentina" },
  { value: "México", label: "México" },
];
