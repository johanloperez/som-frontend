"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { ConfirmDialog } from "@repo/ui/confirm-dialog";
import { DataTable } from "@repo/ui/data-table";
import { Dialog } from "@repo/ui/dialog";
import { DropdownMenu } from "@repo/ui/dropdown-menu";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { PageHeader } from "@repo/ui/page-header";
import { useToast } from "@repo/ui/toast";
import { resourcesApi } from "@/lib/api-services";
import { useData } from "@/lib/use-api";
import type { Resource } from "@/lib/types";

const emptyResource = { code: "", name: "", description: "" };

export default function ResourcesPage() {
  const toast = useToast();
  const { data: resources = [], refetch } = useData(() => resourcesApi.list());
  const [dialog, setDialog] = useState<{ open: boolean; editing: Resource | null }>({ open: false, editing: null });
  const [form, setForm] = useState(emptyResource);
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);

  useEffect(() => {
    if (dialog.open) setForm(emptyResource);
  }, [dialog.open]);

  async function save() {
    await resourcesApi.create({ ...form });
    toast.success("Recurso creado", form.name);
    refetch();
    setDialog({ open: false, editing: null });
  }

  const columns = useMemo<ColumnDef<Resource, unknown>[]>(
    () => [
      { accessorKey: "name", header: "Recurso", cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span> },
      { accessorKey: "description", header: "Descripción", cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span> },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu
              trigger={<span className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"><MoreHorizontal className="size-4" /></span>}
              items={[
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
        title="Recursos"
        subtitle="Módulos protegidos por el control de acceso"
        actions={
          <Button onClick={() => setDialog({ open: true, editing: null })}>
            <Plus className="size-4" /> Nuevo recurso
          </Button>
        }
      />

      <DataTable columns={columns} data={resources} searchPlaceholder="Buscar recurso…" />

      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ open: false, editing: null })}
        title="Nuevo recurso"
        footer={<><Button variant="outline" onClick={() => setDialog({ open: false, editing: null })}>Cancelar</Button><Button disabled={!form.code || !form.name} onClick={save}>Guardar</Button></>}
      >
        <div className="grid gap-4">
          <div><Label className="mb-1.5 block">Nombre</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Mayoristas" /></div>
          <div><Label className="mb-1.5 block">Código</Label><Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="tenants" /></div>
          <div><Label className="mb-1.5 block">Descripción</Label><Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Gestión de cuentas mayoristas" /></div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="¿Eliminar recurso?"
        description={`El recurso ${deleteTarget?.name} y sus permisos asociados serán eliminados.`}
        confirmLabel="Eliminar"
        onConfirm={async () => {
          if (deleteTarget) {
            await resourcesApi.remove(deleteTarget.id);
            toast.success("Recurso eliminado", deleteTarget.name);
            refetch();
          }
        }}
      />
    </div>
  );
}
