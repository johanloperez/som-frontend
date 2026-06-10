"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Button, Badge, Card, CardHeader, CardTitle, CardContent, Input, Modal, useAuth, useRealtime } from "@repo/ui";
import Link from "next/link";

interface OrderItem {
  productName: string; quantity: number; unitPrice: number; subtotal: number;
}

interface Order {
  id: string; orderNumber: string; status: string; total: number; notes?: string;
  items: OrderItem[]; createdAt: string;
}

interface TokenInfo {
  id: string; token: string; oneTimeUse: boolean; expiresAt?: string; used: boolean; createdAt: string;
}

const STATUS: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "default"; desc: string }> = {
  in_review: { label: "En Revisión", variant: "warning", desc: "Tu vendedor asignado está revisando el pedido" },
  pending: { label: "Pendiente", variant: "warning", desc: "Esperando aprobación del mayorista" },
  approved: { label: "Aprobado", variant: "success", desc: "Pedido aprobado y en proceso" },
  rejected: { label: "Rechazado", variant: "destructive", desc: "El pedido fue rechazado" },
  cancelled: { label: "Cancelado", variant: "default", desc: "" },
  shipped: { label: "Enviado", variant: "success", desc: "Tu pedido va en camino" },
  delivered: { label: "Entregado", variant: "success", desc: "Pedido recibido" },
};

const FLOW_STEPS = ["in_review", "pending", "approved", "shipped", "delivered"];
const FLOW_LABELS: Record<string, string> = { in_review: "Revisión", pending: "Pendiente", approved: "Aprobado", shipped: "Enviado", delivered: "Entregado" };

export default function MyOrdersPage() {
  const { user } = useAuth();
  const slug = user?.tenantSlug ?? "";
  const basePath = slug ? `/tenant/${slug}` : "";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Token
  const [token, setToken] = useState<TokenInfo | null>(null);
  const [tokenModal, setTokenModal] = useState(false);
  const [tokenOneTime, setTokenOneTime] = useState(false);
  const [tokenExpires, setTokenExpires] = useState("");

  const load = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await api.get(`${basePath}/orders/my`);
      setOrders(res.data);
    } catch {}
    setLoading(false);
  };

  const loadToken = async () => {
    try { const r = await api.get(`${basePath}/orders/token`); setToken(r.data || null); } catch { setToken(null); }
  };

  useEffect(() => { load(); loadToken(); }, [slug]);
  useRealtime("order", "*", () => { load(); });

  const cancelOrder = async (id: string) => {
    try { await api.post(`${basePath}/orders/${id}/cancel`); load(); } catch (e: any) { setError(e?.response?.data?.error ?? "Error"); }
  };

  const generateToken = async () => {
    try {
      const res = await api.post(`${basePath}/orders/token`, {
        oneTimeUse: tokenOneTime,
        expiresAt: tokenExpires ? new Date(tokenExpires).toISOString() : null,
      });
      setToken(res.data);
      setTokenModal(false);
    } catch (e: any) { setError(e?.response?.data?.error ?? "Error"); }
  };

  const openTokenModal = () => { setTokenOneTime(false); setTokenExpires(""); setError(""); setTokenModal(true); };

  const currentStep = (status: string) => {
    if (status === "rejected" || status === "cancelled") return -1;
    return FLOW_STEPS.indexOf(status);
  };

  if (!slug) return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Pedidos</h2>
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-lg font-medium mb-2">Selecciona un mayorista para ver tus pedidos</p>
          <p className="text-sm text-muted-foreground mb-6">Entra al portal de un mayorista vinculado desde "Mis Asociaciones".</p>
          <Link href="/dashboard/associations"><Button>Ir a Mis Asociaciones</Button></Link>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) return <p className="p-8 text-muted-foreground">Cargando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Mis Pedidos</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openTokenModal}>Token de Aprobación</Button>
          <Link href="/dashboard/orders/create"><Button>Nuevo Pedido</Button></Link>
        </div>
      </div>

      {token && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader><CardTitle className="text-base">Mi Token de Aprobación</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-lg select-all">{token.token}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {token.oneTimeUse ? "Un solo uso" : "Multi-uso"}
                  {token.expiresAt ? ` · Vence: ${new Date(token.expiresAt).toLocaleDateString()}` : " · Sin vencimiento"}
                  {token.used ? " · YA USADO" : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(token.token)}>Copiar</Button>
                <Button variant="outline" size="sm" onClick={openTokenModal}>Re-generar</Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Comparte este token con tu mayorista para que pueda hacer pedidos a tu nombre.</p>
          </CardContent>
        </Card>
      )}

      {orders.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No tienes pedidos todavía.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {orders.map(o => {
            const step = currentStep(o.status);
            return (
              <Card key={o.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-mono">{o.orderNumber}</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</span>
                      <Badge variant={STATUS[o.status]?.variant ?? "default"}>{STATUS[o.status]?.label ?? o.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {step >= 0 && o.status !== "rejected" && o.status !== "cancelled" && (
                    <div className="flex items-center gap-1 mb-3">
                      {FLOW_STEPS.slice(0, 5).map((s, i) => (
                        <div key={s} className="flex items-center gap-1 flex-1">
                          <div className={`h-2 flex-1 rounded-full ${i <= step ? (o.status === "rejected" ? "bg-red-500" : "bg-green-500") : "bg-muted"}`} />
                          {i < 4 && <div className={`w-2 h-2 rounded-full ${i < step ? "bg-green-500" : "bg-muted"}`} />}
                        </div>
                      ))}
                    </div>
                  )}
                  {step >= 0 && (
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-3">
                      {FLOW_STEPS.slice(0, 5).map(s => <span key={s}>{FLOW_LABELS[s]}</span>)}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mb-2">{STATUS[o.status]?.desc}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span>{o.items.length} productos · Total: <strong>${o.total.toFixed(2)}</strong></span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                        {expanded === o.id ? "Ocultar" : "Ver items"}
                      </Button>
                      {(o.status === "pending" || o.status === "in_review") && (
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
                      <div className="border-t pt-1 flex justify-between font-bold"><span>Total</span><span>${o.total.toFixed(2)}</span></div>
                      {o.notes && <p className="text-xs text-muted-foreground mt-2">Notas: {o.notes}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={tokenModal} onClose={() => setTokenModal(false)} title="Generar Token de Aprobación" description="Este token permite que tu mayorista cree pedidos a tu nombre.">
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={tokenOneTime} onChange={(e) => setTokenOneTime(e.target.checked)} className="accent-primary" />
            Un solo uso
          </label>
          <Input id="expires" label="Vence (fecha, opcional)" type="date" value={tokenExpires} onChange={(e) => setTokenExpires(e.target.value)} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          {token && <p className="text-xs text-muted-foreground">Al generar un nuevo token, el anterior se reemplazará.</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setTokenModal(false)}>Cancelar</Button>
            <Button onClick={generateToken}>Generar Token</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
