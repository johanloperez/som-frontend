"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { DataTable, Button, Modal, Input, Badge, useAuth, useRealtime, type FilterConfig } from "@repo/ui";
import type { ColumnDef } from "@tanstack/react-table";

interface Customer {
  id: string;
  customerCode: string;
  globalCustomerId?: string;
  businessName: string;
  tradeName?: string;
  taxId?: string;
  taxAddress?: string;
  email?: string;
  phoneE164?: string;
  assignedSellerId?: string;
  creditLimit: number;
  status: string;
  createdAt: string;
}

export default function WholesalerCustomersPage() {
  const { user } = useAuth();
  const slug = user?.tenantSlug ?? "";
  const basePath = slug ? `/tenant/${slug}` : "";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ businessName: "", tradeName: "", taxId: "", taxAddress: "", email: "", phoneE164: "", creditLimit: 0 });
  const [error, setError] = useState("");
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [createdCustomer, setCreatedCustomer] = useState<string>("");

  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const [linkModal, setLinkModal] = useState(false);
  const [linkTarget, setLinkTarget] = useState<Customer | null>(null);
  const [linkCodes, setLinkCodes] = useState<{ id: string; code: string; maxUses: number; usedCount: number; createdAt: string }[]>([]);
  const [linkResult, setLinkResult] = useState<{ code: string } | null>(null);
  const [linkMaxUses, setLinkMaxUses] = useState(1);

  const load = async () => {
    if (!slug) return;
    setLoading(true);
    try { const r = await api.get(`${basePath}/customers`); setCustomers(r.data); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [slug]);
  useRealtime("customer", "*", () => { load(); });

  const openCreate = () => {
    setEditId(null);
    setForm({ businessName: "", tradeName: "", taxId: "", taxAddress: "", email: "", phoneE164: "", creditLimit: 0 });
    setError("");
    setCreatedCode(null);
    setModal(true);
  };

  const openEdit = (c: Customer) => {
    setEditId(c.id);
    setForm({ businessName: c.businessName, tradeName: c.tradeName ?? "", taxId: c.taxId ?? "", taxAddress: c.taxAddress ?? "", email: c.email ?? "", phoneE164: c.phoneE164 ?? "", creditLimit: c.creditLimit });
    setError("");
    setModal(true);
  };

  const save = async () => {
    try {
      if (editId) {
        await api.put(`${basePath}/customers/${editId}`, { ...form, status: "active" });
        setModal(false);
        load();
      } else {
        const res = await api.post(`${basePath}/customers`, form);
        const newCustomer = res.data as Customer;
        const codeRes = await api.post(`${basePath}/customers/${newCustomer.id}/link-codes`, { maxUses: 1 });
        setCreatedCustomer(newCustomer.businessName);
        setCreatedCode(codeRes.data.code);
      }
    } catch (e: any) { setError(e?.response?.data?.error ?? "Error al guardar"); }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`${basePath}/customers/${deleteTarget.id}`);
      setDeleteTarget(null);
      load();
    } catch (e: any) { setError(e?.response?.data?.error ?? "Error al eliminar"); }
  };

  const openLinkCode = async (c: Customer) => {
    setLinkTarget(c);
    setLinkResult(null);
    setLinkMaxUses(1);
    setLinkModal(true);
    try {
      const res = await api.get(`${basePath}/customers/${c.id}/link-codes`);
      setLinkCodes(res.data);
    } catch { setLinkCodes([]); }
  };

  const generateLinkCode = async () => {
    if (!linkTarget) return;
    try {
      const res = await api.post(`${basePath}/customers/${linkTarget.id}/link-codes`, { maxUses: linkMaxUses });
      setLinkResult(res.data);
      const codesRes = await api.get(`${basePath}/customers/${linkTarget.id}/link-codes`);
      setLinkCodes(codesRes.data);
    } catch (e: any) { setError(e?.response?.data?.error ?? "Error al generar código"); }
  };

  const columns: ColumnDef<Customer>[] = [
    { header: "Código", accessorKey: "customerCode" },
    { header: "Razón Social", accessorKey: "businessName" },
    { header: "Nombre Comercial", accessorKey: "tradeName" },
    { header: "ID Fiscal", accessorKey: "taxId" },
    { header: "Email", accessorKey: "email" },
    { header: "Teléfono", accessorKey: "phoneE164" },
    {
      header: "Crédito", accessorKey: "creditLimit",
      cell: ({ getValue }) => `$${Number(getValue()).toFixed(2)}`,
    },
    {
      header: "Estado", accessorKey: "status",
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return <Badge variant={v === "active" ? "success" : v === "suspended" ? "destructive" : "warning"}>{v}</Badge>;
      },
    },
    {
      header: "Vinculación", id: "linkStatus",
      cell: ({ row }) => {
        const linked = !!row.original.globalCustomerId;
        return <Badge variant={linked ? "success" : "warning"}>{linked ? "Vinculado" : "Pendiente"}</Badge>;
      },
    },
    {
      header: "Acciones", id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}>Editar</Button>
          {!row.original.globalCustomerId && (
            <Button variant="ghost" size="sm" onClick={() => openLinkCode(row.original)}>Código</Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(row.original)}>Eliminar</Button>
        </div>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      type: "select", column: "status", label: "Estado",
      options: Array.from(new Set(customers.map(c => c.status).filter(Boolean))).map(s => ({ value: s, label: s })),
    },
  ];

  if (loading) return <p className="p-8 text-muted-foreground">Cargando...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Clientes</h2>
        <Button onClick={openCreate}>Nuevo Cliente</Button>
      </div>
      <DataTable columns={columns} data={customers} filters={filters} searchable={true} pagination={true} />

      <Modal open={modal} onClose={() => { setModal(false); setCreatedCode(null); }} title={createdCode ? "Cliente Creado" : editId ? "Editar Cliente" : "Nuevo Cliente"} description={createdCode ? "El cliente fue creado. Comparte este código para que se vincule." : "Complete los datos del cliente."}>
        {createdCode ? (
          <div className="space-y-4">
            <div className="rounded-md border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 p-4">
              <p className="text-sm font-medium mb-1 text-green-950 dark:text-green-100">Código de Vinculación — {createdCustomer}</p>
              <p className="text-lg font-mono font-bold select-all text-green-950 dark:text-white">{createdCode}</p>
            </div>
            <Button className="w-full" onClick={() => { setModal(false); setCreatedCode(null); load(); }}>Cerrar</Button>
          </div>
        ) : (
        <div className="space-y-3">
          <Input id="businessName" label="Razón Social" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
          <Input id="tradeName" label="Nombre Comercial" value={form.tradeName} onChange={(e) => setForm({ ...form, tradeName: e.target.value })} />
          <Input id="taxId" label="ID Fiscal" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
          <Input id="taxAddress" label="Dir. Fiscal" value={form.taxAddress} onChange={(e) => setForm({ ...form, taxAddress: e.target.value })} />
          <Input id="email" label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input id="phoneE164" label="Teléfono" value={form.phoneE164} onChange={(e) => setForm({ ...form, phoneE164: e.target.value })} />
          <Input id="creditLimit" label="Límite Crédito" type="number" value={String(form.creditLimit)} onChange={(e) => setForm({ ...form, creditLimit: Number(e.target.value) })} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={save}>{editId ? "Guardar Cambios" : "Crear Cliente"}</Button>
          </div>
        </div>
        )}
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Eliminar Cliente" description="¿Estás seguro de eliminar este cliente?">
        <div className="space-y-3">
          <p className="text-sm"><strong>{deleteTarget?.customerCode}</strong> — {deleteTarget?.businessName}</p>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={remove}>Eliminar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={linkModal} onClose={() => { setLinkModal(false); setLinkResult(null); }} title={`Códigos de Vinculación — ${linkTarget?.businessName}`} description="Los códigos permiten que un cliente minorista se vincule a este mayorista.">
        <div className="space-y-4">
          {linkResult && (
            <div className="rounded-md border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 p-4">
              <p className="text-sm font-medium mb-1 text-green-950 dark:text-green-100">Nuevo Código Generado</p>
              <p className="text-lg font-mono font-bold select-all text-green-950 dark:text-white">{linkResult.code}</p>
            </div>
          )}
          {linkCodes.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Códigos existentes</p>
              {linkCodes.map((lc) => (
                <div key={lc.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div>
                    <p className="font-mono text-sm font-bold select-all">{lc.code}</p>
                    <p className="text-xs text-muted-foreground">
                      Usos: {lc.usedCount}/{lc.maxUses} · {new Date(lc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${lc.usedCount >= lc.maxUses ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"}`}>
                    {lc.usedCount >= lc.maxUses ? "Agotado" : "Activo"}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="border-t pt-3">
            <p className="text-sm font-medium mb-2">Generar nuevo código</p>
            <div className="flex gap-2 items-end">
              <Input id="linkMaxUses" label="Usos máx." type="number" value={String(linkMaxUses)} onChange={(e) => setLinkMaxUses(Number(e.target.value))} />
              <Button onClick={generateLinkCode}>Generar</Button>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button variant="outline" className="w-full" onClick={() => { setLinkModal(false); setLinkResult(null); }}>Cerrar</Button>
        </div>
      </Modal>
    </div>
  );
}
