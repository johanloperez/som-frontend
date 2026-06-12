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
import { Select } from "@repo/ui/select";
import { useToast } from "@repo/ui/toast";
import { customersApi } from "@/lib/api-services";
import { countryOptions } from "@/lib/order-status";
import { useData } from "@/lib/use-api";
import type { WholesaleCustomer } from "@/lib/types";

const money = (n: number) => `$${n.toLocaleString("en-US")}`;
const empty = { fullName: "", email: "", phone: "", company: "", country: "Perú", region: "", active: true };

export default function CustomersPage() {
  const toast = useToast();
  const { data: customers = [], refetch } = useData(() => customersApi.list());
  const [country, setCountry] = useState("");
  const [dialog, setDialog] = useState<{ open: boolean; editing: WholesaleCustomer | null }>({ open: false, editing: null });
  const [form, setForm] = useState(empty);
  const [deleteTarget, setDeleteTarget] = useState<WholesaleCustomer | null>(null);

  const filtered = useMemo(() => (country ? customers.filter((c) => c.country === country) : customers), [customers, country]);

  useEffect(() => {
    if (dialog.open) {
      setForm(dialog.editing ? { fullName: dialog.editing.fullName, email: dialog.editing.email, phone: dialog.editing.phone, company: dialog.editing.company ?? "", country: dialog.editing.country, region: dialog.editing.region ?? "", active: dialog.editing.active } : empty);
    }
  }, [dialog]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (dialog.editing) {
      await customersApi.update(dialog.editing.id, { ...form });
      toast.success("Cliente actualizado", form.fullName);
    } else {
      await customersApi.create({ ...form, ordersCount: 0, totalSpent: 0, createdAt: new Date().toISOString().slice(0, 10) });
      toast.success("Cliente creado", form.fullName);
    }
    setDialog({ open: false, editing: null });
    refetch();
  }

  const columns = useMemo<ColumnDef<WholesaleCustomer, unknown>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: "Cliente",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar name={row.original.fullName} size="sm" />
            <div>
              <p className="font-medium text-foreground">{row.original.company || row.original.fullName}</p>
              <p className="text-xs text-muted-foreground">{row.original.fullName} · {row.original.email}</p>
            </div>
          </div>
        ),
      },
      { accessorKey: "country", header: "País", cell: ({ row }) => <span>{row.original.region ? `${row.original.region}, ` : ""}{row.original.country}</span> },
      { accessorKey: "ordersCount", header: "Pedidos", meta: { tooltip: "Pedidos históricos" } },
      { accessorKey: "totalSpent", header: "Total comprado", cell: ({ getValue }) => <span className="font-medium">{money(Number(getValue()))}</span> },
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
                { label: row.original.active ? "Desactivar" : "Activar", icon: <Power className="size-4" />, onClick: async () => { await customersApi.update(row.original.id, { active: !row.original.active }); refetch(); } },
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
        title="Clientes"
        subtitle="Minoristas que compran a tu negocio"
        actions={
          <Button onClick={() => setDialog({ open: true, editing: null })}>
            <Plus className="size-4" /> Nuevo cliente
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Buscar por nombre, empresa, correo…"
        toolbar={
          <div className="w-44">
            <Select value={country} onChange={(e) => setCountry(e.target.value)} options={[{ value: "", label: "Todos los países" }, ...countryOptions]} />
          </div>
        }
      />

      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ open: false, editing: null })}
        title={dialog.editing ? "Editar cliente" : "Nuevo cliente"}
        size="lg"
        footer={<><Button variant="outline" onClick={() => setDialog({ open: false, editing: null })}>Cancelar</Button><Button disabled={!form.fullName || !form.email} onClick={save}>Guardar</Button></>}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre del contacto"><Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="María González" /></Field>
          <Field label="Empresa"><Input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Bodega María" /></Field>
          <Field label="Correo"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="maria@bodega.com" /></Field>
          <Field label="Teléfono"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+51 987 654 321" /></Field>
          <Field label="País"><Select value={form.country} onChange={(e) => set("country", e.target.value)} options={countryOptions} /></Field>
          <Field label="Región"><Input value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="Lima" /></Field>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="¿Eliminar cliente?"
        description={`${deleteTarget?.fullName} será eliminado permanentemente.`}
        confirmLabel="Eliminar"
        onConfirm={async () => {
          if (deleteTarget) {
            await customersApi.remove(deleteTarget.id);
            toast.success("Cliente eliminado", deleteTarget.fullName);
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
