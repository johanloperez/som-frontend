"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@repo/api";
import { Button, Badge, Input, DataTable, Modal, Tooltip, type FilterConfig } from "@repo/ui";
import type { ColumnDef } from "@tanstack/react-table";

interface Tenant {
  id: string;
  slug: string;
  displayName: string;
  legalName: string;
  subscriptionStatus: string;
  taxId?: string;
  country?: string;
  createdAt: string;
}

const statusVariant: Record<string, "success" | "warning" | "destructive" | "default"> = {
  active: "success",
  suspended: "warning",
  past_due: "warning",
  cancelled: "destructive",
  trial: "default",
  none: "default",
};

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function toCode(s: string) {
  return s.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ slug: "", displayName: "", legalName: "", taxId: "", providerCode: "", adminEmail: "", adminFullName: "" });
  const [slugTouched, setSlugTouched] = useState(false);
  const [codeTouched, setCodeTouched] = useState(false);
  const [generatedPwd, setGeneratedPwd] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try { const r = await api.get("/platform/tenants"); setTenants(r.data); } catch { }
  };

  useEffect(() => { load(); }, []);

  const [statusFilter, setStatusFilter] = useState("active");
  const filteredTenants = statusFilter ? tenants.filter(t => t.subscriptionStatus === statusFilter) : tenants;

  const openModal = () => {
    setForm({ slug: "", displayName: "", legalName: "", taxId: "", providerCode: "", adminEmail: "", adminFullName: "" });
    setSlugTouched(false);
    setCodeTouched(false);
    setGeneratedPwd("");
    setError("");
    setOpen(true);
  };

  const updateField = (field: string, value: string) => {
    const next = { ...form, [field]: value };
    if (field === "displayName" && !slugTouched) {
      next.slug = toSlug(value);
    }
    if (!codeTouched) {
      next.providerCode = toCode(next.slug);
    }
    setForm(next);
  };

  const create = async () => {
    setError("");
    try {
      const res = await api.post("/platform/tenants", form);
      setGeneratedPwd(res.data.adminPassword ?? "");
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Error al crear");
    }
  };

  const REASONS = ["Falta de pago", "Petición del usuario", "Otro"];

  const [statusTarget, setStatusTarget] = useState<Tenant | null>(null);
  const [statusAction, setStatusAction] = useState<"suspend" | "reactivate">("suspend");
  const [statusReason, setStatusReason] = useState("Falta de pago");
  const [statusReasonOther, setStatusReasonOther] = useState("");

  const openStatusModal = (t: Tenant, action: "suspend" | "reactivate") => {
    setStatusTarget(t);
    setStatusAction(action);
    setStatusReason(action === "suspend" ? "Falta de pago" : "Reactivación manual");
    setStatusReasonOther("");
    setError("");
  };

  const confirmStatusChange = async () => {
    if (!statusTarget) return;
    const reason = statusReason === "Otro" ? statusReasonOther : statusReason;
    const newStatus = statusAction === "suspend" ? "suspended" : "active";
    try {
      await api.put(`/platform/tenants/${statusTarget.id}/status`, { status: newStatus, reason });
      setStatusTarget(null);
      load();
    } catch (e: any) { setError(e?.response?.data?.error ?? "Error"); }
  };

  const cancelTenant = async (t: Tenant) => {
    if (!confirm(`¿Cancelar definitivamente a ${t.displayName}? Su suscripción se marcará como cancelada.`)) return;
    try { await api.delete(`/platform/tenants/${t.id}`); load(); } catch {}
  };

  const columns: ColumnDef<Tenant>[] = [
    { header: () => <Tooltip content="Nombre comercial del mayorista">Nombre</Tooltip>, accessorKey: "displayName" },
    { header: () => <Tooltip content="Identificador único usado en la URL (ej: mi-mayorista)">Slug</Tooltip>, accessorKey: "slug" },
    { header: () => <Tooltip content="Razón social registrada del mayorista">Legal</Tooltip>, accessorKey: "legalName" },
    {
      header: () => <Tooltip content="Estado de la suscripción del mayorista (activo, suspendido, etc.)">Estado</Tooltip>, accessorKey: "subscriptionStatus",
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return <Badge variant={statusVariant[v] ?? "default"}>{v}</Badge>;
      },
    },
    { header: () => <Tooltip content="Identificador fiscal según el país (RUC, RIF, NIF, CUIT, etc.)">ID Fiscal</Tooltip>, accessorKey: "taxId" },
    { header: () => <Tooltip content="País donde opera el mayorista">País</Tooltip>, accessorKey: "country" },
    { header: () => <Tooltip content="Fecha en que se registró el mayorista">Creado</Tooltip>, accessorKey: "createdAt" },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Link href={`/tenants/${row.original.id}`} className="text-sm text-primary hover:underline">Ver</Link>
          {row.original.subscriptionStatus === "active" || row.original.subscriptionStatus === "trial" || row.original.subscriptionStatus === "past_due" ? (
            <button onClick={() => openStatusModal(row.original, "suspend")} className="text-sm text-destructive hover:underline">Suspender</button>
          ) : row.original.subscriptionStatus === "suspended" ? (
            <button onClick={() => openStatusModal(row.original, "reactivate")} className="text-sm text-green-600 hover:underline">Reactivar</button>
          ) : null}
          {row.original.subscriptionStatus !== "cancelled" && (
            <button onClick={() => cancelTenant(row.original)} className="text-sm text-destructive hover:underline">Cancelar</button>
          )}
        </div>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      type: "select",
      column: "subscriptionStatus",
      label: "Estado",
      options: [
        { value: "active", label: "Activo" },
        { value: "suspended", label: "Suspendido" },
        { value: "past_due", label: "Vencido" },
        { value: "cancelled", label: "Cancelado" },
        { value: "trial", label: "Prueba" },
      ],
    },
    {
      type: "select",
      column: "country",
      label: "País",
      options: Array.from(new Set(tenants.map(t => t.country).filter(Boolean))).map(c => ({ value: c!, label: c! })),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">Tenants</h2>
        </div>
        <div className="flex items-center gap-3">
          <select className="border rounded-md px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="active">Activos</option>
            <option value="trial">Prueba</option>
            <option value="suspended">Suspendidos</option>
            <option value="cancelled">Cancelados</option>
            <option value="">Todos</option>
          </select>
          <Button onClick={openModal}>Nuevo Mayorista</Button>
        </div>
      </div>
      <DataTable columns={columns} data={filteredTenants} filters={filters} searchable={true} pagination={true} />

      <Modal open={open} onClose={() => { setOpen(false); setGeneratedPwd(""); }} title={generatedPwd ? "Mayorista Creado" : "Provisionar Mayorista"} description={generatedPwd ? "El mayorista fue creado exitosamente. Guarda esta contraseña, no se podrá recuperar después." : "Se creará una base de datos independiente y se configurará el acceso."}>
        {generatedPwd ? (
          <div className="space-y-4">
            <div className="rounded-md border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 p-4">
              <p className="text-sm font-medium mb-1 text-green-950 dark:text-green-100">Contraseña del Admin</p>
              <p className="text-lg font-mono font-bold select-all text-green-950 dark:text-white">{generatedPwd}</p>
            </div>
            <p className="text-sm text-muted-foreground">El admin fue creado con el email <strong>{form.adminEmail}</strong>. Deberá cambiar la contraseña al iniciar sesión.</p>
            <Button className="w-full" onClick={() => { setOpen(false); setGeneratedPwd(""); setForm({ slug: "", displayName: "", legalName: "", taxId: "", providerCode: "", adminEmail: "", adminFullName: "" }); setSlugTouched(false); setCodeTouched(false); load(); }}>Cerrar</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Input id="displayName" label="Nombre comercial" tooltip="Nombre público del mayorista. El slug y código se generan automáticamente." value={form.displayName} onChange={(e) => updateField("displayName", e.target.value)} />
            <Input id="slug" label="Slug" tooltip="Identificador único para la URL del mayorista. Se auto-genera, pero puedes editarlo." value={form.slug} onChange={(e) => { setSlugTouched(true); setForm({ ...form, slug: e.target.value }); if (!codeTouched) setForm(f => ({ ...f, providerCode: toCode(e.target.value) })); }} placeholder="mi-mayorista" />
            <Input id="legalName" label="Razón social" tooltip="Nombre legal registrado del mayorista" value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} />
            <Input id="taxId" label="ID Fiscal" tooltip="Identificador fiscal (RUC, RIF, NIF, CUIT, etc.)" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
            <Input id="providerCode" label="Código Proveedor" tooltip="Código interno para facturación. Se auto-genera, pero puedes editarlo." value={form.providerCode} onChange={(e) => { setCodeTouched(true); setForm({ ...form, providerCode: e.target.value }); }} />
            <Input id="adminFullName" label="Nombre admin" tooltip="Nombre completo del administrador del mayorista" value={form.adminFullName} onChange={(e) => setForm({ ...form, adminFullName: e.target.value })} />
            <Input id="adminEmail" label="Email admin" tooltip="Correo del administrador para iniciar sesión" type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={create} className="w-full">Crear Mayorista</Button>
          </div>
        )}
      </Modal>

      <Modal open={!!statusTarget} onClose={() => setStatusTarget(null)} title={statusAction === "suspend" ? "Suspender Mayorista" : "Reactivar Mayorista"} description={statusAction === "suspend" ? `¿Por qué se suspende ${statusTarget?.displayName}?` : `¿Por qué se reactiva ${statusTarget?.displayName}?`}>
        <div className="space-y-3">
          {statusAction === "suspend" ? (
            <p className="text-sm text-muted-foreground">El mayorista no podrá acceder ni ser contactado por clientes hasta que sea reactivado.</p>
          ) : (
            <p className="text-sm text-muted-foreground">El mayorista recuperará el acceso completo a la plataforma.</p>
          )}
          <div className="space-y-2">
            {REASONS.map((r) => (
              <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="reason" value={r} checked={statusReason === r} onChange={() => setStatusReason(r)} className="accent-primary" />
                {r}
              </label>
            ))}
            {statusReason === "Otro" && (
              <input className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Especifique el motivo..." value={statusReasonOther} onChange={(e) => setStatusReasonOther(e.target.value)} autoFocus />
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setStatusTarget(null)}>Cancelar</Button>
            <Button variant={statusAction === "suspend" ? "destructive" : "default"} onClick={confirmStatusChange} disabled={statusReason === "Otro" && !statusReasonOther.trim()}>
              {statusAction === "suspend" ? "Suspender" : "Reactivar"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
