"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@repo/api";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Tooltip, Modal, Input } from "@repo/ui";

interface TenantDetail {
   id: string;
   slug: string;
   displayName: string;
   legalName: string;
   taxId?: string;
   country?: string;
   region?: string;
   city?: string;
   streetLine1?: string;
   postalCode?: string;
   createdAt: string;
   updatedAt?: string;
   adminEmail?: string;
   adminFullName?: string;
 }

interface Subscription {
  id: string;
  planId: string;
  planName: string;
  monthlyPrice: number;
  yearlyPrice: number;
  status: string;
  startDate: string;
  currentPeriodEnd: string;
  billingType: string;
  billingEmail?: string;
  pendingPlanId?: string;
  pendingPlanName?: string;
  pendingBillingType?: string;
  pendingChangeAt?: string;
}

interface BackupConfig {
  schedule?: string;
  retentionDays: number;
  lastBackupAt?: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
}

const CANCEL_REASONS = ["Insatisfecho con el servicio", "Costo demasiado alto", "Cambio de proveedor", "Cierre del negocio", "Otro"];

const statusDescriptions: Record<string, string> = {
  active: "La suscripción está activa. El mayorista tiene acceso completo a la plataforma.",
  trial: "Período de prueba activo. Al finalizar se facturará el plan seleccionado.",
  past_due: "Hay un pago pendiente. El acceso se suspenderá pronto si no se regulariza.",
  suspended: "El acceso del mayorista está suspendido. Reactivar para restaurar el acceso completo.",
  cancelled: "La suscripción fue cancelada y ya no está activa.",
};

export default function TenantDetailPage() {
  const params = useParams();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [backupCfg, setBackupCfg] = useState<BackupConfig | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [tab, setTab] = useState<"info" | "subscription" | "backups" | "billing">("info");
  const [resetModal, setResetModal] = useState(false);
  const [resetResult, setResetResult] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedBillingType, setSelectedBillingType] = useState("monthly");
  const [error, setError] = useState("");

  const REASONS = ["Falta de pago", "Petición del usuario", "Otro"];
  const [statusTarget, setStatusTarget] = useState<"suspend" | "reactivate" | null>(null);
  const [statusReason, setStatusReason] = useState("Falta de pago");
  const [statusReasonOther, setStatusReasonOther] = useState("");

  const [planModal, setPlanModal] = useState(false);
  const [planChangePlanId, setPlanChangePlanId] = useState("");
  const [planChangeBillingType, setPlanChangeBillingType] = useState("monthly");

  const [planApplyNow, setPlanApplyNow] = useState(true);

  const [cycleModal, setCycleModal] = useState(false);
  const [cycleNewBillingType, setCycleNewBillingType] = useState("");
  const [cycleApplyNow, setCycleApplyNow] = useState(true);

  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [cancelReasonOther, setCancelReasonOther] = useState("");

  const [invoices, setInvoices] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [pmModal, setPmModal] = useState(false);
  const [pmType, setPmType] = useState("bank_transfer");
  const [pmLabel, setPmLabel] = useState("");
  const [pmDetailsObj, setPmDetailsObj] = useState<Record<string, string>>({});
  const [pmIsDefault, setPmIsDefault] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [payInvoiceId, setPayInvoiceId] = useState("");
  const [payAmount, setPayAmount] = useState(0);
  const [payMethodId, setPayMethodId] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectInvoiceId, setRejectInvoiceId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [generateInvoiceOnAssign, setGenerateInvoiceOnAssign] = useState(true);

  const confirmStatusChange = async () => {
    if (!statusTarget || !tenant) return;
    const reason = statusReason === "Otro" ? statusReasonOther : statusReason;
    const newStatus = statusTarget === "suspend" ? "suspended" : "active";
    try {
      await api.put(`/platform/tenants/${tenantId}/status`, { status: newStatus, reason });
      setStatusTarget(null);
      load();
    } catch (e: any) { setError(e?.response?.data?.error ?? "Error"); }
  };

  // Edit tenant modal
