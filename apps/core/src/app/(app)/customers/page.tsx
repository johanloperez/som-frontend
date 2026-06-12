"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { KeyRound, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { ConfirmDialog } from "@repo/ui/confirm-dialog";
import { DataTable } from "@repo/ui/data-table";
import { DropdownMenu } from "@repo/ui/dropdown-menu";
import { PageHeader } from "@repo/ui/page-header";
import { Select } from "@repo/ui/select";
import { useToast } from "@repo/ui/toast";
import { customersApi, geographyApi } from "@/lib/api-services";
import { useData } from "@/lib/use-api";
import type { Customer } from "@/lib/types";
import { CustomerDialog } from "./_components/customer-dialog";

export default function CustomersPage() {
  const toast = useToast();
  const { data: customers = [], refetch } = useData(() => customersApi.list());
  const { data: countryOptions = [] } = useData(() => geographyApi.countries());
  const [country, setCountry] = useState("");
  const [dialog, setDialog] = useState<{ open: boolean; editing: Customer | null }>({
    open: false,
    editing: null,
  });
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const filtered = useMemo(
    () => (country ? customers.filter((c) => c.country === country) : customers),
    [customers, country],
  );

  const columns = useMemo<ColumnDef<Customer, unknown>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: "Nombre",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.fullName}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
      },
      { accessorKey: "username", header: "Usuario", cell: ({ getValue }) => <span className="font-mono text-xs">{String(getValue())}</span> },
      {
        accessorKey: "active",
        header: "Estado",
        cell: ({ getValue }) =>
          getValue() ? <Badge variant="success">Activo</Badge> : <Badge variant="secondary">Inactivo</Badge>,
      },
      { accessorKey: "company", header: "Empresa", cell: ({ getValue }) => String(getValue() || "—") },
      { accessorKey: "country", header: "País" },
      { accessorKey: "createdAt", header: "Registro" },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu
                trigger={
                  <span className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent">
                    <MoreHorizontal className="size-4" />
                  </span>
                }
                items={[
                  { label: "Editar", icon: <Pencil className="size-4" />, onClick: () => setDialog({ open: true, editing: c }) },
                  { label: "Restablecer contraseña", icon: <KeyRound className="size-4" />, onClick: () => toast.success("Contraseña restablecida", `Se envió un correo a ${c.email}`) },
                  "separator",
                  { label: "Eliminar", icon: <Trash2 className="size-4" />, onClick: () => setDeleteTarget(c), destructive: true },
                ]}
              />
            </div>
          );
        },
      },
    ],
    [toast],
  );

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Clientes minoristas registrados en la plataforma"
        actions={
          <Button onClick={() => setDialog({ open: true, editing: null })}>
            <Plus className="size-4" /> Nuevo cliente
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Buscar por nombre, correo…"
        toolbar={
          <div className="w-44">
            <Select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              options={[{ value: "", label: "Todos los países" }, ...countryOptions]}
            />
          </div>
        }
      />

      <CustomerDialog
        open={dialog.open}
        editing={dialog.editing}
        onClose={() => setDialog({ open: false, editing: null })}
        onSaved={refetch}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="¿Eliminar cliente?"
        description={`${deleteTarget?.fullName} será eliminado permanentemente.`}
        confirmLabel="Eliminar"
        onConfirm={async () => {
          if (deleteTarget) {
            await customersApi.remove(deleteTarget.id);
            refetch();
            toast.success("Cliente eliminado", deleteTarget.fullName);
          }
        }}
      />
    </div>
  );
}
