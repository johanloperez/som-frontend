"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Package, Store, Truck, X } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { cn } from "@repo/ui/lib/utils";
import { useToast } from "@repo/ui/toast";
import { ordersApi } from "@/lib/api-services";
import { orderStatusMeta } from "@/lib/order-status";
import { useDataItem } from "@/lib/use-api";
import type { RetailOrderStatus } from "@/lib/types";

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const FLOW: { status: RetailOrderStatus; label: string }[] = [
  { status: "pending", label: "Pedido recibido" },
  { status: "confirmed", label: "Confirmado" },
  { status: "shipped", label: "En camino" },
  { status: "delivered", label: "Entregado" },
];

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { data: order, refetch } = useDataItem(() => ordersApi.get(params.id), params.id);

  if (!order) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-muted-foreground">Pedido no encontrado.</p>
        <Button variant="outline" onClick={() => router.push("/orders")}>Volver</Button>
      </div>
    );
  }

  const meta = orderStatusMeta[order.status];
  const subtotal = order.items.reduce((s, i) => s + i.qty * i.price, 0);
  const currentStep = FLOW.findIndex((f) => f.status === order.status);
  const cancelled = order.status === "cancelled";

  return (
    <div>
      <button onClick={() => router.push("/orders")} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Mis pedidos
      </button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground">{order.code}</h1>
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </div>
        {!cancelled && order.status === "pending" && (
          <Button variant="outline" onClick={async () => { await ordersApi.cancel(order.id); refetch(); toast.success("Pedido cancelado", order.code); }}>
            <X className="size-4" /> Cancelar pedido
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Productos</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 text-left">Producto</th>
                    <th className="py-2 text-right">Cant.</th>
                    <th className="py-2 text-right">Precio</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it) => (
                    <tr key={it.productId} className="border-b border-border last:border-0">
                      <td className="py-3 font-medium text-foreground">{it.name}</td>
                      <td className="py-3 text-right">{it.qty}</td>
                      <td className="py-3 text-right">{money(it.price)}</td>
                      <td className="py-3 text-right font-medium">{money(it.qty * it.price)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td colSpan={3} className="py-3 text-right font-semibold">Total</td><td className="py-3 text-right text-lg font-bold text-foreground">{money(subtotal)}</td></tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Proveedor</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Store className="size-4" /></span>
              <div>
                <p className="text-sm font-medium text-foreground">{order.supplier}</p>
                <p className="text-xs text-muted-foreground">Pedido del {order.date}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Seguimiento</CardTitle></CardHeader>
            <CardContent>
              {cancelled ? (
                <div className="flex items-center gap-3 text-sm text-destructive">
                  <span className="flex size-8 items-center justify-center rounded-full bg-destructive/10"><X className="size-4" /></span>
                  Pedido cancelado
                </div>
              ) : (
                <ol className="space-y-4">
                  {FLOW.map((step, i) => {
                    const done = i <= currentStep;
                    const StepIcon = i === FLOW.length - 1 ? Check : i === 2 ? Truck : Package;
                    return (
                      <li key={step.status} className="flex items-center gap-3">
                        <span className={cn("flex size-8 items-center justify-center rounded-full", done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                          <StepIcon className="size-4" />
                        </span>
                        <span className={cn("text-sm", done ? "font-medium text-foreground" : "text-muted-foreground")}>{step.label}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