const [editModal, setEditModal] = useState(false);
   const [editForm, setEditForm] = useState({ displayName: "", legalName: "", taxId: "", country: "", region: "", city: "", streetLine1: "", postalCode: "" });

   const openEditModal = () => {
     if (!tenant) return;
     setEditForm({
       displayName: tenant.displayName,
       legalName: tenant.legalName,
       taxId: tenant.taxId ?? "",
       country: tenant.country ?? "",
       region: tenant.region ?? "",
       city: tenant.city ?? "",
       streetLine1: tenant.streetLine1 ?? "",
       postalCode: tenant.postalCode ?? "",
     });
     setError("");
     setEditModal(true);
   };

   const saveTenant = async () => {
     setError("");
     try {
       const body: Record<string, string> = {};
       if (editForm.displayName !== tenant?.displayName) body.displayName = editForm.displayName;
       if (editForm.legalName !== tenant?.legalName) body.legalName = editForm.legalName;
       if (editForm.taxId !== (tenant?.taxId ?? "")) body.taxId = editForm.taxId;
       if (editForm.country !== (tenant?.country ?? "")) body.country = editForm.country;
       if (editForm.region !== (tenant?.region ?? "")) body.region = editForm.region;
       if (editForm.city !== (tenant?.city ?? "")) body.city = editForm.city;
       if (editForm.streetLine1 !== (tenant?.streetLine1 ?? "")) body.streetLine1 = editForm.streetLine1;
       if (editForm.postalCode !== (tenant?.postalCode ?? "")) body.postalCode = editForm.postalCode;
       await api.put(`/platform/tenants/${tenantId}`, body);
      setEditModal(false);
      load();
    } catch (e: any) { setError(e?.response?.data?.error ?? "Error al guardar"); }
  };

  const load = async () => {
    try {
      const [t, s, b, p] = await Promise.all([
        api.get(`/platform/tenants/${tenantId}`),
        api.get(`/platform/tenants/${tenantId}/subscription`).catch(() => null),
        api.get(`/platform/tenants/${tenantId}/backups/config`).catch(() => null),
        api.get("/platform/plans").catch(() => ({ data: [] as SubscriptionPlan[] })),
      ]);
      setTenant(t.data);
      setSub(s?.data ?? null);
      setBackupCfg(b?.data ?? null);
      setPlans(p.data);
      if (s?.data?.planId) setSelectedPlanId(s.data.planId);
      if (s?.data?.billingType) setSelectedBillingType(s.data.billingType);
    } catch { /* ignore */ }
  };

  const loadBilling = async () => {
    if (!sub) return;
    try {
      const [inv, up, pms] = await Promise.all([
        api.get(`/platform/tenants/${tenantId}/billing/invoices`).catch(() => ({ data: [] })),
        api.get(`/platform/tenants/${tenantId}/billing/upcoming`).catch(() => null),
        api.get(`/platform/tenants/${tenantId}/billing/methods`).catch(() => ({ data: [] })),
      ]);
      setInvoices(inv.data);
      setUpcoming(up?.data ?? null);
      setPaymentMethods(pms.data);
    } catch {}
  };

  useEffect(() => { if (sub) loadBilling(); }, [sub?.id]);

  useEffect(() => { load(); }, [tenantId]);

  const triggerBackup = async () => {
    try { await api.post(`/platform/tenants/${tenantId}/backups/trigger?type=manual`); } catch { /* ignore */ }
  };

  if (!tenant) return <p>Cargando...</p>;

  const tabs = [
    { key: "info", label: "Información", tooltip: "Datos generales del mayorista" },
    { key: "subscription", label: "Suscripción", tooltip: "Plan y estado de la suscripción actual" },
    { key: "backups", label: "Backups", tooltip: "Configuración y ejecución de copias de seguridad" },
    { key: "billing", label: "Facturación", tooltip: "Historial de pagos, facturas y métodos de pago" },
  ] as const;

  return (
    <div>
      <div className="text-sm text-muted-foreground mb-4">
        <Link href="/tenants" className="hover:text-foreground">Mayoristas</Link>
        <span className="mx-2">›</span>
        <span className="text-foreground">{tenant.displayName}</span>
      </div>

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-3xl font-bold">{tenant.displayName}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openEditModal}>Editar</Button>
        </div>
      </div>
      <p className="text-muted-foreground mb-4">/{tenant.slug} — <strong className="text-blue-700 font-mono">{tenant.code}</strong></p>

      <div className="flex gap-2 mb-6 border-b">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Tooltip content={t.tooltip}>{t.label}</Tooltip>
          </button>
        ))}
      </div>

