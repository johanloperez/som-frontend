"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@repo/api";
import { Button, Badge, Input, DataTable, Modal, Tooltip, Stepper, useToast, useRealtime, type FilterConfig } from "@repo/ui";
import type { ColumnDef } from "@tanstack/react-table";

interface Tenant {
  id: string;
  code: string;
  slug: string;
  displayName: string;
  legalName: string;
  subscriptionStatus: string;
  taxId?: string;
  country?: string;
  createdAt: string;
}

interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
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

interface CountryData { id: string; name: string; code: string; }
interface RegionData { id: string; name: string; }

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ displayName: "", legalName: "", taxId: "", adminEmail: "", adminFullName: "", country: "", region: "", city: "", streetLine1: "", postalCode: "" });
  const [planId, setPlanId] = useState<string>("");
  const [paymentType, setPaymentType] = useState("bank_transfer");
  const [paymentLabel, setPaymentLabel] = useState("");
  const [generatedPwd, setGeneratedPwd] = useState("");
  const [credentials, setCredentials] = useState<{ email: string; password: string; tenantCode?: string } | null>(null);
  const [sendEmail, setSendEmail] = useState(false);
  const [error, setError] = useState("");
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState("");
  const [step, setStep] = useState(0);

  const load = async () => {
    try { const r = await api.get("/platform/tenants"); setTenants(r.data); } catch { }
  };

  const loadPlans = async () => {
    try { const r = await api.get("/platform/plans"); setPlans(r.data); } catch { }
  };

  const loadCountries = async () => {
    try { const r = await api.get("/geography/countries"); setCountries(r.data); } catch { }
  };

  const loadRegions = async (countryId: string) => {
    if (!countryId) { setRegions([]); return; }
    try { const r = await api.get(`/geography/countries/${countryId}/regions`); setRegions(r.data); } catch { setRegions([]); }
  };

  useEffect(() => { load(); loadPlans(); loadCountries(); }, []);
  useRealtime("tenant", "*", () => { load(); });

  const [statusFilter, setStatusFilter] = useState("active");
  const filteredTenants = statusFilter ? tenants.filter(t => t.subscriptionStatus === statusFilter) : tenants;

  const openModal = () => {
    setForm({ displayName: "", legalName: "", taxId: "", adminEmail: "", adminFullName: "", country: "", region: "", city: "", streetLine1: "", postalCode: "" });
    setPlanId(plans[0]?.id ?? "");
    setPaymentType("bank_transfer");
    setPaymentLabel("");
    setError("");
    setSelectedCountryId("");
    setRegions([]);
    setStep(0);
    setOpen(true);
  };

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const create = async () => {
    setError("");
    if (!form.displayName.trim()) { setError("El nombre comercial es requerido"); return; }
    if (!form.adminEmail.trim()) { setError("El email del administrador es requerido"); return; }
    if (!form.adminFullName.trim()) { setError("El nombre del administrador es requerido"); return; }
    if (planId && !paymentLabel.trim()) { setError("La referencia del método de pago es requerida"); return; }
    try {
      const slug = toSlug(form.displayName);
      const res = await api.post("/platform/tenants", {
        slug,
        displayName: form.displayName,
        legalName: form.legalName,
        taxId: form.taxId || undefined,
        providerCode: slug,
        adminEmail: form.adminEmail,
        adminFullName: form.adminFullName,
        planId: planId || undefined,
        sendEmail,
        paymentMethod: planId ? { type: paymentType, label: paymentLabel, isDefault: true } : undefined,
        country: form.country || undefined,
        region: form.region || undefined,
        city: form.city || undefined,
        streetLine1: form.streetLine1 || undefined,
        postalCode: form.postalCode || undefined,
      });
      const creds = res.data?.credentials;
      if (creds) {
        setCredentials({ email: creds.email, password: creds.password, tenantCode: creds.tenantCode });
        setGeneratedPwd(creds.password);
      } else {
        setGeneratedPwd(res.data?.adminPassword ?? "");
      }
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
    { header: () => <Tooltip content="Código único del mayorista para login (ej: WH8XK92A)">Código</Tooltip>, accessorKey: "code" },
    { header: () => <Tooltip content="Nombre comercial del mayorista">Nombre</Tooltip>, accessorKey: "displayName" },
    { header: () => <Tooltip content="Identificador único">Slug</Tooltip>, accessorKey: "slug" },
    {
      header: () => <Tooltip content="Estado de la suscripción del mayorista (activo, suspendido, etc.)">Estado</Tooltip>, accessorKey: "subscriptionStatus",
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return <Badge variant={statusVariant[v] ?? "default"}>{v}</Badge>;
      },
    },
    { header: () => <Tooltip content="Identificador fiscal según el país">ID Fiscal</Tooltip>, accessorKey: "taxId" },
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
        { value: "active", label: "Activos" },
        { value: "trial", label: "Prueba" },
        { value: "suspended", label: "Suspendidos" },
        { value: "cancelled", label: "Cancelados" },
      ],
    },
    {
      type: "select",
      column: "country",
      label: "País",
      options: Array.from(new Set(tenants.map(t => t.country).filter(Boolean))).map(c => ({ value: c!, label: c! })),
    },
  ];

  const closeAndReset = () => {
    setOpen(false);
    setGeneratedPwd("");
    setCredentials(null);
    setForm({ displayName: "", legalName: "", taxId: "", adminEmail: "", adminFullName: "", country: "", region: "", city: "", streetLine1: "", postalCode: "" });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="border rounded-md px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="active">Activos</option>
            <option value="trial">Prueba</option>
            <option value="suspended">Suspendidos</option>
            <option value="past_due">Morosos</option>
            <option value="cancelled">Cancelados</option>
            <option value="">Todos</option>
          </select>
          <Button onClick={openModal}>Nuevo Mayorista</Button>
        </div>
      </div>
      <DataTable columns={columns} data={filteredTenants} filters={filters} searchable pagination />

      <Modal open={open} onClose={closeAndReset} title={generatedPwd ? "Mayorista Creado" : "Provisionar Mayorista"} description={generatedPwd ? "Guarda estas credenciales. No se mostrarán de nuevo." : "Completa los datos para crear el mayorista."}>
        {generatedPwd ? (
          <SuccessView
            credentials={credentials}
            onClose={closeAndReset}
          />
        ) : (
          <div className="space-y-3">
            <Stepper
              steps={[
                { label: "Empresa", description: "Datos del negocio" },
                { label: "Admin", description: "Cuenta del administrador" },
                { label: "Dirección", description: "Ubicación" },
                { label: "Plan", description: "Suscripción y pago" },
              ]}
              current={step}
            />

            {step === 0 && (
              <div className="space-y-3">
                <Input id="displayName" label="Nombre comercial *" tooltip="Nombre público del mayorista. El slug se genera automáticamente." value={form.displayName} onChange={(e) => updateField("displayName", e.target.value)} />
                <Input id="legalName" label="Razón social" tooltip="Nombre legal registrado del mayorista" value={form.legalName} onChange={(e) => updateField("legalName", e.target.value)} />
                <Input id="taxId" label="ID Fiscal" tooltip="RUC, RIF, NIF, CUIT, etc." value={form.taxId} onChange={(e) => updateField("taxId", e.target.value)} />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <Input id="adminFullName" label="Nombre admin *" tooltip="Nombre completo del administrador del mayorista" value={form.adminFullName} onChange={(e) => updateField("adminFullName", e.target.value)} />
                <Input id="adminEmail" label="Email admin *" tooltip="Correo del administrador para login. Recibirá las credenciales." type="email" value={form.adminEmail} onChange={(e) => updateField("adminEmail", e.target.value)} />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">País</label>
                    <select className="w-full border rounded-md px-3 py-2 text-sm" value={selectedCountryId} onChange={(e) => { const c = countries.find(x => x.id === e.target.value); setSelectedCountryId(e.target.value); setForm({ ...form, country: c?.name ?? "", region: "" }); loadRegions(e.target.value); }}>
                      <option value="">Seleccionar...</option>
                      {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Región</label>
                    {regions.length > 0 ? (
                      <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
                        <option value="">Seleccionar...</option>
                        {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                      </select>
                    ) : (
                      <input className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Escribir región..." value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
                    )}
                  </div>
                </div>
                <Input id="city" label="Ciudad" tooltip="Ciudad del mayorista" value={form.city} onChange={(e) => updateField("city", e.target.value)} />
                <Input id="streetLine1" label="Dirección" tooltip="Dirección fiscal" value={form.streetLine1} onChange={(e) => updateField("streetLine1", e.target.value)} />
                <Input id="postalCode" label="Código Postal" tooltip="Código postal" value={form.postalCode} onChange={(e) => updateField("postalCode", e.target.value)} />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Plan</label>
                  <select className="w-full border rounded-md px-3 py-2 text-sm" value={planId} onChange={(e) => setPlanId(e.target.value)}>
                    <option value="">Sin plan (trial)</option>
                    {plans.map(p => (<option key={p.id} value={p.id}>{p.name} — ${p.monthlyPrice}/mes</option>))}
                  </select>
                </div>
                {planId && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Método de pago *</label>
                      <select className="w-full border rounded-md px-3 py-2 text-sm" value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                        <option value="bank_transfer">Transferencia bancaria</option>
                        <option value="credit_card">Tarjeta de crédito</option>
                        <option value="debit_card">Tarjeta de débito</option>
                        <option value="cash">Efectivo</option>
                        <option value="other">Otro</option>
                      </select>
                    </div>
                    <Input id="paymentLabel" label="Referencia / Etiqueta *" tooltip="Ej: Banco Provincial Cta 1234, o nombre de la tarjeta" value={paymentLabel} onChange={(e) => setPaymentLabel(e.target.value)} />
                  </div>
                )}
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="accent-primary" />
                  Enviar credenciales por email al administrador
                </label>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2 justify-between pt-2">
              <div>
                {step > 0 && (
                  <Button variant="outline" onClick={() => setStep(s => s - 1)}>
                    Anterior
                  </Button>
                )}
              </div>
              {step < 3 ? (
                <Button onClick={() => setStep(s => s + 1)}>
                  Siguiente
                </Button>
              ) : (
                <Button onClick={create} className="min-w-[140px]">
                  Crear Mayorista
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!statusTarget} onClose={() => setStatusTarget(null)} title={statusAction === "suspend" ? "Suspender Mayorista" : "Reactivar Mayorista"} description={statusAction === "suspend" ? `¿Por qué se suspende a ${statusTarget?.displayName}?` : `¿Por qué se reactiva a ${statusTarget?.displayName}?`}>
        <div className="space-y-3">
          {statusAction === "suspend" ? (
            <p className="text-sm text-muted-foreground">El mayorista no podrá acceder a la plataforma hasta ser reactivado.</p>
          ) : (
            <p className="text-sm text-muted-foreground">El mayorista recuperará el acceso completo.</p>
          )}
          <div className="space-y-2">
            {REASONS.map((r) => (
              <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="reason" value={r} checked={statusReason === r} onChange={() => setStatusReason(r)} className="accent-primary" />
                {r}
              </label>
            ))}
            {statusReason === "Otro" && (
              <input className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Motivo..." value={statusReasonOther} onChange={(e) => setStatusReasonOther(e.target.value)} autoFocus />
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

function SuccessView({ credentials, onClose }: { credentials: { email: string; password: string; tenantCode?: string } | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  if (!credentials) return null;

  const fullText = [
    "Credenciales de acceso",
    "",
    `Email: ${credentials.email}`,
    `Contraseña: ${credentials.password}`,
    credentials.tenantCode ? `Código de mayorista: ${credentials.tenantCode}` : null,
    "Guarda estas credenciales. No podrás ver la contraseña de nuevo.",
  ].filter(Boolean).join("\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Email</span>
          <span className="font-mono font-medium">{credentials.email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Contraseña</span>
          <span className="font-mono font-medium">{credentials.password}</span>
        </div>
        {credentials.tenantCode && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Código mayorista</span>
            <span className="font-mono font-bold text-blue-600">{credentials.tenantCode}</span>
          </div>
        )}
      </div>
      <p className="text-amber-700 bg-amber-50 dark:bg-amber-950 dark:text-amber-300 rounded-lg p-3 text-sm">
        Guarda estas credenciales. No podrás ver la contraseña de nuevo.
      </p>
      <div className="flex gap-2">
        <Button className="flex-1" variant="outline" onClick={handleCopy}>
          {copied ? "¡Copiado!" : "Copiar credenciales"}
        </Button>
        <Button className="flex-1" onClick={onClose}>Entendido</Button>
      </div>
    </div>
  );
}
