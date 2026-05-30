"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Button, Badge, Input, Card, CardHeader, CardTitle, CardContent, DataTable, Modal, useAuth, type FilterConfig } from "@repo/ui";
import type { ColumnDef } from "@tanstack/react-table";

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
  const [detail, setDetail] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Token modal
  const [tokenModal, setTokenModal] = useState(false);
  const [tokenValue, setTokenValue] = useState("");
  const [tokenProducts, setTokenProducts] = useState<Product[]>([]);
  const [tokenCart, setTokenCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [tokenNotes, setTokenNotes] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [tokenLoading, setTokenLoading] = useState(false);

  const load = async () => {
    if (!slug) return;
    setLoading(true);
    try { const r = await api.get(`${basePath}/orders`); setOrders(r.data); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [slug]);

  const updateStatus = async (id: string, status: string) => {
    setError(""); setSuccess("");
    try {
      await api.put(`${basePath}/orders/${id}/status`, { status });
      setSuccess(`Pedido actualizado a: ${STATUS[status]?.label ?? status}`);
      load();
      if (detail?.id === id) setDetail(null);
    } catch (e: any) { setError(e?.response?.data?.error ?? "Error"); }
  };

  const openDetail = async (id: string) => {
    try { const r = await api.get(`${basePath}/orders/${id}`); setDetail(r.data); } catch {}
  };

  // Token order creation
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

  const columns: ColumnDef<Order>[] = [
    { header: "Pedido", accessorKey: "orderNumber", cell: ({ getValue }) => <span className="font-mono text-sm font-medium">{getValue() as string}</span> },
    { header: "Cliente", accessorKey: "customerName" },
    { header: "Items", id: "items", cell: ({ row }) => `${row.original.items?.length ?? 0} prod.` },
    { header: "Total", accessorKey: "total", cell: ({ getValue }) => `$${Number(getValue()).toFixed(2)}` },
    { header: "Estado", accessorKey: "status", cell: ({ getValue }) => {
      const s = getValue() as string;
      return <Badge variant={STATUS[s]?.variant ?? "default"}>{STATUS[s]?.label ?? s}</Badge>;
    }},
    { header: "Fecha", accessorKey: "createdAt", cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString() },
    { header: "Acciones", id: "actions", cell: ({ row }) => {
      const o = row.original;
      return (
        <div className="flex gap-1 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => openDetail(o.id)}>Detalle</Button>
          {o.status === "in_review" && (
            <>
              <Button variant="ghost" size="sm" onClick={() => updateStatus(o.id, "pending")}>Revisado</Button>
              <Button variant="ghost" size="sm" onClick={() => updateStatus(o.id, "approved")}>Forzar</Button>
              <Button variant="ghost" size="sm" onClick={() => updateStatus(o.id, "rejected")}>Rechazar</Button>
            </>
          )}
          {o.status === "pending" && (
            <>
              <Button variant="ghost" size="sm" onClick={() => updateStatus(o.id, "approved")}>Aprobar</Button>
              <Button variant="ghost" size="sm" onClick={() => updateStatus(o.id, "rejected")}>Rechazar</Button>
            </>
          )}
          {o.status === "approved" && (
            <Button variant="ghost" size="sm" onClick={() => updateStatus(o.id, "shipped")}>Enviar</Button>
          )}
          {o.status === "shipped" && (
            <Button variant="ghost" size="sm" onClick={() => updateStatus(o.id, "delivered")}>Entregado</Button>
          )}
        </div>
      );
    }},
  ];

  const filters: FilterConfig[] = [
    { type: "select", column: "status", label: "Estado",
      options: Object.entries(STATUS).map(([k, v]) => ({ value: k, label: v.label })) },
  ];

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

      {success && <div className="rounded-md border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 p-3 text-sm flex justify-between"><span>{success}</span><Button variant="ghost" size="sm" onClick={() => setSuccess("")}>✕</Button></div>}
      {error && <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 p-3 text-sm flex justify-between"><span>{error}</span><Button variant="ghost" size="sm" onClick={() => setError("")}>✕</Button></div>}

      {orders.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No hay pedidos todavía.</CardContent></Card>
      ) : (
        <DataTable columns={columns} data={orders} filters={filters} searchable={true} pagination={true} />
      )}

      {detail && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{detail.orderNumber}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setDetail(null)}>✕</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div><p className="text-xs text-muted-foreground">Cliente</p><p className="font-medium">{detail.customerName}</p></div>
              <div><p className="text-xs text-muted-foreground">Estado</p><Badge variant={STATUS[detail.status]?.variant ?? "default"}>{STATUS[detail.status]?.label ?? detail.status}</Badge></div>
              <div><p className="text-xs text-muted-foreground">Total</p><p className="font-bold">${detail.total.toFixed(2)}</p></div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{STATUS[detail.status]?.desc}</p>
            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground uppercase">Items</p>
              {detail.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.productName}</span>
                  <span>${item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
            {detail.notes && <p className="text-xs text-muted-foreground mt-3">Notas: {detail.notes}</p>}
          </CardContent>
        </Card>
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
