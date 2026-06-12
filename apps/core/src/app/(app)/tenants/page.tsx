"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Ban,
  Eye,
  MoreHorizontal,
  PlayCircle,
  PauseCircle,
  Plus,
} from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { ConfirmDialog } from "@repo/ui/confirm-dialog";
import { DataTable } from "@repo/ui/data-table";
import { DropdownMenu } from "@repo/ui/dropdown-menu";
import { PageHeader } from "@repo/ui/page-header";
import { useToast } from "@repo/ui/toast";
import { tenantsApi } from "@/lib/api-services";
import { useData } from "@/lib/use-api";
import { getTenantStatusMeta, tenantStatusTabs } from "@/lib/tenant-status";
import type { Tenant, TenantStatus } from "@/lib/types";
import { CreateTenantDialog } from "./_components/create-tenant-dialog";
import { SuspendDialog } from "./_components/suspend-dialog";

export default function TenantsPage() {
  const router = useRouter();
  const toast = useToast();
  const { data: tenants = [], refetch } = useData(() => tenantsApi.list());
  const [tab, setTab] = useState<TenantStatus | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [suspend, setSuspend] = useState<{
    tenant: Tenant;
    mode: "suspend" | "reactivate";
  } | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Tenant | null>(null);

  const filtered = useMemo(
    () => (tab === "all" ? tenants : tenants.filter((t) => t.status === tab)),
    [tenants, tab],
  );

  const columns = useMemo<ColumnDef<Tenant, unknown>[]>(
    () => [
      { accessorKey: "code", header: "Código", meta: { tooltip: "Código único del mayorista" } },
      {
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.adminEmail}</p>
          </div>
        ),
      },
      { accessorKey: "slug", header: "Slug", cell: ({ getValue }) => <span className="font-mono text-xs text-muted-foreground">{String(getValue())}</span> },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => {
          const meta = getTenantStatusMeta(row.original.status);
          return <Badge variant={meta.variant}>{meta.label}</Badge>;
        },
      },
      { accessorKey: "taxId", header: "ID Fiscal", meta: { tooltip: "Identificación fiscal" } },
      { accessorKey: "country", header: "País" },
      { accessorKey: "createdAt", header: "Creado" },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const t = row.original;
          const isSuspended = t.status === "suspended";
          return (
            <div className="flex justify-end">
              <DropdownMenu
                trigger={
                  <span className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent">
                    <MoreHorizontal className="size-4" />
                  </span>
                }
                items={[
                  { label: "Ver detalle", icon: <Eye className="size-4" />, onClick: () => router.push(`/tenants/${t.id}`) },
                  isSuspended
                    ? { label: "Reactivar", icon: <PlayCircle className="size-4" />, onClick: () => setSuspend({ tenant: t, mode: "reactivate" }) }
                    : { label: "Suspender", icon: <PauseCircle className="size-4" />, onClick: () => setSuspend({ tenant: t, mode: "suspend" }) },
                  "separator",
                  { label: "Cancelar cuenta", icon: <Ban className="size-4" />, onClick: () => setCancelTarget(t), destructive: true },
                ]}
              />
            </div>
          );
        },
      },
    ],
    [router],
  );

  return (
    <div>
      <PageHeader
        title="Mayoristas"
        subtitle="Gestiona las cuentas mayoristas de la plataforma"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Nuevo mayorista
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1">
        {tenantStatusTabs.map((t) => {
          const count =
            t.value === "all"
              ? tenants.length
              : tenants.filter((x) => x.status === t.value).length;
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-xs text-muted-foreground">{count}</span>
            </button>
          );
        })}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Buscar por nombre, código…"
        emptyMessage="No hay mayoristas en esta categoría"
      />

      <CreateTenantDialog open={createOpen} onClose={() => setCreateOpen(false)} onSaved={refetch} />
      <SuspendDialog
        tenant={suspend?.tenant ?? null}
        mode={suspend?.mode ?? "suspend"}
        onClose={() => setSuspend(null)}
        onSaved={refetch}
      />
      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="¿Cancelar esta cuenta?"
        description={`La cuenta de ${cancelTarget?.name} pasará a estado cancelado. Esta acción es difícil de revertir.`}
        confirmLabel="Sí, cancelar"
        onConfirm={async () => {
          if (cancelTarget) {
            await tenantsApi.update(cancelTarget.id, { status: "cancelled" });
            refetch();
            toast.success("Cuenta cancelada", cancelTarget.name);
          }
        }}
      />
    </div>
  );
}
