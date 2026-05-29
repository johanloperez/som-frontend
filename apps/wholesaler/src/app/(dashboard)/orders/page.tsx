"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Button, Badge, Input, Card, CardHeader, CardTitle, CardContent, DataTable, Modal, useAuth, type FilterConfig } from "@repo/ui";
import type { ColumnDef } from "@tanstack/react-table";

interface OrderItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
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
  shipped: "default",
  delivered: "success",
};

export default function OrdersPage() {
  const { user } = useAuth();
  const slug = user?.tenantSlug ?? "";
  const basePath = slug ? `/tenant/${slug}` : "";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [tokenModal, setTokenModal] = useState(false);
  const [tokenValue, setTokenValue] = useState("");
  const [tokenProducts, setTokenProducts] = useState<Product[]>([]);
  const [tokenCart, setTokenCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [tokenNotes, setTokenNotes] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [tokenLoading, setTokenLoading] = useState(false);

  interface Product {
    id: string;
    sku: string;
    name: string;
    price: number;
    stockQuantity: number;
    status: string;
  }

  const loadProducts = async () => {
    try {
      const r = await api.get(`${basePath}/products`);
      setTokenProducts(r.data.filter((p: Product) => p.status === "active"));
    } catch {}
  };

  const openTokenModal = () => { setTokenValue(""); setTokenCart([]); setTokenNotes(""); setTokenError(""); setTokenModal(true); setTokenLoading(true); loadProducts().then(() => setTokenLoading(false)); };

  const addToTokenCart = (p: Product) => {
    const existing = tokenCart.find(i => i.product.id === p.id);
    if (existing) setTokenCart(tokenCart.map(i => i.product.id === p.id ? { ...i, quantity: Math.min(i.quantity + 1, p.stockQuantity) } : i));
    else setTokenCart([...tokenCart, { product: p, quantity: 1 }]);
  };

  const updateTokenQty = (productId: string, qty: number) => {
    if (qty <= 0) setTokenCart(tokenCart.filter(i => i.product.id !== productId));
    else setTokenCart(tokenCart.map(i => i.product.id === productId ? { ...i, quantity: qty } : i));
  };

  const submitTokenOrder = async () => {
    if (!tokenValue.trim()) { setTokenError("Ingresa el token de aprobación"); return; }
    if (tokenCart.length === 0) { setTokenError("Agrega al menos un producto"); return; }
    setTokenError("");
    try {
      await api.post(`${basePath}/orders/with-token`, {
        token: tokenValue.trim(),
        items: tokenCart.map(i => ({ productId: i.product.id, quantity: i.quantity })),
        notes: tokenNotes || null,
      });
      setTokenModal(false);
      load();
    } catch (e: any) { setTokenError(e?.response?.data?.error ?? "Error al crear pedido con token"); }
  };

  const tokenTotal = tokenCart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const load = async () => {
    if (!slug) return;
    setLoading(true);
    try { const r = await api.get(`${basePath}/orders`); setOrders(r.data); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [slug]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`${basePath}/orders/${id}/status`, { status });
      load();
    } catch (e: any) { setError(e?.response?.data?.error ?? "Error"); }
  };

  const columns: ColumnDef<Order>[] = [
    { header: "N° Pedido", accessorKey: "orderNumber", cell: ({ getValue }) => <span className="font-mono text-sm">{getValue() as string}</span> },
    { header: "Cliente", accessorKey: "customerName" },
    { header: "Items", id: "items", cell: ({ row }) => `${row.original.items.length} prod.` },
    { header: "Total", accessorKey: "total", cell: ({ getValue }) => `$${Number(getValue()).toFixed(2)}` },
    {
      header: "Estado", accessorKey: "status",
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return <Badge variant={statusVariant[v] ?? "default"}>{v}</Badge>;
      },
    },
    { header: "Fecha", accessorKey: "createdAt", cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString() },
    {
      header: "Acciones", id: "actions",
      cell: ({ row }) => {
        const o = row.original;
        return (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
              {expanded === o.id ? "Ocultar" : "Detalle"}
            </Button>
            {o.status === "pending" && (
              <>
                <Button variant="ghost" size="sm" onClick={() => updateStatus(o.id, "approved")}>Aprobar</Button>
                <Button variant="ghost" size="sm" onClick={() => updateStatus(o.id, "rejected")}>Rechazar</Button>
              </>
            )}
            {o.status === "approved" && (
              <Button variant="ghost" size="sm" onClick={() => updateStatus(o.id, "shipped")}>Enviado</Button>
            )}
          </div>
        );
      },
    },
  ];

  const filters: FilterConfig[] = [
    {
      type: "select", column: "status", label: "Estado",
      options: ["pending", "approved", "rejected", "cancelled", "shipped", "delivered"].map(s => ({ value: s, label: s })),
    },
  ];

  if (loading) return <p className="p-8 text-muted-foreground">Cargando...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Pedidos</h2>
      <div className="flex gap-2">
        <Button variant="outline" onClick={openTokenModal}>Crear con Token</Button>
        <Button onClick={load}>Recargar</Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 p-3 text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setError("")}>✕</Button>
        </div>
      )}

      {orders.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No hay pedidos todavía.</CardContent></Card>
      ) : (
        <>
          <DataTable columns={columns} data={orders} filters={filters} searchable={true} pagination={true} />

          {expanded && (() => {
            const o = orders.find(x => x.id === expanded);
            if (!o) return null;
            return (
              <Card>
                <CardHeader><CardTitle className="text-base">Detalle: {o.orderNumber}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm mb-3">Cliente: <strong>{o.customerName}</strong></p>
                  <div className="space-y-2">
                    {o.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm border-t pt-2">
                        <span>{item.quantity}x {item.productName} (${item.unitPrice.toFixed(2)} c/u)</span>
                        <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span>${o.total.toFixed(2)}</span>
                    </div>
                  </div>
                  {o.notes && <p className="text-xs text-muted-foreground mt-3">Notas: {o.notes}</p>}
                </CardContent>
              </Card>
            );
          })()}
        </>
      )}

      <Modal open={tokenModal} onClose={() => setTokenModal(false)} title="Crear Pedido con Token" description="Crea un pedido a nombre de un cliente usando su token de aprobación.">
        <div className="space-y-4">
          <Input id="token" label="Token de aprobación del cliente" value={tokenValue} onChange={(e) => setTokenValue(e.target.value)} placeholder="ABCD1234..." />
          {tokenLoading ? <p className="text-sm text-muted-foreground">Cargando productos...</p> : (
            <>
              <div className="border rounded-md max-h-[200px] overflow-y-auto">
                {tokenProducts.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2 border-b last:border-b-0">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">${p.price.toFixed(2)} · Stock: {p.stockQuantity}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => addToTokenCart(p)} disabled={p.stockQuantity <= 0}>+</Button>
                  </div>
                ))}
              </div>
              {tokenCart.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Productos seleccionados</p>
                  {tokenCart.map(i => (
                    <div key={i.product.id} className="flex items-center justify-between border rounded px-3 py-2">
                      <span className="text-sm">{i.product.name}</span>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => updateTokenQty(i.product.id, i.quantity - 1)}>-</Button>
                        <span className="text-sm w-6 text-center">{i.quantity}</span>
                        <Button size="sm" variant="ghost" onClick={() => updateTokenQty(i.product.id, Math.min(i.quantity + 1, i.product.stockQuantity))}>+</Button>
                        <span className="text-sm font-medium">${(i.product.price * i.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                  <p className="text-right font-bold">Total: ${tokenTotal.toFixed(2)}</p>
                </div>
              )}
              <Input id="tokenNotes" label="Notas (opcional)" value={tokenNotes} onChange={(e) => setTokenNotes(e.target.value)} />
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
