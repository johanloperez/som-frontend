"use client";

import { Check, CreditCard, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Dialog } from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { useToast } from "@repo/ui/toast";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp: string;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "rejected";
}

export function BillingTab({ tenantName }: { tenantName: string }) {
  const toast = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([
    { id: "pm-1", brand: "Visa", last4: "4242", exp: "08/27" },
  ]);
  const [invoices, setInvoices] = useState<Invoice[]>([
    { id: "INV-0007", date: "2026-06-01", amount: 79, status: "pending" },
    { id: "INV-0006", date: "2026-05-01", amount: 79, status: "paid" },
    { id: "INV-0005", date: "2026-04-01", amount: 79, status: "paid" },
  ]);
  const [addOpen, setAddOpen] = useState(false);
  const [card, setCard] = useState({ number: "", exp: "", cvc: "" });

  function addMethod() {
    const last4 = card.number.replace(/\s/g, "").slice(-4) || "0000";
    setMethods((m) => [...m, { id: crypto.randomUUID(), brand: "Visa", last4, exp: card.exp || "01/30" }]);
    setAddOpen(false);
    setCard({ number: "", exp: "", cvc: "" });
    toast.success("Método de pago agregado");
  }

  function setInvoiceStatus(id: string, status: Invoice["status"]) {
    setInvoices((inv) => inv.map((i) => (i.id === id ? { ...i, status } : i)));
    toast.success(status === "paid" ? "Pago confirmado" : "Pago rechazado", id);
  }

  const statusBadge = {
    paid: <Badge variant="success">Pagada</Badge>,
    pending: <Badge variant="warning">Pendiente</Badge>,
    rejected: <Badge variant="destructive">Rechazada</Badge>,
  };

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
                  <p className="text-sm font-medium">
                    {m.brand} ···· {m.last4}
                  </p>
                  <p className="text-xs text-muted-foreground">Vence {m.exp}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMethods((arr) => arr.filter((x) => x.id !== m.id));
                  toast.success("Método eliminado");
                }}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Eliminar"
              >
                <Trash2 className="size-4" />
              </button>
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
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold">$79.00</span>
            <span className="text-sm text-muted-foreground">vence 2026-07-01</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Suscripción de {tenantName} · Plan Profesional (mensual)
          </p>
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
                <th className="px-6 py-2 text-left">Fecha</th>
                <th className="px-6 py-2 text-left">Monto</th>
                <th className="px-6 py-2 text-left">Estado</th>
                <th className="px-6 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-3 font-mono text-xs">{inv.id}</td>
                  <td className="px-6 py-3">{inv.date}</td>
                  <td className="px-6 py-3">${inv.amount.toFixed(2)}</td>
                  <td className="px-6 py-3">{statusBadge[inv.status]}</td>
                  <td className="px-6 py-3">
                    {inv.status === "pending" ? (
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => setInvoiceStatus(inv.id, "paid")}>
                          <Check className="size-3.5" /> Confirmar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setInvoiceStatus(inv.id, "rejected")}>
                          <X className="size-3.5" /> Rechazar
                        </Button>
                      </div>
                    ) : (
                      <div className="text-right text-xs text-muted-foreground">—</div>
                    )}
                  </td>
                </tr>
              ))}
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
            <Button onClick={addMethod}>Guardar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Número de tarjeta</Label>
            <Input
              value={card.number}
              onChange={(e) => setCard({ ...card, number: e.target.value })}
              placeholder="4242 4242 4242 4242"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Vencimiento</Label>
              <Input value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} placeholder="MM/AA" />
            </div>
            <div>
              <Label className="mb-1.5 block">CVC</Label>
              <Input value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value })} placeholder="123" />
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
