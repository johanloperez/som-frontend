"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Modal, Input, Tooltip, useAuth, DataTable, type FilterConfig } from "@repo/ui";
import type { ColumnDef } from "@tanstack/react-table";

interface SubscriptionInfo {
  id: string;
  planName: string;
  monthlyPrice: number;
  yearlyPrice: number;
  status: string;
  startDate: string;
  currentPeriodEnd: string;
  billingType: string;
}

interface Invoice {
   invoiceId: string;
   invoiceNumber: string;
   totalAmount: number;
   status: string;
   dueDate: string;
   paidAt?: string;
   periodStart: string;
   periodEnd: string;
   receiptFileName?: string;
   receiptUploadedAt?: string;
 }

interface PaymentMethod {
  id: string;
  type: string;
  label: string;
  details: string;
  isDefault: boolean;
}

const statusDescriptions: Record<string, string> = {
  active: "Tu suscripción está activa. Disfrutas de acceso completo.",
  trial: "Período de prueba activo. Al finalizar se facturará el plan.",
  past_due: "Hay un pago pendiente. El acceso se suspenderá pronto.",
  suspended: "Tu acceso está suspendido. Contacta al administrador.",
  cancelled: "La suscripción fue cancelada.",
};

export default function BillingPage() {
  const { user } = useAuth();
  const slug = user?.tenantSlug;

 const [sub, setSub] = useState<SubscriptionInfo | null>(null);
   const [invoices, setInvoices] = useState<Invoice[]>([]);
   const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
   const [loading, setLoading] = useState(true);

   const [pmModal, setPmModal] = useState(false);
   const [pmType, setPmType] = useState("bank_transfer");
   const [pmLabel, setPmLabel] = useState("");
   const [pmDetailsObj, setPmDetailsObj] = useState<Record<string, string>>({});
   const [pmIsDefault, setPmIsDefault] = useState(false);
   const [error, setError] = useState("");

   // Upload receipt modal
   const [uploadModal, setUploadModal] = useState(false);
   const [uploadingInvoiceId, setUploadingInvoiceId] = useState<string | null>(null);
   const [uploadReceipt, setUploadReceipt] = useState<File | null>(null);
   const [uploadError, setUploadError] = useState("");
   const [uploadSuccess, setUploadSuccess] = useState("");

   // Download receipt
   const downloadReceipt = async (invoiceId: string) => {
     try {
       const res = await api.get(`${basePath}/billing/invoices/${invoiceId}/receipt`, {
         responseType: "blob"
       });
       const url = window.URL.createObjectURL(new Blob([res.data]));
       const link = document.createElement("a");
       link.href = url;
       link.setAttribute("download", `comprobante-${invoiceId}.${String(res.headers["content-type"] ?? "").includes("pdf") ? "pdf" : "jpg"}`);
       document.body.appendChild(link);
       link.click();
       link.remove();
     } catch (e: any) {
       setError(e?.response?.data?.error ?? "Error downloading receipt");
     }
   };

  const basePath = slug ? `/tenant/${slug}` : "";

 const load = async () => {
     if (!basePath) return;
     setLoading(true);
     try {
       const [subRes, invRes, pmRes] = await Promise.all([
         api.get(`${basePath}/subscription`).catch(() => null),
         api.get(`${basePath}/billing/invoices`).catch(() => ({ data: [] })),
         api.get(`${basePath}/billing/methods`).catch(() => ({ data: [] })),
       ]);
       setSub(subRes?.data ?? null);
       setInvoices(invRes.data);
       setPaymentMethods(pmRes.data);
     } catch {}
     setLoading(false);
   };

   const handleUploadReceipt = async () => {
     if (!uploadReceipt || !uploadingInvoiceId) return;
     
     try {
       setUploadError("");
       setUploadSuccess("");
       
       const formData = new FormData();
       formData.append("file", uploadReceipt);
       
       await api.post(`${basePath}/billing/invoices/${uploadingInvoiceId}/upload-receipt`, formData, {
         headers: {
           "Content-Type": "multipart/form-data",
         },
       });
       
       setUploadSuccess("Comprobante subido exitosamente");
       setUploadReceipt(null);
       setUploadingInvoiceId(null);
       setUploadModal(false);
       
       // Refresh data to show updated invoice status
       load();
     } catch (e: any) {
       setUploadError(e?.response?.data?.error ?? "Error uploading receipt");
     }
   };

   useEffect(() => { load(); }, [slug]);

  if (loading) return <p>Cargando...</p>;

  const invoiceColumns: ColumnDef<Invoice>[] = [
    { header: "N° Factura", accessorKey: "invoiceNumber", cell: ({ getValue }) => <span className="font-mono text-xs">{getValue() || "—"}</span> },
    { header: "Período", id: "period", cell: ({ row }) => `${new Date(row.original.periodStart).toLocaleDateString()} — ${new Date(row.original.periodEnd).toLocaleDateString()}` },
    { header: "Monto", accessorKey: "totalAmount", cell: ({ getValue }) => `$${getValue()}` },
    { header: "Vencimiento", accessorKey: "dueDate", cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString() },
    {
      header: "Estado",
      accessorKey: "status",
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return <Badge variant={v === "paid" ? "success" : v === "overdue" ? "destructive" : "warning"}>{v}</Badge>;
      },
    },
    {
      header: "Descargar",
      id: "download",
      cell: () => <Button variant="ghost" size="sm" disabled>PDF (próximamente)</Button>,
    },
    {
      header: "Comprobante",
      id: "receipt",
      cell: ({ row }) => {
        const inv = row.original;
        if (inv.status === "pending") {
          return (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUploadingInvoiceId(inv.invoiceId);
                setUploadModal(true);
                setUploadReceipt(null);
                setUploadError("");
                setUploadSuccess("");
              }}
            >
              Subir comprobante
            </Button>
          );
        }
        if (inv.receiptFileName) {
          return (
            <Button variant="ghost" size="sm" onClick={() => downloadReceipt(inv.invoiceId)}>
              Ver comprobante
            </Button>
          );
        }
        return <span className="text-xs text-muted-foreground">Sin comprobante</span>;
      },
    },
  ];

  const invoiceFilters: FilterConfig[] = [
    {
      type: "select",
      column: "status",
      label: "Estado",
      options: [
        { value: "pending", label: "Pendiente" },
        { value: "paid", label: "Pagada" },
        { value: "overdue", label: "Vencida" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Facturación</h2>

      {/* Subscription Summary */}
      {sub && (
        <Card>
          <CardHeader><CardTitle className="text-base">Resumen de Suscripción</CardTitle></CardHeader>
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
                <p className="text-xs text-muted-foreground mb-1">Próxima renovación</p>
                <p>{new Date(sub.currentPeriodEnd).toLocaleDateString()}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 italic">{statusDescriptions[sub.status]}</p>
          </CardContent>
        </Card>
      )}

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
                       <p className="text-xs text-muted-foreground">{pm.type === "bank_transfer" ? "Transferencia Bancaria" : "Tarjeta"}</p>
                     )}
                   </div>
                   <Button variant="ghost" size="sm" onClick={async () => {
                     try { await api.delete(`${basePath}/billing/methods/${pm.id}`); load(); } catch {}
                   }}>Eliminar</Button>
                 </div>
                    );
                  })}
            </div>
          )}
          <Button variant="outline" onClick={() => { setPmType("bank_transfer"); setPmLabel(""); setPmDetailsObj({}); setPmIsDefault(false); setPmModal(true); setError(""); }}>Agregar Método de Pago</Button>
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Historial de Pagos</CardTitle>
            <Button variant="ghost" size="sm" onClick={load}>Recargar</Button>
          </div>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay facturas registradas.</p>
          ) : (
            <DataTable columns={invoiceColumns} data={invoices} filters={invoiceFilters} searchable={true} pagination={true} />
          )}
        </CardContent>
      </Card>

      {/* Add Payment Method Modal */}
      <Modal open={pmModal} onClose={() => setPmModal(false)} title="Agregar Método de Pago" description="Registre un nuevo método de pago.">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">Tipo</label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={pmType} onChange={(e) => setPmType(e.target.value)}>
              <option value="bank_transfer">Transferencia Bancaria</option>
              <option value="credit_card">Tarjeta de Crédito/Débito</option>
            </select>
          </div>
          <Input id="pmLabel" label="Alias" value={pmLabel} onChange={(e) => setPmLabel(e.target.value)} placeholder="Cuenta principal" />
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
            Establecer como predeterminado
          </label>
{error && <p className="text-sm text-destructive">{error}</p>}
           <div className="flex gap-2 justify-end">
             <Button variant="outline" onClick={() => setPmModal(false)}>Cancelar</Button>
             <Button onClick={async () => {
               try {
                 await api.post(`${basePath}/billing/methods`, { type: pmType, label: pmLabel, details: JSON.stringify(pmDetailsObj), isDefault: pmIsDefault });
                 setPmModal(false);
                 load();
               } catch (e: any) { setError(e?.response?.data?.error ?? "Error"); }
             }}>Guardar</Button>
           </div>
         </div>
       </Modal>

       {/* Upload Receipt Modal */}
       <Modal open={uploadModal} onClose={() => {
         setUploadModal(false);
         setUploadReceipt(null);
         setUploadingInvoiceId(null);
         setUploadError("");
         setUploadSuccess("");
       }} title="Subir Comprobante de Pago" description="Suba el comprobante de pago para esta factura.">
         <div className="space-y-4">
           <div>
             <label className="text-sm font-medium mb-1 block">Archivo</label>
             <input
               type="file"
               accept=".pdf,.jpg,.jpeg,.png"
               className="w-full border rounded-md px-3 py-2 text-sm"
               onChange={(e) => {
                 if (e.target.files && e.target.files[0]) {
                   setUploadReceipt(e.target.files[0]);
                   setUploadError("");
                 }
               }}
             />
             {uploadReceipt && (
               <p className="text-xs text-muted-foreground mt-1">
                 {uploadReceipt.name} ({Math.round(uploadReceipt.size / 1024)} KB)
               </p>
             )}
           </div>
           
           {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
           {uploadSuccess && <p className="text-sm text-success">{uploadSuccess}</p>}
           
           <div className="flex gap-2 justify-end">
             <Button variant="outline" onClick={() => {
               setUploadModal(false);
               setUploadReceipt(null);
               setUploadingInvoiceId(null);
               setUploadError("");
               setUploadSuccess("");
             }}>Cancelar</Button>
             <Button 
               disabled={!uploadReceipt || uploadingInvoiceId === null || uploadSuccess}
               onClick={handleUploadReceipt}
             >
               {uploadSuccess ? "Subido" : "Subir Comprobante"}
             </Button>
           </div>
         </div>
       </Modal>
     </div>
   );
 }
