"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Button, Badge, DataTable, Input, Modal, Tooltip, type FilterConfig } from "@repo/ui";
import type { ColumnDef } from "@tanstack/react-table";

interface Customer {
  id: string;
  ownerUserId?: string;
  fullName: string;
  email: string;
  businessName?: string;
  taxId?: string;
  taxAddress?: string;
  phoneE164?: string;
  country?: string;
  region?: string;
  city?: string;
  streetLine1?: string;
  streetLine2?: string;
  postalCode?: string;
  creditScore?: number;
  createdAt: string;
  userEmail?: string;
  userStatus?: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    fullName: "", email: "", businessName: "", taxId: "", taxAddress: "",
    phoneE164: "", country: "", region: "", city: "", streetLine1: "",
    streetLine2: "", postalCode: "", creditScore: 0
  });
  const [error, setError] = useState("");
  const [generatedPwd, setGeneratedPwd] = useState("");
  const [countries, setCountries] = useState<{ id: string; name: string; code: string }[]>([]);
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState("");

  const load = async () => {
    try { const r = await api.get("/platform/customers"); setCustomers(r.data); } catch {}
  };

  const loadCountries = async () => {
    try { const r = await api.get("/geography/countries"); setCountries(r.data); } catch {}
  };

  const loadRegions = async (countryId: string) => {
    if (!countryId) { setRegions([]); return; }
    try { const r = await api.get(`/geography/countries/${countryId}/regions`); setRegions(r.data); } catch { setRegions([]); }
  };

  useEffect(() => { load(); loadCountries(); }, []);

  const openCreate = () => {
    setEditing(null); setGeneratedPwd("");
    setForm({ fullName: "", email: "", businessName: "", taxId: "", taxAddress: "", phoneE164: "", country: "", region: "", city: "", streetLine1: "", streetLine2: "", postalCode: "", creditScore: 0 });
    setSelectedCountryId("");
    setRegions([]);
    setOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c); setGeneratedPwd("");
    setForm({ fullName: c.fullName, email: c.email || "", businessName: c.businessName || "", taxId: c.taxId || "", taxAddress: c.taxAddress || "", phoneE164: c.phoneE164 || "", country: c.country || "", region: c.region || "", city: c.city || "", streetLine1: c.streetLine1 || "", streetLine2: c.streetLine2 || "", postalCode: c.postalCode || "", creditScore: c.creditScore || 0 });
    setSelectedCountryId("");
    setRegions([]);
    setOpen(true);
  };

  const save = async () => {
    setError("");
    try {
      if (editing) {
        await api.put(`/platform/customers/${editing.id}`, form);
        setOpen(false); load();
      } else {
        const res = await api.post("/platform/customers", form);
        setGeneratedPwd(res.data.password);
      }
    } catch (e: any) { setError(e?.response?.data?.error ?? "Error al guardar"); }
  };

  const remove = async (id: string) => {
    try { await api.delete(`/platform/customers/${id}`); load(); } catch {}
  };

  const resetPwd = async (c: Customer) => {
    try {
      const res = await api.post(`/platform/customers/${c.id}/reset-password`);
      setGeneratedPwd(res.data.newPassword);
    } catch (e: any) { setError(e?.response?.data?.error ?? "Error"); }
  };

  const columns: ColumnDef<Customer>[] = [
    { header: "Nombre", accessorKey: "fullName", cell: ({ row }) => <span className="font-medium">{row.original.fullName}</span> },
    { header: "Email", accessorKey: "email" },
    { header: "Usuario", id: "user", cell: ({ row }) => {
      const c = row.original;
      return (
        <div>
          <p className="text-sm">{c.userEmail || "—"}</p>
          {c.userStatus && <Badge variant={c.userStatus === "active" ? "success" : "warning"}>{c.userStatus}</Badge>}
        </div>
      );
    }},
    { header: "Empresa", accessorKey: "businessName" },
    { header: "País", accessorKey: "country" },
    { header: "Registrado", accessorKey: "createdAt", cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString() },
    {
      id: "actions", cell: ({ row }) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => openEdit(row.original)}>Editar</Button>
          <Button size="sm" variant="ghost" onClick={() => resetPwd(row.original)}>Reset Pwd</Button>
          <Button size="sm" variant="ghost" onClick={() => remove(row.original.id)}>Eliminar</Button>
        </div>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    { type: "select", column: "country", label: "País", options: Array.from(new Set(customers.map(c => c.country).filter(Boolean))).map(c => ({ value: c!, label: c! })) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Clientes</h2>
        <Button onClick={openCreate}>Nuevo Cliente</Button>
      </div>

      {generatedPwd && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-950 dark:text-green-100">Contraseña generada</p>
              <p className="text-lg font-mono font-bold select-all text-green-950 dark:text-white">{generatedPwd}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setGeneratedPwd("")}>✕</Button>
          </div>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">Copia esta contraseña. No se podrá recuperar después.</p>
        </div>
      )}

      <DataTable columns={columns} data={customers} filters={filters} searchable={true} pagination={true} />

      <Modal open={open} onClose={() => { setOpen(false); setGeneratedPwd(""); }} title={editing ? "Editar Cliente" : "Nuevo Cliente"} description={editing ? "" : "Se creará un usuario y se generará una contraseña automáticamente."}>
        <div className="space-y-3">
          <Input id="fullName" label="Nombre completo" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <Input id="email" label="Email (será el usuario de login)" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input id="businessName" label="Empresa" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input id="taxId" label="ID Fiscal" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
            <Input id="phoneE164" label="Teléfono" value={form.phoneE164} onChange={(e) => setForm({ ...form, phoneE164: e.target.value })} />
          </div>
          <Input id="taxAddress" label="Dirección fiscal" value={form.taxAddress} onChange={(e) => setForm({ ...form, taxAddress: e.target.value })} />
          {!editing ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">País</label>
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={selectedCountryId}
                  onChange={(e) => {
                    const c = countries.find(x => x.id === e.target.value);
                    setSelectedCountryId(e.target.value);
                    setForm({ ...form, country: c?.name ?? "", region: "" });
                    loadRegions(e.target.value);
                  }}>
                  <option value="">Seleccionar país...</option>
                  {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Región</label>
                {regions.length > 0 ? (
                  <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}>
                    <option value="">Seleccionar región...</option>
                    {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                ) : (
                  <Input id="region" placeholder="Escribir región..." value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })} />
                )}
              </div>
              <Input id="city" label="Ciudad" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <Input id="country" label="País" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              <Input id="region" label="Región" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
              <Input id="city" label="Ciudad" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
          )}
          <Input id="streetLine1" label="Dirección" value={form.streetLine1} onChange={(e) => setForm({ ...form, streetLine1: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input id="streetLine2" label="Dirección 2" value={form.streetLine2} onChange={(e) => setForm({ ...form, streetLine2: e.target.value })} />
            <Input id="postalCode" label="Código postal" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
          </div>
          <Input id="creditScore" label="Score de crédito" type="number" value={form.creditScore || ""} onChange={(e) => setForm({ ...form, creditScore: Number(e.target.value) })} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editing ? "Guardar" : "Crear Cliente"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
