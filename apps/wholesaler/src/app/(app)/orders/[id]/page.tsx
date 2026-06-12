"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, User, UserSquare } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { useToast } from "@repo/ui/toast";
import { ordersApi } from "@/lib/api-services";
import { orderStatusMeta } from "@/lib/order-status";
import { useDataItem } from "@/lib/use-api";
import type { OrderStatus } from "@/lib/types";

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const FLOW: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered"];

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
  const currentStep = FLOW.indexOf(order.status);
  const next = currentStep >= 0 && currentStep < FLOW.length - 1 ? FLOW[currentStep + 1] : null;

  async function advance(to: OrderStatus) {
    await ordersApi.updateStatus(order!.id, to);
    toast.success("Pedido actualizado", `Estado: ${orderStatusMeta[to].label}`);
    refetch();
  }

  return (
    <div>
      <button onClick={() => router.push("/orders")} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Pedidos
      </button>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{order.code}</h1>
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </div>
        <div className="flex gap-2">
          {next && order.status !== "cancelled" && <Button onClick={() => advance(next)}>Marcar como {orderStatusMeta[next].label.toLowerCase()}</Button>}
          {order.status !== "delivered" && order.status !== "cancelled" && (
            <Button variant="destructive" onClick={() => advance("cancelled")}>Cancelar pedido</Button>
          )}
        </div>
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

        <Card>
          <CardHeader><CardTitle>Detalles</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Row icon={User} label="Cliente" value={order.customerName} />
            <Row icon={UserSquare} label="Vendedor" value={order.sellerName} />
            <Row icon={Calendar} label="Fecha" value={order.date} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Icon className="size-4" /></span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
