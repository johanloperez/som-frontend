"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@repo/api";
import { Button, Badge, Input, Card, CardContent, Modal, useAuth, useRealtime } from "@repo/ui";
import { ChevronDown, ChevronUp } from "lucide-react";

interface OrderItem {
  productName: string; quantity: number; unitPrice: number; subtotal: number;
}

interface Order {
  id: string; orderNumber: string; customerId: string; customerName: string;
  status: string; total: number; notes?: string; items: OrderItem[]; createdAt: string;
}

interface Product {
  id: string; sku: string; name: string; price: number; stockQuantity: number; status: string;
}

const STATUS: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "default"; desc: string }> = {
  in_review: { label: "En Revisión", variant: "warning", desc: "El vendedor está revisando el pedido" },
  pending: { label: "Pendiente", variant: "warning", desc: "Esperando aprobación del mayorista" },
  approved: { label: "Aprobado", variant: "success", desc: "Pedido aprobado, stock descontado" },
  rejected: { label: "Rechazado", variant: "destructive", desc: "El pedido fue rechazado" },
  cancelled: { label: "Cancelado", variant: "default", desc: "Cancelado por el cliente" },
  shipped: { label: "Enviado", variant: "success", desc: "Pedido enviado al cliente" },
  delivered: { label: "Entregado", variant: "success", desc: "Entregado al cliente" },
};

