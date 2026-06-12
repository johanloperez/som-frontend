"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { ConfirmDialog } from "@repo/ui/confirm-dialog";
import { DataTable } from "@repo/ui/data-table";
import { Dialog } from "@repo/ui/dialog";
import { DropdownMenu } from "@repo/ui/dropdown-menu";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { PageHeader } from "@repo/ui/page-header";
import { Textarea } from "@repo/ui/textarea";
import { useToast } from "@repo/ui/toast";
import { categoriesApi, productsApi } from "@/lib/api-services";
import { useData } from "@/lib/use-api";
import type { Category } from "@/lib/types";

const empty = { name: "", description: "", active: true };

export default function CategoriesPage() {
  const toast = useToast();
  const { data: categories = [], refetch } = useData(() => categoriesApi.list());
  const { data: products = [] } = useData(() => productsApi.list());
  const [dialog, setDialog] = useState<{ open: boolean; editing: Category | null }>({ open: false, editing: null });
  const [form, setForm] = useState(empty);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  useEffect(() => {
    if (dialog.open) setForm(dialog.editing ? { name: dialog.editing.name, description: dialog.editing.description, active: dialog.editing.active } : empty);
  }, [dialog]);

  const countFor = (id: string) => products.filter((p) => p.categoryId === id).length;

  async function save() {
    if (dialog.editing) {
      await categoriesApi.update(dialog.editing.id, { ...form });
      toast.success("Categoría actualizada", form.name);
    } else {
      await categoriesApi.create({ ...form });
      toast.success("Categoría creada", form.name);
    }
    setDialog({ open: false, editing: null });
    refetch();
  }

  const columns = useMemo<ColumnDef<Category, unknown>[]>(
    () => [
      { accessorKey: "name", header: "Categoría", cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span> },
      { accessorKey: "description", header: "Descripción", cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span> },
      { id: "products", header: "Productos", cell: ({ row }) => <Badge variant="secondary">{countFor(row.original.id)}</Badge> },
      { accessorKey: "active", header: "Estado", cell: ({ getValue }) => (getValue() ? <Badge variant="success">Activa</Badge> : <Badge variant="secondary">Inactiva</Badge>) },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu
              trigger={<span className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"><MoreHorizontal className="size-4" /></span>}
              items={[
                { label: "Editar", icon: <Pencil className="size-4" />, onClick: () => setDialog({ open: true, editing: row.original }) },
                { label: row.original.active ? "Desactivar" : "Activar", icon: <Power className="size-4" />, onClick: async () => { await categoriesApi.update(row.original.id, { active: !row.original.active }); refetch(); } },
                "separator",
                { label: "Eliminar", icon: <Trash2 className="size-4" />, onClick: () => setDeleteTarget(row.original), destructive: true },
              ]}
            />
          </div>
        ),
      },
    ],
    [products],
  );

  return (
    <div>
      <PageHeader
        title="Categorías"
        subtitle="Organiza tu catálogo por categorías"
        actions={
          <Button onClick={() => setDialog({ open: true, editing: null })}>
            <Plus className="size-4" /> Nueva categoría
          </Button>
        }
      />

      <DataTable columns={columns} data={categories} searchPlaceholder="Buscar categoría…" />

      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ open: false, editing: null })}
        title={dialog.editing ? "Editar categoría" : "Nueva categoría"}
        footer={<><Button variant="outline" onClick={() => setDialog({ open: false, editing: null })}>Cancelar</Button><Button disabled={!form.name} onClick={save}>Guardar</Button></>}
      >
        <div className="grid gap-4">
          <div><Label className="mb-1.5 block">Nombre</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Abarrotes" /></div>
          <div><Label className="mb-1.5 block">Descripción</Label><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="¿Eliminar categoría?"
        description={`${deleteTarget?.name} será eliminada. Los productos asociados quedarán sin categoría.`}
        confirmLabel="Eliminar"
        onConfirm={async () => {
          if (deleteTarget) {
            await categoriesApi.remove(deleteTarget.id);
            toast.success("Categoría eliminada", deleteTarget.name);
            refetch();
          }
        }}
      />
    </div>
  );
}
