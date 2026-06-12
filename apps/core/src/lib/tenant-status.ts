import type { TenantStatus } from "./types";

type BadgeVariant = "default" | "success" | "warning" | "destructive" | "secondary";

export const tenantStatusMeta: Record<TenantStatus | string, { label: string; variant: BadgeVariant }> = {
  active: { label: "Activo", variant: "success" },
  trial: { label: "Prueba", variant: "default" },
  suspended: { label: "Suspendido", variant: "warning" },
  delinquent: { label: "Moroso", variant: "destructive" },
  cancelled: { label: "Cancelado", variant: "secondary" },
};

export function getTenantStatusMeta(status?: string) {
  if (!status) return { label: "Desconocido", variant: "default" as BadgeVariant };
  const key = status.toLowerCase();
  return tenantStatusMeta[key] ?? { label: status, variant: "default" as BadgeVariant };
}

export const tenantStatusTabs: { value: TenantStatus | "all"; label: string }[] = [
  { value: "active", label: "Activos" },
  { value: "trial", label: "Prueba" },
  { value: "suspended", label: "Suspendidos" },
  { value: "delinquent", label: "Morosos" },
  { value: "cancelled", label: "Cancelados" },
  { value: "all", label: "Todos" },
];

export const countryOptions = [
  "Perú",
  "Colombia",
  "Chile",
  "Argentina",
  "México",
  "Ecuador",
  "Bolivia",
].map((c) => ({ value: c, label: c }));
