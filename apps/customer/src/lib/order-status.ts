import type { RetailOrderStatus } from "./types";

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "destructive" | "outline";

export const orderStatusMeta: Record<RetailOrderStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: "Pendiente", variant: "warning" },
  confirmed: { label: "Confirmado", variant: "default" },
  shipped: { label: "En camino", variant: "secondary" },
  delivered: { label: "Entregado", variant: "success" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

export const orderStatusTabs: { value: RetailOrderStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendientes" },
  { value: "confirmed", label: "Confirmados" },
  { value: "shipped", label: "En camino" },
  { value: "delivered", label: "Entregados" },
];

export const accentStyles: Record<string, { bg: string; text: string }> = {
  "accent-1": { bg: "bg-accent-1/10", text: "text-accent-1" },
  "accent-2": { bg: "bg-accent-2/10", text: "text-accent-2" },
  "accent-3": { bg: "bg-accent-3/10", text: "text-accent-3" },
  "accent-4": { bg: "bg-accent-4/10", text: "text-accent-4" },
};

export const categoryOptions = [
  { value: "Abarrotes", label: "Abarrotes" },
  { value: "Bebidas", label: "Bebidas" },
  { value: "Limpieza", label: "Limpieza" },
  { value: "Snacks", label: "Snacks" },
];
