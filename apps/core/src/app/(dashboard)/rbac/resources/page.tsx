"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Button, Input, DataTable, Modal, Tooltip, type FilterConfig } from "@repo/ui";
import type { ColumnDef } from "@tanstack/react-table";

interface Resource {
  id: string;
  code: string;
  group: string;
  description: string;
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: "", group: "", description: "" });
  const [error, setError] = useState("");

  const load = async () => {
    try { const r = await api.get("/platform/resources"); setResources(r.data); } catch { }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setError("");
    try {
      await api.post("/platform/resources", form);
      setOpen(false);
      setForm({ code: "", group: "", description: "" });
      load();
    } catch (e: any) { setError(e?.response?.data?.error ?? "Error"); }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar recurso?")) return;
    try { await api.delete(`/platform/resources/${id}`); load(); } catch { }
  };

  const columns: ColumnDef<Resource>[] = [
    { header: () => <Tooltip content="Identificador único del recurso (ej: customers.view)">Código</Tooltip>, accessorKey: "code" },
    { header: () => <Tooltip content="Grupo funcional al que pertenece el recurso">Grupo</Tooltip>, accessorKey: "group" },
    { header: () => <Tooltip content="Descripción detallada del recurso y su propósito">Descripción</Tooltip>, accessorKey: "description" },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button size="sm" variant="destructive" onClick={() => remove(row.original.id)}>Eliminar</Button>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      type: "select",
      column: "group",
      label: "Grupo",
      options: Array.from(new Set(resources.map(r => r.group).filter(Boolean))).map(g => ({ value: g, label: g })),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Recursos</h2>
        <Button onClick={() => setOpen(true)}>Nuevo Recurso</Button>
      </div>
      <DataTable columns={columns} data={resources} filters={filters} searchable={true} pagination={true} />

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo Recurso">
        <div className="space-y-3">
          <Input id="code" label="Código" tooltip="Identificador único en formato recurso.accion (ej: customers.view)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="resource.action" />
          <Input id="group" label="Grupo" tooltip="Grupo funcional para organizar los recursos" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} />
          <Input id="description" label="Descripción" tooltip="Descripción del propósito de este recurso" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={create} className="w-full">Crear</Button>
        </div>
      </Modal>
    </div>
  );
}
