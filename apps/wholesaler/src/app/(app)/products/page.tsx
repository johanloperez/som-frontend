"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { MoreHorizontal, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { ConfirmDialog } from "@repo/ui/confirm-dialog";
import { DataTable } from "@repo/ui/data-table";
import { DropdownMenu } from "@repo/ui/dropdown-menu";
import { PageHeader } from "@repo/ui/page-header";
import { Select } from "@repo/ui/select";
import { useToast } from "@repo/ui/toast";
import { categoriesApi, productsApi } from "@/lib/api-services";
import { useData } from "@/lib/use-api";
import type { Product } from "@/lib/types";
import { ProductDialog } from "./_components/product-dialog";

const money = (n: number) => `$${n.toFixed(2)}`;

export default function ProductsPage() {
  const toast = useToast();
  const { data: products = [], loading, refetch } = useData(() => productsApi.list());
  const { data: categories = [] } = useData(() => categoriesApi.list());
  const [categoryId, setCategoryId] = useState("");
  const [dialog, setDialog] = useState<{ open: boolean; editing: Product | null }>({ open: false, editing: null });
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const filtered = useMemo(
    () => (categoryId ? products.filter((p) => p.categoryId === categoryId) : products),
    [products, categoryId],
  );

  const columns = useMemo<ColumnDef<Product, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Producto",
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-foreground">{row.original.name}</p>
            <p className="font-mono text-xs text-muted-foreground">{row.original.sku}</p>
          </div>
        ),
      },
      { accessorKey: "categoryName", header: "Categoría", cell: ({ getValue }) => <Badge variant="outline">{String(getValue())}</Badge> },
      { accessorKey: "price", header: "Precio", meta: { tooltip: "Precio de venta al mayorista" }, cell: ({ getValue }) => <span className="font-medium">{money(Number(getValue()))}</span> },
      {
        accessorKey: "stock",
        header: "Stock",
        cell: ({ row }) => {
          const s = row.original.stock;
          const variant = s === 0 ? "destructive" : s <= 20 ? "warning" : "secondary";
          return <Badge variant={variant}>{s} {row.original.unit}</Badge>;
        },
      },
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
                { label: row.original.active ? "Desactivar" : "Activar", icon: <Power className="size-4" />, onClick: async () => { await productsApi.update(row.original.id, { active: !row.original.active }); refetch(); } },
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
        title="Productos"
        subtitle="Catálogo disponible para tus clientes"
        actions={
          <Button onClick={() => setDialog({ open: true, editing: null })}>
            <Plus className="size-4" /> Nuevo producto
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Buscar por nombre, SKU…"
        toolbar={
          <div className="w-48">
            <Select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={[{ value: "", label: "Todas las categorías" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
            />
          </div>
        }
      />

      <ProductDialog open={dialog.open} editing={dialog.editing} onSaved={refetch} onClose={() => setDialog({ open: false, editing: null })} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="¿Eliminar producto?"
        description={`${deleteTarget?.name} será eliminado del catálogo.`}
        confirmLabel="Eliminar"
        onConfirm={async () => {
          if (deleteTarget) {
            await productsApi.remove(deleteTarget.id);
            toast.success("Producto eliminado", deleteTarget.name);
            refetch();
          }
        }}
      />
    </div>
  );
}
