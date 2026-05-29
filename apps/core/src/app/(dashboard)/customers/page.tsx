"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Button, DataTable, Input, Modal, Tooltip, type FilterConfig } from "@repo/ui";
import type { ColumnDef } from "@tanstack/react-table";

interface Customer {
  id: string;
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
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    businessName: "",
    taxId: "",
    taxAddress: "",
    phoneE164: "",
    country: "",
    region: "",
    city: "",
    streetLine1: "",
    streetLine2: "",
    postalCode: "",
    creditScore: 0
  });
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const r = await api.get("/platform/customers");
      setCustomers(r.data);
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      fullName: "",
      email: "",
      businessName: "",
      taxId: "",
      taxAddress: "",
      phoneE164: "",
      country: "",
      region: "",
      city: "",
      streetLine1: "",
      streetLine2: "",
      postalCode: "",
      creditScore: 0
    });
    setOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      fullName: c.fullName,
      email: c.email || "",
      businessName: c.businessName || "",
      taxId: c.taxId || "",
      taxAddress: c.taxAddress || "",
      phoneE164: c.phoneE164 || "",
      country: c.country || "",
      region: c.region || "",
      city: c.city || "",
      streetLine1: c.streetLine1 || "",
      streetLine2: c.streetLine2 || "",
      postalCode: c.postalCode || "",
      creditScore: c.creditScore || 0
    });
    setOpen(true);
  };

  const save = async () => {
    setError("");
    try {
      if (editing) {
        await api.put(`/platform/customers/${editing.id}`, form);
      } else {
        await api.post("/platform/customers", form);
      }
      setOpen(false);
      load();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Error al guardar");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar cliente?")) return;
    try {
      await api.delete(`/platform/customers/${id}`);
      load();
    } catch {}
  };

  const columns: ColumnDef<Customer>[] = [
    { header: () => <Tooltip content="Nombre completo del cliente minorista">Nombre</Tooltip>, accessorKey: "fullName" },
    { header: () => <Tooltip content="Correo electrónico del cliente">Email</Tooltip>, accessorKey: "email" },
    { header: () => <Tooltip content="Nombre de la empresa del cliente">Empresa</Tooltip>, accessorKey: "businessName" },
    { header: () => <Tooltip content="Identificador fiscal (RUC, RIF, NIF, CUIT, etc.)">ID Fiscal</Tooltip>, accessorKey: "taxId" },
    { header: () => <Tooltip content="Dirección fiscal del cliente">Dir. Fiscal</Tooltip>, accessorKey: "taxAddress" },
    { header: () => <Tooltip content="Número de teléfono del cliente">Teléfono</Tooltip>, accessorKey: "phoneE164" },
    { header: () => <Tooltip content="País del cliente">País</Tooltip>, accessorKey: "country" },
    { header: () => <Tooltip content="Fecha de registro del cliente">Registrado</Tooltip>, accessorKey: "createdAt" },
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

  const filters: FilterConfig[] = [
    { type: "select", column: "country", label: "País", options: Array.from(new Set(customers.map(c => c.country).filter(Boolean))).map(c => ({ value: c!, label: c! })) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Clientes</h2>
        <Button onClick={openCreate}>Nuevo Cliente</Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Usuarios registrados como clientes desde la app.</p>
      <DataTable columns={columns} data={customers} filters={filters} searchable={true} pagination={true} />

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar Cliente" : "Nuevo Cliente"}>
        <div className="space-y-3">
          <Input id="fullName" label="Nombre completo" tooltip="Nombre completo del cliente" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <Input id="email" label="Email" tooltip="Correo electrónico del cliente" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input id="businessName" label="Empresa" tooltip="Nombre de la empresa del cliente" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
          <Input id="taxId" label="ID Fiscal" tooltip="Identificador fiscal (RUC, RIF, NIF, CUIT, etc.)" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
          <Input id="taxAddress" label="Dirección fiscal" tooltip="Dirección fiscal del cliente" value={form.taxAddress} onChange={(e) => setForm({ ...form, taxAddress: e.target.value })} />
          <Input id="phoneE164" label="Teléfono" tooltip="Número de teléfono del cliente" value={form.phoneE164} onChange={(e) => setForm({ ...form, phoneE164: e.target.value })} />
          <Input id="country" label="País" tooltip="País del cliente" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          <Input id="region" label="Región" tooltip="Región o estado del cliente" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
          <Input id="city" label="Ciudad" tooltip="Ciudad del cliente" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Input id="streetLine1" label="Dirección" tooltip="Dirección del cliente" value={form.streetLine1} onChange={(e) => setForm({ ...form, streetLine1: e.target.value })} />
          <Input id="streetLine2" label="Dirección 2" tooltip="Dirección adicional del cliente" value={form.streetLine2} onChange={(e) => setForm({ ...form, streetLine2: e.target.value })} />
          <Input id="postalCode" label="Código postal" tooltip="Código postal del cliente" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
          <Input id="creditScore" label="Score de crédito" tooltip="Puntuación de crédito del cliente" type="number" value={form.creditScore} onChange={(e) => setForm({ ...form, creditScore: Number(e.target.value) })} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={save} className="w-full">{editing ? "Actualizar" : "Crear"}</Button>
        </div>
      </Modal>
    </div>
  );
}
