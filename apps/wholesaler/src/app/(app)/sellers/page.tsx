"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { Avatar } from "@repo/ui/avatar";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { ConfirmDialog } from "@repo/ui/confirm-dialog";
import { DataTable } from "@repo/ui/data-table";
import { Dialog } from "@repo/ui/dialog";
import { DropdownMenu } from "@repo/ui/dropdown-menu";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { PageHeader } from "@repo/ui/page-header";
import { useToast } from "@repo/ui/toast";
import { sellersApi } from "@/lib/api-services";
import { useData } from "@/lib/use-api";
import type { Seller } from "@/lib/types";

const money = (n: number) => `$${n.toLocaleString("en-US")}`;
const empty = { fullName: "", email: "", phone: "", region: "", active: true };

export default function SellersPage() {
  const toast = useToast();
  const { data: sellers = [], refetch } = useData(() => sellersApi.list());
  const [dialog, setDialog] = useState<{ open: boolean; editing: Seller | null }>({ open: false, editing: null });
  const [form, setForm] = useState(empty);
  const [deleteTarget, setDeleteTarget] = useState<Seller | null>(null);

  useEffect(() => {
    if (dialog.open) setForm(dialog.editing ? { fullName: dialog.editing.fullName, email: dialog.editing.email, phone: dialog.editing.phone, region: dialog.editing.region, active: dialog.editing.active } : empty);
  }, [dialog]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (dialog.editing) {
      await sellersApi.update(dialog.editing.id, { ...form });
      toast.success("Vendedor actualizado", form.fullName);
    } else {
      await sellersApi.create({ ...form, ordersCount: 0, salesTotal: 0 });
      toast.success("Vendedor creado", form.fullName);
    }
    setDialog({ open: false, editing: null });
    refetch();
  }

  const columns = useMemo<ColumnDef<Seller, unknown>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: "Vendedor",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar name={row.original.fullName} size="sm" />
            <div>
              <p className="font-medium text-foreground">{row.original.fullName}</p>
              <p className="text-xs text-muted-foreground">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      { accessorKey: "region", header: "Región" },
      { accessorKey: "phone", header: "Teléfono", cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span> },
      { accessorKey: "ordersCount", header: "Pedidos" },
      { accessorKey: "salesTotal", header: "Ventas", cell: ({ getValue }) => <span className="font-medium">{money(Number(getValue()))}</span> },
      { accessorKey: "active", header: "Estado", cell: ({ getValue }) => (getValue() ? <Badge variant="success">Activo</Badge> : <Badge variant="secondary">Inactivo</Badge>) },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu
              trigger={<span className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"><MoreHorizontal className="size-4" /></span>}
              items={[
                { label: "Editar", icon: <Pencil className="size-4" />, onClick: () => setDialog({ open: true, editing: row.original }) },
                { label: row.original.active ? "Desactivar" : "Activar", icon: <Power className="size-4" />, onClick: async () => { await sellersApi.update(row.original.id, { active: !row.original.active }); refetch(); } },
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
      <PageHeader
        title="Vendedores"
        subtitle="Tu equipo de ventas y su desempeño"
        actions={
          <Button onClick={() => setDialog({ open: true, editing: null })}>
            <Plus className="size-4" /> Nuevo vendedor
          </Button>
        }
      />

      <DataTable columns={columns} data={sellers} searchPlaceholder="Buscar vendedor…" />

      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ open: false, editing: null })}
        title={dialog.editing ? "Editar vendedor" : "Nuevo vendedor"}
        size="lg"
        footer={<><Button variant="outline" onClick={() => setDialog({ open: false, editing: null })}>Cancelar</Button><Button disabled={!form.fullName || !form.email} onClick={save}>Guardar</Button></>}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre completo"><Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Carlos Mendoza" /></Field>
          <Field label="Región"><Input value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="Lima" /></Field>
          <Field label="Correo"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="carlos@miempresa.com" /></Field>
          <Field label="Teléfono"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+51 980 100 200" /></Field>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="¿Eliminar vendedor?"
        description={`${deleteTarget?.fullName} será eliminado del equipo.`}
        confirmLabel="Eliminar"
        onConfirm={async () => {
          if (deleteTarget) {
            await sellersApi.remove(deleteTarget.id);
            toast.success("Vendedor eliminado", deleteTarget.fullName);
            refetch();
          }
        }}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-1.5 block">{label}</Label>{children}</div>;
}
