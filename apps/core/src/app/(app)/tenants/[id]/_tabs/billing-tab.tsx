"use client";

import { Check, CreditCard, Plus, Star, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Dialog } from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Select } from "@repo/ui/select";
import { useToast } from "@repo/ui/toast";
import { billingApi, type BillingInvoice } from "@/lib/api-services";
import { useData, useDataItem } from "@/lib/use-api";

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const methodTypeOptions = [
  { value: "bank_transfer", label: "Transferencia bancaria" },
  { value: "card", label: "Tarjeta" },
  { value: "cash", label: "Efectivo" },
  { value: "other", label: "Otro" },
];
const methodTypeLabel = (type: string) =>
  methodTypeOptions.find((o) => o.value === type)?.label ?? type;

const invoiceStatusBadge: Record<string, React.ReactNode> = {
  paid: <Badge variant="success">Pagada</Badge>,
  pending: <Badge variant="warning">Pendiente</Badge>,
  rejected: <Badge variant="destructive">Rechazada</Badge>,
  overdue: <Badge variant="destructive">Vencida</Badge>,
};

export function BillingTab({ tenantId, tenantName }: { tenantId: string; tenantName: string }) {
  const toast = useToast();
  const { data: invoices = [], refetch: refetchInvoices } = useData(() => billingApi.invoices(tenantId), [tenantId]);
  const { data: methods = [], refetch: refetchMethods } = useData(() => billingApi.methods(tenantId), [tenantId]);
  const { data: upcoming, error: upcomingError } = useDataItem(() => billingApi.upcoming(tenantId), tenantId);

  const [addOpen, setAddOpen] = useState(false);
  const [method, setMethod] = useState({ type: "bank_transfer", label: "", details: "" });

  async function addMethod() {
    try {
      await billingApi.addMethod(tenantId, {
        type: method.type,
        label: method.label,
        details: method.details || undefined,
        isDefault: methods.length === 0,
      });
      setAddOpen(false);
      setMethod({ type: "bank_transfer", label: "", details: "" });
      refetchMethods();
      toast.success("Método de pago agregado", method.label);
    } catch (e) {
      toast.error("No se pudo agregar el método", e instanceof Error ? e.message : "Inténtalo de nuevo");
    }
  }

  async function confirmInvoice(inv: BillingInvoice) {
    try {
      await billingApi.confirm(tenantId, inv.id, inv.amount);
      refetchInvoices();
      toast.success("Pago confirmado", inv.number);
    } catch (e) {
      toast.error("No se pudo confirmar", e instanceof Error ? e.message : "Inténtalo de nuevo");
    }
  }

  async function rejectInvoice(inv: BillingInvoice) {
    try {
      await billingApi.reject(tenantId, inv.id, "Rechazado por el administrador");
      refetchInvoices();
      toast.success("Pago rechazado", inv.number);
    } catch (e) {
      toast.error("No se pudo rechazar", e instanceof Error ? e.message : "Inténtalo de nuevo");
    }
  }

  async function generateInvoice() {
    try {
      await billingApi.generateInvoice(tenantId);
      refetchInvoices();
      toast.success("Factura generada");
    } catch (e) {
      toast.error("No se pudo generar la factura", e instanceof Error ? e.message : "Inténtalo de nuevo");
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Payment methods */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Métodos de pago</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" /> Agregar
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {methods.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-border p-3"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="size-5 text-primary" />
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {m.label}
                    {m.isDefault && <Badge variant="secondary">Predeterminado</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {methodTypeLabel(m.type)}
                    {m.details ? ` · ${m.details}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!m.isDefault && (
                  <button
                    onClick={async () => {
                      await billingApi.setDefaultMethod(tenantId, m.id);
                      refetchMethods();
                      toast.success("Método predeterminado actualizado");
                    }}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                    aria-label="Marcar como predeterminado"
                  >
                    <Star className="size-4" />
                  </button>
                )}
                <button
                  onClick={async () => {
                    await billingApi.removeMethod(tenantId, m.id);
                    refetchMethods();
                    toast.success("Método eliminado");
                  }}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Eliminar"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
          {methods.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Sin métodos de pago registrados.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Upcoming invoice */}
      <Card>
        <CardHeader>
          <CardTitle>Próxima factura</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming ? (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">{money(upcoming.amount)}</span>
                <span className="text-sm text-muted-foreground">vence {upcoming.estimatedDate}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Suscripción de {tenantName} · Plan {upcoming.planName} (
                {upcoming.billingType === "monthly" ? "mensual" : "anual"})
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={generateInvoice}>
                Generar factura
              </Button>
            </>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {upcomingError ? "No hay suscripción activa para facturar." : "Sin factura próxima."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Invoice history */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Historial de facturas</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-2 text-left">Factura</th>
                <th className="px-6 py-2 text-left">Vencimiento</th>
                <th className="px-6 py-2 text-left">Monto</th>
                <th className="px-6 py-2 text-left">Estado</th>
                <th className="px-6 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-3 font-mono text-xs">{inv.number}</td>
                  <td className="px-6 py-3">{inv.dueDate}</td>
                  <td className="px-6 py-3">{money(inv.amount)}</td>
                  <td className="px-6 py-3">{invoiceStatusBadge[inv.status] ?? <Badge variant="secondary">{inv.status}</Badge>}</td>
                  <td className="px-6 py-3">
                    {inv.status === "pending" ? (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => confirmInvoice(inv)}>
                          <Check className="size-3.5" /> Confirmar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => rejectInvoice(inv)}>
                          <X className="size-3.5" /> Rechazar
                        </Button>
                      </div>
                    ) : (
                      <div className="text-right text-xs text-muted-foreground">—</div>
                    )}
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    Aún no hay facturas para este mayorista.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Agregar método de pago"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={!method.label} onClick={addMethod}>Guardar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Tipo</Label>
            <Select
              value={method.type}
              onChange={(e) => setMethod({ ...method, type: e.target.value })}
              options={methodTypeOptions}
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Etiqueta</Label>
            <Input
              value={method.label}
              onChange={(e) => setMethod({ ...method, label: e.target.value })}
              placeholder="BCP Cuenta corriente"
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Detalles (opcional)</Label>
            <Input
              value={method.details}
              onChange={(e) => setMethod({ ...method, details: e.target.value })}
              placeholder="N.º de cuenta, titular, etc."
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