export default function OrdersPage() {
  const { user } = useAuth();
  const slug = user?.tenantSlug ?? "";
  const basePath = slug ? `/tenant/${slug}` : "";
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [tokenModal, setTokenModal] = useState(false);
  const [tokenValue, setTokenValue] = useState("");
  const [tokenProducts, setTokenProducts] = useState<Product[]>([]);
  const [tokenCart, setTokenCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [tokenNotes, setTokenNotes] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [tokenLoading, setTokenLoading] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try { const r = await api.get(`${basePath}/orders`); setOrders(r.data); } catch {}
    setLoading(false);
  }, [slug, basePath]);

  useEffect(() => { load(); }, [load]);
  useRealtime("order", "*", () => { load(); });

  const toggleDetail = useCallback(async (order: Order) => {
    if (expandedId === order.id) { setExpandedId(null); return; }
    if (order.items?.length) { setExpandedId(order.id); return; }
    try {
      const r = await api.get(`${basePath}/orders/${order.id}`);
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, items: r.data.items || [], notes: r.data.notes || o.notes } : o));
      setExpandedId(order.id);
    } catch {}
  }, [basePath, expandedId]);

  const updateStatus = async (id: string, status: string) => {
    setError(""); setSuccess("");
    try {
      await api.put(`${basePath}/orders/${id}/status`, { status });
      setSuccess(`Pedido actualizado a: ${STATUS[status]?.label ?? status}`);
      load();
    } catch (e: any) { setError(e?.response?.data?.error ?? "Error"); }
  };

  const loadProducts = async () => {
    try { const r = await api.get(`${basePath}/products`); setTokenProducts(r.data.filter((p: Product) => p.status === "active")); } catch {}
  };

  const openTokenModal = () => { setTokenValue(""); setTokenCart([]); setTokenNotes(""); setTokenError(""); setTokenModal(true); setTokenLoading(true); loadProducts().then(() => setTokenLoading(false)); };

  const addToTokenCart = (p: Product) => {
    const existing = tokenCart.find(i => i.product.id === p.id);
    if (existing) setTokenCart(tokenCart.map(i => i.product.id === p.id ? { ...i, quantity: Math.min(i.quantity + 1, p.stockQuantity) } : i));
    else setTokenCart([...tokenCart, { product: p, quantity: 1 }]);
  };

  const updateTokenQty = (id: string, qty: number) => {
    if (qty <= 0) setTokenCart(tokenCart.filter(i => i.product.id !== id));
    else setTokenCart(tokenCart.map(i => i.product.id === id ? { ...i, quantity: qty } : i));
  };

  const submitTokenOrder = async () => {
    if (!tokenValue.trim()) { setTokenError("Ingresa el token"); return; }
    if (tokenCart.length === 0) { setTokenError("Agrega productos"); return; }
    setTokenError("");
    try {
      await api.post(`${basePath}/orders/with-token`, {
        token: tokenValue.trim(),
        items: tokenCart.map(i => ({ productId: i.product.id, quantity: i.quantity })),
        notes: tokenNotes || null,
      });
      setTokenModal(false); load();
    } catch (e: any) { setTokenError(e?.response?.data?.error ?? "Error"); }
  };

  const tokenTotal = tokenCart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const filteredOrders = statusFilter ? orders.filter(o => o.status === statusFilter) : orders;

  if (loading) return <p className="p-8 text-muted-foreground">Cargando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Pedidos</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openTokenModal}>Crear con Token</Button>
          <Button variant="outline" onClick={load}>Recargar</Button>
        </div>
      </div>

      {success && <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm flex justify-between"><span>{success}</span><Button variant="ghost" size="sm" onClick={() => setSuccess("")}>✕</Button></div>}
      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm flex justify-between"><span>{error}</span><Button variant="ghost" size="sm" onClick={() => setError("")}>✕</Button></div>}

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filtrar:</span>
        <select
          className="rounded-md border border-input bg-input px-3 py-1.5 text-sm"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground ml-2">{filteredOrders.length} pedido{filteredOrders.length !== 1 ? 's' : ''}</span>
      </div>

      {orders.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No hay pedidos todavía.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filteredOrders.map(order => {
            const isExpanded = expandedId === order.id;
            const s = (STATUS[order.status] ?? STATUS.pending) as NonNullable<typeof STATUS[string]>;
            return (
              <Card key={order.id} className="overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors select-none"
                  onClick={() => toggleDetail(order)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-bold">{order.orderNumber}</span>
                        <Badge variant={s.variant}>{s.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{order.customerName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold">${order.total.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="shrink-0 pt-1 self-center">
                      {isExpanded ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
                    </div>
                  </div>
                  {order.items && order.items.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">{order.items.length} producto{order.items.length !== 1 ? 's' : ''}</p>
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t px-4 py-3 space-y-3 bg-muted/20">
                    <p className="text-xs text-muted-foreground italic">{s.desc}</p>

                    {order.items && order.items.length > 0 && (
                      <>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Items</p>
                        <div className="divide-y rounded-md border">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between px-3 py-2 text-sm">
                              <span className="text-muted-foreground w-8 shrink-0">{item.quantity}x</span>
                              <span className="flex-1">{item.productName}</span>
                              <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {order.notes && <p className="text-sm"><span className="text-muted-foreground">Notas:</span> {order.notes}</p>}

                    <div className="flex gap-2 flex-wrap pt-1">
                      {order.status === "in_review" && (
                        <>
                          <Button size="sm" onClick={() => updateStatus(order.id, "pending")}>Marcar Revisado</Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, "rejected")}>Rechazar</Button>
                        </>
                      )}
                      {order.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => updateStatus(order.id, "approved")}>Aprobar</Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, "rejected")}>Rechazar</Button>
                        </>
                      )}
                      {order.status === "approved" && (
                        <Button size="sm" onClick={() => updateStatus(order.id, "shipped")}>Marcar Enviado</Button>
                      )}
                      {order.status === "shipped" && (
                        <Button size="sm" onClick={() => updateStatus(order.id, "delivered")}>Marcar Entregado</Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={tokenModal} onClose={() => setTokenModal(false)} title="Crear Pedido con Token" description="Usa el token de aprobación del cliente para crear un pedido a su nombre.">
        <div className="space-y-4">
          <Input id="token" label="Token de aprobación" value={tokenValue} onChange={(e) => setTokenValue(e.target.value)} placeholder="ABCD1234..." />
          {tokenLoading ? <p className="text-sm text-muted-foreground">Cargando productos...</p> : (
            <>
              <div className="border rounded-md max-h-[200px] overflow-y-auto divide-y">
                {tokenProducts.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2">
                    <div><p className="text-sm font-medium">{p.name}</p><p className="text-xs text-muted-foreground">${p.price.toFixed(2)} · Stock: {p.stockQuantity}</p></div>
                    <Button size="sm" variant="outline" onClick={() => addToTokenCart(p)} disabled={p.stockQuantity <= 0}>+</Button>
                  </div>
                ))}
              </div>
              {tokenCart.length > 0 && (
                <div className="space-y-2">
                  {tokenCart.map(i => (
                    <div key={i.product.id} className="flex items-center justify-between border rounded px-3 py-2">
                      <span className="text-sm flex-1">{i.product.name}</span>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => updateTokenQty(i.product.id, i.quantity - 1)}>-</Button>
                        <span className="w-6 text-center text-sm">{i.quantity}</span>
                        <Button size="sm" variant="ghost" onClick={() => updateTokenQty(i.product.id, Math.min(i.quantity + 1, i.product.stockQuantity))}>+</Button>
                        <span className="text-sm font-medium w-20 text-right">${(i.product.price * i.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                  <p className="text-right font-bold">Total: ${tokenTotal.toFixed(2)}</p>
                </div>
              )}
              <Input id="tokenNotes" label="Notas" value={tokenNotes} onChange={(e) => setTokenNotes(e.target.value)} />
            </>
          )}
          {tokenError && <p className="text-sm text-destructive">{tokenError}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setTokenModal(false)}>Cancelar</Button>
            <Button onClick={submitTokenOrder} disabled={tokenCart.length === 0 || !tokenValue.trim()}>Crear Pedido</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
