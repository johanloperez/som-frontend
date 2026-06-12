"use client";

import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { Dialog } from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Select } from "@repo/ui/select";
import { Switch } from "@repo/ui/switch";
import { useToast } from "@repo/ui/toast";
import { categoriesApi, productsApi } from "@/lib/api-services";
import { useData } from "@/lib/use-api";
import type { Product } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Product | null;
  onSaved?: () => void;
}

const empty = {
  name: "",
  sku: "",
  categoryId: "",
  price: 0,
  cost: 0,
  stock: 0,
  unit: "unidad",
  active: true,
};

export function ProductDialog({ open, onClose, editing, onSaved }: Props) {
  const toast = useToast();
  const { data: categories = [] } = useData(() => categoriesApi.list());
  const [form, setForm] = useState(empty);
  const isEdit = !!editing;

  useEffect(() => {
    if (open) {
      setForm(
        editing
          ? { name: editing.name, sku: editing.sku, categoryId: editing.categoryId, price: editing.price, cost: editing.cost, stock: editing.stock, unit: editing.unit, active: editing.active }
          : { ...empty, categoryId: categories[0]?.id ?? "" },
      );
    }
  }, [open, editing, categories]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    const category = categories.find((c) => c.id === form.categoryId);
    const payload = { ...form, categoryName: category?.name ?? "" };
    if (isEdit) {
      await productsApi.update(editing!.id, payload);
      toast.success("Producto actualizado", form.name);
    } else {
      await productsApi.create(payload);
      toast.success("Producto creado", form.name);
    }
    onSaved?.();
    onClose();
  }

  const margin = form.price > 0 ? Math.round(((form.price - form.cost) / form.price) * 100) : 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar producto" : "Nuevo producto"}
      size="lg"
      footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button disabled={!form.name || !form.sku || !form.categoryId} onClick={save}>Guardar</Button></>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre"><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Arroz Extra 1kg" /></Field>
        <Field label="SKU"><Input value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="ABR-0001" /></Field>
        <Field label="Categoría">
          <Select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
        </Field>
        <Field label="Unidad"><Input value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="bolsa, caja, unidad…" /></Field>
        <Field label="Precio de venta (USD)"><Input type="number" step="0.01" value={form.price} onChange={(e) => set("price", +e.target.value)} /></Field>
        <Field label="Costo (USD)"><Input type="number" step="0.01" value={form.cost} onChange={(e) => set("cost", +e.target.value)} /></Field>
        <Field label="Stock"><Input type="number" value={form.stock} onChange={(e) => set("stock", +e.target.value)} /></Field>
        <div className="flex items-end">
          <div className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-2.5">
            <span className="text-sm">Margen estimado</span>
            <span className="font-semibold text-success">{margin}%</span>
          </div>
        </div>
        <div className="sm:col-span-2 flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
          <Label>Producto activo (visible para clientes)</Label>
          <Switch checked={form.active} onCheckedChange={(v) => set("active", v)} />
        </div>
      </div>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-1.5 block">{label}</Label>{children}</div>;
}
