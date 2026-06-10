"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Button, Badge, Input, DataTable, Modal, useAuth, useRealtime } from "@repo/ui";
import type { ColumnDef } from "@tanstack/react-table";

interface Seller {
  id: string;
  sellerCode: string;
  fullName: string;
  email?: string;
  phoneE164?: string;
  region?: string;
  status: string;
  createdAt: string;
}

interface Customer {
  id: string;
  customerCode: string;
  businessName: string;
  region?: string;
  assignedSellerId?: string;
}

export default function SellersPage() {
  const { user } = useAuth();
  const slug = user?.tenantSlug ?? "";
  const basePath = slug ? `/tenant/${slug}` : "";

  const [sellers, setSellers] = useState<Seller[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [regionNames, setRegionNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", phoneE164: "", region: "" });
  const [error, setError] = useState("");

  const [assignModal, setAssignModal] = useState(false);
  const [assignSeller, setAssignSeller] = useState<Seller | null>(null);
  const [assignError, setAssignError] = useState("");

  const load = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const [sellersRes, custRes, regRes] = await Promise.all([
        api.get(`${basePath}/sellers`).catch(() => ({ data: [] })),
        api.get(`${basePath}/customers`).catch(() => ({ data: [] })),
        api.get(`${basePath}/regions`).catch(() => ({ data: [] })),
      ]);
      setSellers(sellersRes.data);
      setCustomers(custRes.data);
      setRegionNames((regRes.data as { name: string }[]).map(r => r.name));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [slug]);
  useRealtime("seller", "*", () => { load(); });

  const openCreate = () => { setEditId(null); setForm({ fullName: "", email: "", phoneE164: "", region: "" }); setError(""); setModal(true); };
  const openEdit = (s: Seller) => { setEditId(s.id); setForm({ fullName: s.fullName, email: s.email ?? "", phoneE164: s.phoneE164 ?? "", region: s.region ?? "" }); setError(""); setModal(true); };

  const save = async () => {
    try {
      if (editId) await api.put(`${basePath}/sellers/${editId}`, { ...form, sellerCode: editId, status: "active" });
      else await api.post(`${basePath}/sellers`, form);
      setModal(false);
      load();
    } catch (e: any) { setError(e?.response?.data?.error ?? "Error al guardar"); }
  };

  const toggleStatus = async (s: Seller) => {
    try {
      await api.put(`${basePath}/sellers/${s.id}`, { sellerCode: s.sellerCode, fullName: s.fullName, email: s.email, phoneE164: s.phoneE164, region: s.region, status: s.status === "active" ? "inactive" : "active" });
      load();
    } catch {}
  };

  const openAssign = (s: Seller) => { setAssignSeller(s); setAssignError(""); setAssignModal(true); };

  const assignCustomer = async (customerId: string) => {
    if (!assignSeller) return;
    setAssignError("");
    const c = customers.find(c => c.id === customerId);
    try {
      await api.put(`${basePath}/customers/${customerId}`, { customerCode: c?.customerCode ?? "", businessName: c?.businessName ?? "", assignedSellerId: assignSeller.id, region: c?.region ?? "", creditLimit: 0, status: "active" });
      load();
    } catch (e: any) { setAssignError(e?.response?.data?.error ?? "Error al asignar"); }
  };

  const unassignCustomer = async (customerId: string) => {
    const c = customers.find(x => x.id === customerId);
    try {
      await api.put(`${basePath}/customers/${customerId}`, { customerCode: c?.customerCode ?? "", businessName: c?.businessName ?? "", assignedSellerId: null, region: c?.region ?? "", creditLimit: 0, status: "active" });
      load();
    } catch {}
  };

  const sellerCustomers = (sellerId: string) => customers.filter(c => c.assignedSellerId === sellerId);

  const columns: ColumnDef<Seller>[] = [
    { header: "Código", accessorKey: "sellerCode" },
    { header: "Nombre", accessorKey: "fullName" },
    { header: "Email", accessorKey: "email" },
    { header: "Región", accessorKey: "region" },
    { header: "Estado", accessorKey: "status", cell: ({ getValue }) => <Badge variant={getValue() === "active" ? "success" : "warning"}>{getValue() === "active" ? "Activo" : "Inactivo"}</Badge> },
    { header: "Clientes", id: "count", cell: ({ row }) => <span className="text-sm">{sellerCustomers(row.original.id).length}</span> },
    { header: "Acciones", id: "actions", cell: ({ row }) => {
      const s = row.original;
      return (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>Editar</Button>
          <Button variant="ghost" size="sm" onClick={() => openAssign(s)}>Asignar</Button>
          <Button variant="ghost" size="sm" onClick={() => toggleStatus(s)}>{s.status === "active" ? "Desactivar" : "Activar"}</Button>
        </div>
      );
    }},
  ];

  if (loading) return <p className="p-8 text-muted-foreground">Cargando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Vendedores</h2>
        <Button onClick={openCreate}>Nuevo Vendedor</Button>
      </div>

      <DataTable columns={columns} data={sellers} searchable={true} pagination={true} />

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Editar Vendedor" : "Nuevo Vendedor"} description="Complete los datos. El código se genera automáticamente.">
        <div className="space-y-3">
          <Input id="fullName" label="Nombre completo" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <Input id="email" label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input id="phoneE164" label="Teléfono" value={form.phoneE164} onChange={(e) => setForm({ ...form, phoneE164: e.target.value })} />
          <div>
            <label className="text-sm font-medium mb-1 block">Región</label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
              <option value="">Sin región</option>
              {regionNames.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={save}>{editId ? "Guardar" : "Crear"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={assignModal} onClose={() => setAssignModal(false)} title={`Asignar Clientes — ${assignSeller?.fullName ?? ""}`} description={`Región: ${assignSeller?.region || "Sin región"}`}>
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {customers.map((c) => {
            const isAssigned = c.assignedSellerId === assignSeller?.id;
            const isAssignedToOther = c.assignedSellerId && c.assignedSellerId !== assignSeller?.id;
            const regionMismatch = assignSeller?.region && c.region && assignSeller.region !== c.region;
            return (
              <div key={c.id} className={`flex items-center justify-between border rounded-md px-3 py-2 ${regionMismatch ? "border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950" : ""}`}>
                <div>
                  <p className="text-sm font-medium">{c.businessName} <span className="text-xs text-muted-foreground font-mono">{c.customerCode}</span></p>
                  <p className="text-xs text-muted-foreground">Región: {c.region || "—"}</p>
                  {regionMismatch && <p className="text-xs text-yellow-600 font-medium">⚠ Fuera de región</p>}
                  {isAssignedToOther && <p className="text-xs text-blue-600">Asignado a otro vendedor</p>}
                </div>
                {isAssigned ? <Button variant="outline" size="sm" onClick={() => unassignCustomer(c.id)}>Quitar</Button> : <Button variant="ghost" size="sm" onClick={() => assignCustomer(c.id)}>Asignar</Button>}
              </div>
            );
          })}
          {assignError && <p className="text-sm text-destructive">{assignError}</p>}
          <Button variant="outline" className="w-full" onClick={() => setAssignModal(false)}>Cerrar</Button>
        </div>
      </Modal>
    </div>
  );
}
