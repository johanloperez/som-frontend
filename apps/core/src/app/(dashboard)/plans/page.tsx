"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Button, Input, DataTable, Modal, Tooltip, type FilterConfig } from "@repo/ui";
import type { ColumnDef } from "@tanstack/react-table";

interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxUsers: number;
  maxSellers: number;
  maxProducts: number;
  maxStorageMb: number;
  maxCampaignsPerMonth: number;
  backupEnabled: boolean;
  includesDirectoryListing: boolean;
  pushNotificationsEnabled: boolean;
  reportsEnabled: boolean;
  publicationsEnabled: boolean;
  exportFormats: string;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState({ name: "", monthlyPrice: 0, yearlyPrice: 0, maxUsers: 5, maxSellers: 3, maxProducts: 100, maxStorageMb: 100, maxCampaignsPerMonth: 5, backupEnabled: true, includesDirectoryListing: true, pushNotificationsEnabled: false, reportsEnabled: false, publicationsEnabled: false, exportFormats: "csv" });
  const [error, setError] = useState("");

  const load = async () => {
    try { const r = await api.get("/platform/subscription-plans"); setPlans(r.data); } catch { }
  };

  useEffect(() => { load(); }, []);

  // Sync form when editing changes
  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name, monthlyPrice: editing.monthlyPrice, yearlyPrice: editing.yearlyPrice,
        maxUsers: editing.maxUsers, maxSellers: editing.maxSellers, maxProducts: editing.maxProducts,
        maxStorageMb: editing.maxStorageMb, maxCampaignsPerMonth: editing.maxCampaignsPerMonth,
        backupEnabled: editing.backupEnabled, includesDirectoryListing: editing.includesDirectoryListing,
        pushNotificationsEnabled: editing.pushNotificationsEnabled, reportsEnabled: editing.reportsEnabled,
        publicationsEnabled: editing.publicationsEnabled, exportFormats: editing.exportFormats
      });
    }
  }, [editing]);

  const openCreate = () => { setEditing(null); setForm({ name: "", monthlyPrice: 0, yearlyPrice: 0, maxUsers: 5, maxSellers: 3, maxProducts: 100, maxStorageMb: 100, maxCampaignsPerMonth: 5, backupEnabled: true, includesDirectoryListing: true, pushNotificationsEnabled: false, reportsEnabled: false, publicationsEnabled: false, exportFormats: "csv" }); setOpen(true); };
  const openEdit = (p: Plan) => { setEditing(p); setForm({ name: p.name, monthlyPrice: p.monthlyPrice, yearlyPrice: p.yearlyPrice, maxUsers: p.maxUsers, maxSellers: p.maxSellers, maxProducts: p.maxProducts, maxStorageMb: p.maxStorageMb, maxCampaignsPerMonth: p.maxCampaignsPerMonth, backupEnabled: p.backupEnabled, includesDirectoryListing: p.includesDirectoryListing, pushNotificationsEnabled: p.pushNotificationsEnabled, reportsEnabled: p.reportsEnabled, publicationsEnabled: p.publicationsEnabled, exportFormats: p.exportFormats }); setOpen(true); };

  const save = async () => {
    setError("");
    try {
      if (editing) {
        await api.put(`/platform/subscription-plans/${editing.id}`, form);
      } else {
        await api.post("/platform/subscription-plans", form);
      }
      setOpen(false);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Error al guardar");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar plan?")) return;
    try { await api.delete(`/platform/subscription-plans/${id}`); load(); } catch { }
  };

  const columns: ColumnDef<Plan>[] = [
    { header: () => <Tooltip content="Nombre del plan de suscripción">Nombre</Tooltip>, accessorKey: "name" },
    { header: () => <Tooltip content="Precio mensual del plan en USD">Precio mensual</Tooltip>, accessorKey: "monthlyPrice", cell: ({ getValue }) => `$${getValue()}` },
    { header: () => <Tooltip content="Precio anual del plan en USD (suele incluir descuento)">Precio anual</Tooltip>, accessorKey: "yearlyPrice", cell: ({ getValue }) => `$${getValue()}` },
    { header: () => <Tooltip content="Número máximo de usuarios administrativos permitidos">Máx. usuarios</Tooltip>, accessorKey: "maxUsers" },
    { header: () => <Tooltip content="Número máximo de vendedores permitidos">Máx. vendedores</Tooltip>, accessorKey: "maxSellers" },
    { header: () => <Tooltip content="Número máximo de productos que se pueden registrar">Productos</Tooltip>, accessorKey: "maxProducts" },
    { header: () => <Tooltip content="Indica si el plan incluye copias de seguridad automáticas">Backups</Tooltip>, accessorKey: "backupEnabled", cell: ({ getValue }) => getValue() ? "✓" : "—" },
    { header: () => <Tooltip content="Indica si el plan incluye notificaciones push">Push</Tooltip>, accessorKey: "pushNotificationsEnabled", cell: ({ getValue }) => getValue() ? "✓" : "—" },
    { header: () => <Tooltip content="Indica si el plan incluye reportes">Reportes</Tooltip>, accessorKey: "reportsEnabled", cell: ({ getValue }) => getValue() ? "✓" : "—" },
    { header: () => <Tooltip content="Indica si el plan incluye publicaciones en el feed">Publicaciones</Tooltip>, accessorKey: "publicationsEnabled", cell: ({ getValue }) => getValue() ? "✓" : "—" },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(row.original)}>Editar</Button>
          <Button size="sm" variant="destructive" onClick={() => remove(row.original.id)}>Eliminar</Button>
        </div>
      ),
    },
  ];

  const filters: FilterConfig[] = [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Planes de Suscripción</h2>
        <Button onClick={openCreate}>Nuevo Plan</Button>
      </div>
      <DataTable columns={columns} data={plans} filters={filters} searchable={true} pagination={true} />

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar Plan" : "Nuevo Plan"}>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <Input id="name" label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input id="monthlyPrice" label="Precio mensual" type="number" value={form.monthlyPrice} onChange={(e) => setForm({ ...form, monthlyPrice: Number(e.target.value) })} />
            <Input id="yearlyPrice" label="Precio anual" type="number" value={form.yearlyPrice} onChange={(e) => setForm({ ...form, yearlyPrice: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input id="maxUsers" label="Máx. usuarios" type="number" value={form.maxUsers} onChange={(e) => setForm({ ...form, maxUsers: Number(e.target.value) })} />
            <Input id="maxSellers" label="Máx. vendedores" type="number" value={form.maxSellers} onChange={(e) => setForm({ ...form, maxSellers: Number(e.target.value) })} />
            <Input id="maxProducts" label="Máx. productos" type="number" value={form.maxProducts} onChange={(e) => setForm({ ...form, maxProducts: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input id="maxStorageMb" label="Almacenamiento (MB)" type="number" value={form.maxStorageMb} onChange={(e) => setForm({ ...form, maxStorageMb: Number(e.target.value) })} />
            <Input id="maxCampaignsPerMonth" label="Campañas/mes" type="number" value={form.maxCampaignsPerMonth} onChange={(e) => setForm({ ...form, maxCampaignsPerMonth: Number(e.target.value) })} />
          </div>
          <Input id="exportFormats" label="Formatos de exportación" value={form.exportFormats} onChange={(e) => setForm({ ...form, exportFormats: e.target.value })} />
          <div className="space-y-2 pt-2 border-t">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.backupEnabled} onChange={(e) => setForm({ ...form, backupEnabled: e.target.checked })} className="accent-primary" />
              Backups habilitados
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.includesDirectoryListing} onChange={(e) => setForm({ ...form, includesDirectoryListing: e.target.checked })} className="accent-primary" />
              Listado en directorio
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.pushNotificationsEnabled} onChange={(e) => setForm({ ...form, pushNotificationsEnabled: e.target.checked })} className="accent-primary" />
              Notificaciones push
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.reportsEnabled} onChange={(e) => setForm({ ...form, reportsEnabled: e.target.checked })} className="accent-primary" />
              Reportes
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.publicationsEnabled} onChange={(e) => setForm({ ...form, publicationsEnabled: e.target.checked })} className="accent-primary" />
              Publicaciones
            </label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={save} className="w-full">{editing ? "Actualizar" : "Crear"}</Button>
        </div>
      </Modal>
    </div>
  );
}