{tab === "info" && (
         <div>
           <div className="grid grid-cols-2 gap-4">
             <Card><CardHeader><CardTitle className="text-sm"><Tooltip content="Nombre legal registrado del mayorista">Razón social</Tooltip></CardTitle></CardHeader><CardContent>{tenant.legalName}</CardContent></Card>
             <Card><CardHeader><CardTitle className="text-sm"><Tooltip content="Nombre comercial del mayorista">Nombre comercial</Tooltip></CardTitle></CardHeader><CardContent>{tenant.displayName}</CardContent></Card>
             <Card><CardHeader><CardTitle className="text-sm"><Tooltip content="Identificador fiscal (RUC, RIF, NIF, CUIT, etc.)">ID Fiscal</Tooltip></CardTitle></CardHeader><CardContent>{tenant.taxId ?? "—"}</CardContent></Card>
             <Card><CardHeader><CardTitle className="text-sm"><Tooltip content="Email del usuario administrador">Email administrador</Tooltip></CardTitle></CardHeader><CardContent>{tenant.adminEmail || "—"}</CardContent></Card>
             <Card><CardHeader><CardTitle className="text-sm"><Tooltip content="Nombre del usuario administrador">Nombre administrador</Tooltip></CardTitle></CardHeader><CardContent>{tenant.adminFullName || tenant.displayName}</CardContent></Card>
             <Card><CardHeader><CardTitle className="text-sm"><Tooltip content="País donde opera el mayorista">País</Tooltip></CardTitle></CardHeader><CardContent>{tenant.country ?? "—"}</CardContent></Card>
             <Card><CardHeader><CardTitle className="text-sm"><Tooltip content="Región/Estado donde opera el mayorista">Región</Tooltip></CardTitle></CardHeader><CardContent>{tenant.region ?? "—"}</CardContent></Card>
             <Card><CardHeader><CardTitle className="text-sm"><Tooltip content="Ciudad donde opera el mayorista">Ciudad</Tooltip></CardTitle></CardHeader><CardContent>{tenant.city ?? "—"}</CardContent></Card>
             <Card><CardHeader><CardTitle className="text-sm"><Tooltip content="Dirección">Dirección</Tooltip></CardTitle></CardHeader><CardContent>{tenant.streetLine1 || "—"}</CardContent></Card>
             <Card><CardHeader><CardTitle className="text-sm"><Tooltip content="Código postal">Código postal</Tooltip></CardTitle></CardHeader><CardContent>{tenant.postalCode || "—"}</CardContent></Card>
             <Card><CardHeader><CardTitle className="text-sm"><Tooltip content="Fecha de registro del mayorista">Fecha de registro</Tooltip></CardTitle></CardHeader><CardContent>{new Date(tenant.createdAt).toLocaleDateString()}</CardContent></Card>
           </div>
           <div className="mt-4 flex gap-2">
           <Button variant="outline" onClick={openEditModal}>Editar Datos</Button>
           <Button variant="outline" onClick={() => { setResetResult(""); setResetModal(true); }}>Restablecer Contraseña Admin</Button>
         </div>
         </div>
       )}

      {tab === "subscription" && (
        <div className="space-y-6">
          {sub ? (
            <>
              {/* Resumen */}
              <Card>
                <CardHeader><CardTitle className="text-base">Resumen</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Plan</p>
                      <p className="font-medium">{sub.planName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Estado</p>
                      <Badge variant={sub.status === "active" ? "success" : sub.status === "suspended" || sub.status === "past_due" ? "warning" : "destructive"}>{sub.status}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Monto</p>
                      <p>${sub.billingType === "yearly" ? `${sub.yearlyPrice}/año` : `${sub.monthlyPrice}/mes`}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Ciclo</p>
                      <p className="capitalize">{sub.billingType === "yearly" ? "Anual" : "Mensual"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Inicio</p>
                      <p>{new Date(sub.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Próximo cobro</p>
                      <p>{new Date(sub.currentPeriodEnd).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {sub.pendingPlanId && (
                    <div className="mt-3 p-3 rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Cambio programado</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Plan actual: <strong>{sub.planName}</strong> → Plan futuro: <strong>{sub.pendingPlanName ?? "—"}</strong>
                        {sub.pendingBillingType && sub.pendingBillingType !== sub.billingType && (
                          <> ({sub.pendingBillingType === "yearly" ? "Anual" : "Mensual"})</>
                        )}
                        <br />Vigente desde: <strong>{new Date(sub.pendingChangeAt!).toLocaleDateString()}</strong>
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-4 italic">{statusDescriptions[sub.status]}</p>
                </CardContent>
              </Card>

              {/* Modificar */}
              {(sub.status === "active" || sub.status === "trial" || sub.status === "past_due") && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Modificar</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" onClick={() => { setPlanChangePlanId(sub.planId); setPlanChangeBillingType(sub.billingType); setPlanApplyNow(true); setPlanModal(true); setError(""); }}>
                      Cambiar Plan
                    </Button>
                    <Button variant="outline" onClick={() => { setCycleNewBillingType(sub.billingType === "yearly" ? "monthly" : "yearly"); setCycleApplyNow(true); setCycleModal(true); setError(""); }}>
                      Cambiar Ciclo de Facturación
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Reactivar */}
              {sub.status === "suspended" && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Reactivar Suscripción</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">El mayorista recuperará el acceso completo a la plataforma.</p>
                    <Button onClick={() => { setStatusTarget("reactivate"); setStatusReason("Reactivación manual"); setStatusReasonOther(""); setError(""); }}>
                      Reactivar Suscripción
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Zona de Peligro */}
              {(sub.status === "active" || sub.status === "trial" || sub.status === "past_due" || sub.status === "suspended") && (
                <Card className="border-destructive/30">
                  <CardHeader><CardTitle className="text-base text-destructive">Zona de Peligro</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {(sub.status === "active" || sub.status === "trial" || sub.status === "past_due") && (
                      <Button variant="outline" onClick={() => { setStatusTarget("suspend"); setStatusReason("Falta de pago"); setStatusReasonOther(""); setError(""); }}>
                        Suspender Acceso
                      </Button>
                    )}
                    <Button variant="destructive" onClick={() => { setCancelReason(CANCEL_REASONS[0]); setCancelReasonOther(""); setCancelModal(true); setError(""); }}>
                      Cancelar Suscripción
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Cancelada */}
              {sub.status === "cancelled" && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Suscripción Cancelada</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Esta suscripción fue cancelada. Para activar el servicio, asigne un nuevo plan.</p>
                    <div className="flex flex-col gap-3">
                      <div className="mt-4 flex gap-2 items-center">
                        <select className="border rounded-md px-3 py-2 text-sm" value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}>
                          <option value="">Seleccionar plan...</option>
                          {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <select className="border rounded-md px-3 py-2 text-sm" value={selectedBillingType} onChange={(e) => setSelectedBillingType(e.target.value)}>
                          <option value="monthly">Mensual</option>
                          <option value="yearly">Anual</option>
                        </select>
                        <Button onClick={async () => {
                          try {
                            await api.post(`/platform/tenants/${tenantId}/subscription/assign`, { planId: selectedPlanId, billingType: selectedBillingType, applyNow: true });
                            load();
                          } catch {}
                        }}>Asignar Nuevo Plan</Button>
                      </div>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={generateInvoiceOnAssign} onChange={(e) => setGenerateInvoiceOnAssign(e.target.checked)} className="accent-primary" />
                        Generar primera factura al asignar
                      </label>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardHeader><CardTitle className="text-base">Asignar Plan</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Sin suscripción asignada. Seleccione un plan para activar el servicio.</p>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2 items-center">
                    <select className="border rounded-md px-3 py-2 text-sm" value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}>
                      <option value="">Seleccionar plan...</option>
                      {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select className="border rounded-md px-3 py-2 text-sm" value={selectedBillingType} onChange={(e) => setSelectedBillingType(e.target.value)}>
                      <option value="monthly">Mensual</option>
                      <option value="yearly">Anual</option>
                    </select>
                  <Button onClick={async () => {
                    try {
                      await api.post(`/platform/tenants/${tenantId}/subscription/assign`, { planId: selectedPlanId, billingType: selectedBillingType, applyNow: true });
                      if (generateInvoiceOnAssign) {
                        await api.post(`/platform/tenants/${tenantId}/billing/generate-invoice`, {}).catch(() => {});
                      }
                      load();
                    } catch {}
                  }}>Asignar Plan</Button>
                </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={generateInvoiceOnAssign} onChange={(e) => setGenerateInvoiceOnAssign(e.target.checked)} className="accent-primary" />
                    Generar primera factura al asignar
                  </label>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === "backups" && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm"><Tooltip content="Configuración de copias de seguridad automáticas">Configuración de Backup</Tooltip></CardTitle></CardHeader>
            <CardContent>
              {backupCfg ? (
                <div className="space-y-2">
                  <p className="text-sm">Schedule: {backupCfg.schedule ?? "No configurado"}</p>
                  <p className="text-sm">Retención: {backupCfg.retentionDays} días</p>
                  <p className="text-sm">Último backup: {backupCfg.lastBackupAt ? new Date(backupCfg.lastBackupAt).toLocaleString() : "Nunca"}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin configuración</p>
              )}
            </CardContent>
          </Card>
          <Button onClick={triggerBackup}>Ejecutar Backup Manual</Button>
        </div>
      )}

      {tab === "billing" && sub && (
        <div className="space-y-6">
          {/* Payment Methods */}
          <Card>
            <CardHeader><CardTitle className="text-base">Métodos de Pago</CardTitle></CardHeader>
            <CardContent>
              {paymentMethods.length === 0 ? (
                <p className="text-sm text-muted-foreground mb-3">No hay métodos de pago registrados.</p>
              ) : (
                <div className="space-y-2 mb-4">
                  {paymentMethods.map((pm) => {
                    const det = (() => { try { return JSON.parse(pm.details || "{}"); } catch { return {}; } })();
                    return (
                    <div key={pm.id} className="flex items-center justify-between rounded-md border px-4 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{pm.label} {pm.isDefault && <Badge variant="outline">Default</Badge>}</p>
                          {pm.type === "credit_card" && det.automaticDebit === "true" && (
                            <Badge variant="success">Débito automático</Badge>
                          )}
                        </div>
                        {pm.type === "credit_card" ? (
                          <p className="text-xs text-muted-foreground">
                            {det.cardBrand || "Tarjeta"} {det.cardNumber ? `•••• ${det.cardNumber.slice(-4)}` : ""}{det.expiry ? ` · Vence ${det.expiry}` : ""}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">{pm.type === "bank_transfer" ? "Transferencia Bancaria" : pm.type === "credit_card" ? "Tarjeta de Crédito/Débito" : "Tarjeta"}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={async () => {
                        try { await api.delete(`/platform/tenants/${tenantId}/billing/methods/${pm.id}`); loadBilling(); } catch {}
                      }}>Eliminar</Button>
                    </div>
                    );
                  })}
                </div>
              )}
              <Button variant="outline" onClick={() => { setPmType("bank_transfer"); setPmLabel(""); setPmDetailsObj({}); setPmIsDefault(false); setPmModal(true); setError(""); }}>Agregar Método de Pago</Button>
            </CardContent>
          </Card>

          {/* Upcoming Invoice */}
          <Card>
            <CardHeader><CardTitle className="text-base">Próximos Cobros</CardTitle></CardHeader>
            <CardContent>
              {upcoming ? (
                <div className="space-y-2">
                  <p className="text-sm">Plan: <strong>{upcoming.planName}</strong></p>
                  <p className="text-sm">Monto: <strong>${upcoming.amount}</strong> ({upcoming.billingType === "yearly" ? "Anual" : "Mensual"})</p>
                  <p className="text-sm">Fecha estimada: {new Date(upcoming.estimatedDate).toLocaleDateString()}</p>
                  <p className="text-sm">Período: {new Date(upcoming.periodStart).toLocaleDateString()} — {new Date(upcoming.periodEnd).toLocaleDateString()}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={async () => {
                    try { await api.post(`/platform/tenants/${tenantId}/billing/generate-invoice`, {}); loadBilling(); } catch (e: any) { setError(e?.response?.data?.error ?? "Error"); }
                  }}>Generar Factura Ahora</Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay información disponible.</p>
              )}
            </CardContent>
          </Card>

          {/* Invoice History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Historial de Pagos</CardTitle>
                <Button variant="ghost" size="sm" onClick={loadBilling}>Recargar</Button>
              </div>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay facturas registradas.</p>
              ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-4 font-medium">N° Factura</th>
                        <th className="pb-2 pr-4 font-medium">Período</th>
                        <th className="pb-2 pr-4 font-medium">Monto</th>
                        <th className="pb-2 pr-4 font-medium">Vencimiento</th>
                        <th className="pb-2 pr-4 font-medium">Estado</th>
                        <th className="pb-2 pr-4 font-medium">Comprobante</th>
                        <th className="pb-2 font-medium">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv: any) => (
                        <tr key={inv.invoiceId} className="border-b last:border-0">
                          <td className="py-2 pr-4 font-mono text-xs">{inv.invoiceNumber || "—"}</td>
                          <td className="py-2 pr-4">{new Date(inv.periodStart).toLocaleDateString()} — {new Date(inv.periodEnd).toLocaleDateString()}</td>
                          <td className="py-2 pr-4">${inv.totalAmount}</td>
                          <td className="py-2 pr-4">{new Date(inv.dueDate).toLocaleDateString()}</td>
                          <td className="py-2 pr-4">
                            <Badge variant={inv.status === "paid" ? "success" : inv.status === "rejected" ? "destructive" : inv.status === "overdue" ? "destructive" : "warning"}>{inv.status}</Badge>
                          </td>
                          <td className="py-2 pr-4">
                            {inv.receiptFileName ? (
                              <a href={`${api.defaults.baseURL}/platform/tenants/${tenantId}/billing/invoices/${inv.invoiceId}/receipt`} target="_blank" className="text-xs text-primary hover:underline">Ver</a>
                            ) : inv.status === "pending" ? (
                              <span className="text-xs text-muted-foreground">Pendiente</span>
                            ) : "—"}
                          </td>
                          <td className="py-2">
                            {inv.status === "pending" && inv.receiptFileName && (
                              <div className="flex gap-1">
                                <Button variant="outline" size="sm" onClick={() => { setPayInvoiceId(inv.invoiceId); setPayAmount(inv.totalAmount); setPayMethodId(""); setPayNotes(""); setPayModal(true); setError(""); }}>Confirmar</Button>
                                <Button variant="ghost" size="sm" onClick={() => { setRejectInvoiceId(inv.invoiceId); setRejectReason(""); setRejectModal(true); setError(""); }}>Rechazar</Button>
                              </div>
                            )}
                            {inv.status === "pending" && !inv.receiptFileName && (
                              <span className="text-xs text-muted-foreground">Esperando comprobante</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modales globales */}
      <Modal open={resetModal} onClose={() => { setResetModal(false); setResetResult(""); }} title={resetResult ? "Contraseña Restablecida" : "Restablecer Contraseña"} description={resetResult ? "La nueva contraseña se generó automáticamente. El admin deberá cambiarla al iniciar sesión." : "Se generará una nueva contraseña automáticamente."}>
        {resetResult ? (
          <div className="space-y-4">
            <div className="rounded-md border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 p-4">
              <p className="text-sm font-medium mb-1 text-green-950 dark:text-green-100">Nueva Contraseña</p>
              <p className="text-lg font-mono font-bold select-all text-green-950 dark:text-white">{resetResult}</p>
            </div>
            <Button className="w-full" onClick={() => { setResetModal(false); setResetResult(""); }}>Cerrar</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Se restablecerá la contraseña del administrador <strong>{tenant.displayName}</strong>.</p>
            <Button className="w-full" onClick={async () => {
              try {
                const res = await api.post(`/platform/tenants/${tenantId}/reset-password`);
                setResetResult(res.data.newPassword ?? "");
              } catch (e: any) { setError(e?.response?.data?.error ?? "Error"); }
            }}>Generar y Restablecer</Button>
          </div>
        )}
      </Modal>

      <Modal open={!!statusTarget} onClose={() => setStatusTarget(null)} title={statusTarget === "suspend" ? "Suspender Mayorista" : "Reactivar Mayorista"} description={statusTarget === "suspend" ? `¿Por qué se suspende ${tenant?.displayName}?` : `¿Por qué se reactiva ${tenant?.displayName}?`}>
        <div className="space-y-3">
          {statusTarget === "suspend" ? (
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
            <Button variant={statusTarget === "suspend" ? "destructive" : "default"} onClick={confirmStatusChange} disabled={statusReason === "Otro" && !statusReasonOther.trim()}>
              {statusTarget === "suspend" ? "Suspender" : "Reactivar"}
            </Button>
          </div>
        </div>
      </Modal>

<Modal open={editModal} onClose={() => setEditModal(false)} title="Editar Mayorista" description="Actualiza los datos generales del mayorista">
         <div className="space-y-3">
           <Input id="editDisplayName" label="Nombre comercial" value={editForm.displayName} onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })} />
           <Input id="editLegalName" label="Razón social" value={editForm.legalName} onChange={(e) => setEditForm({ ...editForm, legalName: e.target.value })} />
           <Input id="editTaxId" label="ID Fiscal" value={editForm.taxId} onChange={(e) => setEditForm({ ...editForm, taxId: e.target.value })} />
           <Input id="editCountry" label="País" value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} />
           <Input id="editRegion" label="Región" value={editForm.region} onChange={(e) => setEditForm({ ...editForm, region: e.target.value })} />
           <Input id="editCity" label="Ciudad" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
           <Input id="editStreetLine1" label="Dirección" value={editForm.streetLine1} onChange={(e) => setEditForm({ ...editForm, streetLine1: e.target.value })} />
           <Input id="editPostalCode" label="Código postal" value={editForm.postalCode} onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })} />
           {error && <p className="text-sm text-destructive">{error}</p>}
           <div className="flex gap-2 justify-end">
             <Button variant="outline" onClick={() => setEditModal(false)}>Cancelar</Button>
             <Button onClick={saveTenant}>Guardar</Button>
           </div>
         </div>
       </Modal>

      <Modal open={planModal} onClose={() => setPlanModal(false)} title="Cambiar Plan" description={`Seleccione el nuevo plan y ciclo de facturación para ${tenant?.displayName}.`}>
        <div className="space-y-3">
          {sub && <p className="text-xs text-muted-foreground">Plan actual: <strong>{sub.planName}</strong> ({sub.billingType === "yearly" ? "Anual" : "Mensual"}) — ${sub.billingType === "yearly" ? sub.yearlyPrice + "/año" : sub.monthlyPrice + "/mes"}</p>}
          <div>
            <label className="text-sm font-medium mb-1 block">Nuevo Plan</label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={planChangePlanId} onChange={(e) => setPlanChangePlanId(e.target.value)}>
              <option value="">Seleccionar...</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — ${p.monthlyPrice}/mes  (${p.yearlyPrice}/año)</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Ciclo de Facturación</label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={planChangeBillingType} onChange={(e) => setPlanChangeBillingType(e.target.value)}>
              <option value="monthly">Mensual</option>
              <option value="yearly">Anual</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">¿Cuándo aplicar el cambio?</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="planApply" checked={planApplyNow} onChange={() => setPlanApplyNow(true)} className="accent-primary" />
                Ahora — cobrar el nuevo plan inmediatamente
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="planApply" checked={!planApplyNow} onChange={() => setPlanApplyNow(false)} className="accent-primary" />
                Próximo ciclo — el cambio aplica desde <strong>{sub ? new Date(sub.currentPeriodEnd).toLocaleDateString() : ""}</strong>
              </label>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setPlanModal(false)}>Cancelar</Button>
            <Button onClick={async () => {
              try {
                await api.put(`/platform/tenants/${tenantId}/subscription/plan`, { planId: planChangePlanId, billingType: planChangeBillingType, applyNow: planApplyNow });
                setPlanModal(false);
                load();
              } catch (e: any) { setError(e?.response?.data?.error ?? "Error al cambiar plan"); }
            }}>Confirmar Cambio</Button>
          </div>
        </div>
      </Modal>

      <Modal open={cycleModal} onClose={() => setCycleModal(false)} title="Cambiar Ciclo de Facturación" description="Modifique el ciclo de facturación de la suscripción.">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Actual: <strong>{sub?.billingType === "yearly" ? "Anual" : "Mensual"}</strong> — ${sub?.billingType === "yearly" ? (sub?.yearlyPrice ?? 0) + "/año" : (sub?.monthlyPrice ?? 0) + "/mes"}</p>
          <div>
            <label className="text-sm font-medium mb-1 block">Nuevo Ciclo</label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={cycleNewBillingType} onChange={(e) => setCycleNewBillingType(e.target.value)}>
              <option value="monthly">Mensual</option>
              <option value="yearly">Anual</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">¿Cuándo aplicar el cambio?</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="cycleApply" checked={cycleApplyNow} onChange={() => setCycleApplyNow(true)} className="accent-primary" />
                Ahora — cobrar el nuevo ciclo inmediatamente
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="cycleApply" checked={!cycleApplyNow} onChange={() => setCycleApplyNow(false)} className="accent-primary" />
                Próximo ciclo — el cambio aplica desde <strong>{sub ? new Date(sub.currentPeriodEnd).toLocaleDateString() : ""}</strong>
              </label>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setCycleModal(false)}>Cancelar</Button>
            <Button onClick={async () => {
              try {
                await api.put(`/platform/tenants/${tenantId}/subscription/billing-type`, { billingType: cycleNewBillingType, applyNow: cycleApplyNow });
                setCycleModal(false);
                load();
              } catch (e: any) { setError(e?.response?.data?.error ?? "Error al cambiar ciclo"); }
            }}>Confirmar Cambio</Button>
          </div>
        </div>
      </Modal>

<Modal open={pmModal} onClose={() => setPmModal(false)} title="Agregar Método de Pago" description="Registre un método de referencia para las facturas.">
         <div className="space-y-3">
           <div>
             <label className="text-sm font-medium mb-1 block">Tipo</label>
             <select className="w-full border rounded-md px-3 py-2 text-sm" value={pmType} onChange={(e) => setPmType(e.target.value)}>
               <option value="bank_transfer">Transferencia Bancaria</option>
               <option value="credit_card">Tarjeta de Crédito/Débito</option>
               <option value="cash">Efectivo</option>
               <option value="check">Cheque</option>
               <option value="other">Otro</option>
             </select>
           </div>
           <Input id="pmLabel" label="Descripción" value={pmLabel} onChange={(e) => setPmLabel(e.target.value)} placeholder="Transferencia mensual, Pago en efectivo" />
           {pmType === "credit_card" && (
             <>
               <Input id="pmCardNumber" label="Número de tarjeta" value={pmDetailsObj.cardNumber || ""} onChange={(e) => setPmDetailsObj({ ...pmDetailsObj, cardNumber: e.target.value })} maxLength={19} placeholder="0000 0000 0000 0000" />
               <Input id="pmCardName" label="Nombre en la tarjeta" value={pmDetailsObj.cardholderName || ""} onChange={(e) => setPmDetailsObj({ ...pmDetailsObj, cardholderName: e.target.value })} placeholder="Como aparece en la tarjeta" />
               <div className="flex gap-2">
                 <Input id="pmExpiry" label="Vencimiento" value={pmDetailsObj.expiry || ""} onChange={(e) => setPmDetailsObj({ ...pmDetailsObj, expiry: e.target.value })} maxLength={5} placeholder="MM/AA" />
                 <Input id="pmCvv" label="CVV" value={pmDetailsObj.cvv || ""} onChange={(e) => setPmDetailsObj({ ...pmDetailsObj, cvv: e.target.value })} maxLength={4} placeholder="123" />
               </div>
               <Input id="pmCardBrand" label="Marca" value={pmDetailsObj.cardBrand || ""} onChange={(e) => setPmDetailsObj({ ...pmDetailsObj, cardBrand: e.target.value })} placeholder="Visa, Mastercard" />
               <label className="flex items-center gap-2 text-sm cursor-pointer mt-1">
                 <input type="checkbox" checked={pmDetailsObj.automaticDebit === "true"} onChange={(e) => setPmDetailsObj({ ...pmDetailsObj, automaticDebit: e.target.checked ? "true" : "false" })} className="accent-primary" />
                 Débito automático - Cobrar automáticamente al vencer
               </label>
             </>
           )}
           <label className="flex items-center gap-2 text-sm cursor-pointer">
             <input type="checkbox" checked={pmIsDefault} onChange={(e) => setPmIsDefault(e.target.checked)} className="accent-primary" />
             Establecer como método predeterminado
           </label>
           {error && <p className="text-sm text-destructive">{error}</p>}
           <div className="flex gap-2 justify-end">
             <Button variant="outline" onClick={() => setPmModal(false)}>Cancelar</Button>
             <Button onClick={async () => {
               try {
                 await api.post(`/platform/tenants/${tenantId}/billing/methods`, { type: pmType, label: pmLabel, details: JSON.stringify(pmDetailsObj), isDefault: pmIsDefault });
                 setPmModal(false);
                 loadBilling();
               } catch (e: any) { setError(e?.response?.data?.error ?? "Error al agregar método"); }
             }}>Guardar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={payModal} onClose={() => setPayModal(false)} title="Confirmar Pago" description="Confirme el pago de esta factura y renueve la suscripción.">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Factura: <strong>{invoices.find((i: any) => i.invoiceId === payInvoiceId)?.invoiceNumber || payInvoiceId}</strong></p>
          <Input id="payAmount" label="Monto pagado" type="number" value={String(payAmount)} onChange={(e) => setPayAmount(Number(e.target.value))} />
          <div>
            <label className="text-sm font-medium mb-1 block">Método de pago</label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={payMethodId} onChange={(e) => setPayMethodId(e.target.value)}>
              <option value="">Seleccionar (opcional)</option>
              {paymentMethods.map((pm: any) => <option key={pm.id} value={pm.id}>{pm.label}</option>)}
            </select>
          </div>
          <Input id="payNotes" label="Notas (opcional)" value={payNotes} onChange={(e) => setPayNotes(e.target.value)} placeholder="N° de referencia, observaciones..." />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setPayModal(false)}>Cancelar</Button>
            <Button onClick={async () => {
              try {
                await api.post(`/platform/tenants/${tenantId}/billing/invoices/${payInvoiceId}/confirm`, { amount: payAmount, paymentMethodId: payMethodId || null, notes: payNotes || null });
                setPayModal(false);
                loadBilling();
                load();
              } catch (e: any) { setError(e?.response?.data?.error ?? "Error al confirmar pago"); }
            }}>Confirmar Pago</Button>
          </div>
        </div>
      </Modal>

      <Modal open={rejectModal} onClose={() => setRejectModal(false)} title="Rechazar Pago" description="Indique el motivo del rechazo del comprobante.">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Factura: <strong>{(invoices as any[]).find((i: any) => i.invoiceId === rejectInvoiceId)?.invoiceNumber || rejectInvoiceId}</strong></p>
          <Input id="rejectReason" label="Motivo del rechazo" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Monto incorrecto, dato faltante, etc." />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setRejectModal(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={async () => {
              try {
                await api.post(`/platform/tenants/${tenantId}/billing/invoices/${rejectInvoiceId}/reject`, { reason: rejectReason });
                setRejectModal(false);
                loadBilling();
              } catch (e: any) { setError(e?.response?.data?.error ?? "Error al rechazar"); }
            }}>Rechazar Comprobante</Button>
          </div>
        </div>
      </Modal>

      <Modal open={cancelModal} onClose={() => setCancelModal(false)} title="Cancelar Suscripción" description={`¿Está seguro de cancelar la suscripción de ${tenant?.displayName}?`}>
        <div className="space-y-3">
          <p className="text-sm text-destructive font-medium">Esta acción no se puede deshacer. El mayorista perderá el acceso al finalizar el período actual.</p>
          <div className="space-y-2">
            <p className="text-sm font-medium">Motivo de cancelación</p>
            {CANCEL_REASONS.map((r) => (
              <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="cancelReason" value={r} checked={cancelReason === r} onChange={() => setCancelReason(r)} className="accent-primary" />
                {r}
              </label>
            ))}
            {cancelReason === "Otro" && (
              <input className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Especifique el motivo..." value={cancelReasonOther} onChange={(e) => setCancelReasonOther(e.target.value)} autoFocus />
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setCancelModal(false)}>No, mantener</Button>
            <Button variant="destructive" onClick={async () => {
              try {
                await api.post(`/platform/tenants/${tenantId}/subscription/cancel`);
                setCancelModal(false);
                load();
              } catch (e: any) { setError(e?.response?.data?.error ?? "Error al cancelar"); }
            }}>Sí, Cancelar Suscripción</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
