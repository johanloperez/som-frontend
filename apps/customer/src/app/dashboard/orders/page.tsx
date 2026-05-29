"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Button, Badge, Card, CardHeader, CardTitle, CardContent, useAuth } from "@repo/ui";
import Link from "next/link";

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
}

const statusVariant: Record<string, "success" | "warning" | "destructive" | "default"> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
  cancelled: "default",
};

export default function MyOrdersPage() {
  const { user } = useAuth();
  const slug = user?.tenantSlug ?? "";
  const basePath = slug ? `/tenant/${slug}` : "";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await api.get(`${basePath}/orders/my`);
      setOrders(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [slug]);

  const cancelOrder = async (id: string) => {
    try {
      await api.post(`${basePath}/orders/${id}/cancel`);
      load();
    } catch (e: any) { setError(e?.response?.data?.error ?? "Error"); }
  };

  if (loading) return <p className="p-8 text-muted-foreground">Cargando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Mis Pedidos</h2>
        <Link href="/dashboard/orders/create"><Button>Nuevo Pedido</Button></Link>
      </div>

      {orders.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No tienes pedidos todavía.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {orders.map(o => (
            <Card key={o.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{o.orderNumber}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</span>
                    <Badge variant={statusVariant[o.status] ?? "default"}>{o.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span>{o.items.length} productos · Total: <strong>${o.total.toFixed(2)}</strong></span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                      {expanded === o.id ? "Ocultar" : "Ver items"}
                    </Button>
                    {o.status === "pending" && (
                      <Button variant="ghost" size="sm" onClick={() => cancelOrder(o.id)}>Cancelar</Button>
                    )}
                  </div>
                </div>
                {expanded === o.id && (
                  <div className="mt-3 space-y-2 border-t pt-3">
                    {o.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.productName}</span>
                        <span>${item.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                    {o.notes && <p className="text-xs text-muted-foreground mt-2">Notas: {o.notes}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
