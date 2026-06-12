"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Check, MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { ConfirmDialog } from "@repo/ui/confirm-dialog";
import { DataTable } from "@repo/ui/data-table";
import { DropdownMenu } from "@repo/ui/dropdown-menu";
import { PageHeader } from "@repo/ui/page-header";
import { useToast } from "@repo/ui/toast";
import { plansApi } from "@/lib/api-services";
import { useApi } from "@/lib/use-api";
import type { Plan, PlanFeatures } from "@/lib/types";
import { PlanDialog } from "./_components/plan-dialog";

const FEATURE_KEYS: { key: keyof PlanFeatures; label: string }[] = [
  { key: "backup", label: "Backups" },
  { key: "directory", label: "Directorio" },
  { key: "push", label: "Push" },
  { key: "reports", label: "Reportes" },
  { key: "publications", label: "Publicaciones" },
];

export default function PlansPage() {
  const toast = useToast();
  const { data: plans = [], refetch, error, loading } = useApi(() => plansApi.list(), []);
  const [dialog, setDialog] = useState<{ open: boolean; editing: Plan | null }>({ open: false, editing: null });
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);

  const columns = useMemo<ColumnDef<Plan, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Plan",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.description}</p>
          </div>
        ),
      },
      {
        accessorKey: "priceMonthly",
        header: "Precio",
        meta: { tooltip: "Precio mensual / anual en USD" },
        cell: ({ row }) => (
          <span className="font-medium">
            ${row.original.priceMonthly}
            <span className="text-xs text-muted-foreground"> /mes</span>
          </span>
        ),
      },
      { accessorKey: "maxProducts", header: "Productos", meta: { tooltip: "Máximo de productos permitidos" } },
      { accessorKey: "maxCustomers", header: "Clientes", meta: { tooltip: "Máximo de clientes permitidos" } },
      {
        id: "features",
        header: "Características",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {FEATURE_KEYS.map((f) =>
              row.original.features?.[f.key] ? (
                <span key={f.key} className="inline-flex items-center gap-0.5 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                  <Check className="size-3" /> {f.label}
                </span>
              ) : null,
            )}
          </div>
        ),
      },
      {
        accessorKey: "active",
        header: "Estado",
        cell: ({ getValue }) => (getValue() ? <Badge variant="success">Activo</Badge> : <Badge variant="secondary">Inactivo</Badge>),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu
              trigger={<span className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"><MoreHorizontal className="size-4" /></span>}
              items={[
                { label: "Editar", icon: <Pencil className="size-4" />, onClick: () => setDialog({ open: true, editing: row.original }) },
                { label: row.original.active ? "Desactivar" : "Activar", icon: <X className="size-4" />, onClick: async () => { await plansApi.update(row.original.id, { active: !row.original.active }); refetch(); } },
                "separator",
                { label: "Eliminar", icon: <Trash2 className="size-4" />, onClick: () => setDeleteTarget(row.original), destructive: true },
              ]}
            />
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div>
      {error && <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">Error: {error}</div>}
      {loading && <div className="mb-4 text-sm text-muted-foreground">Cargando...</div>}
      <PageHeader
        title="Planes"
        subtitle="Planes de suscripción disponibles para mayoristas"
        actions={
          <Button onClick={() => setDialog({ open: true, editing: null })}>
            <Plus className="size-4" /> Nuevo plan
          </Button>
        }
      />

      <DataTable columns={columns} data={plans} searchPlaceholder="Buscar plan…" />

      <PlanDialog open={dialog.open} editing={dialog.editing} onClose={() => setDialog({ open: false, editing: null })} onSaved={refetch} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="¿Eliminar plan?"
        description={`El plan ${deleteTarget?.name} será eliminado. Los mayoristas suscritos no se verán afectados inmediatamente.`}
        confirmLabel="Eliminar"
        onConfirm={async () => {
          if (deleteTarget) {
            await plansApi.remove(deleteTarget.id);
            refetch();
            toast.success("Plan eliminado", deleteTarget.name);
          }
        }}
      />
    </div>
  );
}
