"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Button, Badge, Input, Card, CardHeader, CardTitle, CardContent, DataTable, useAuth, useRealtime } from "@repo/ui";
import type { ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  category?: string;
  stockQuantity: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

const statusVariant: Record<string, "success" | "warning" | "destructive" | "default"> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
  cancelled: "default",
};

export default function CreateOrderPage() {
  const { user } = useAuth();
  const router = useRouter();
  const slug = user?.tenantSlug ?? "";
  const basePath = slug ? `/tenant/${slug}` : "";

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!slug) return;
    try {
      const res = await api.get(`${basePath}/products`);
      setProducts(res.data.filter((p: any) => p.status === "active"));
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [slug]);
  useRealtime("product", "*", () => { load(); });

  const addToCart = (p: Product) => {
    const existing = cart.find(i => i.product.id === p.id);
    if (existing) {
      setCart(cart.map(i => i.product.id === p.id ? { ...i, quantity: Math.min(i.quantity + 1, p.stockQuantity) } : i));
    } else {
      setCart([...cart, { product: p, quantity: 1 }]);
    }
  };

  const updateQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart(cart.filter(i => i.product.id !== productId));
    } else {
      setCart(cart.map(i => i.product.id === productId ? { ...i, quantity: qty } : i));
    }
  };

  const total = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const submit = async () => {
    if (cart.length === 0) { setError("Agrega al menos un producto"); return; }
    setError("");
    try {
      await api.post(`${basePath}/orders`, {
        items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })),
        notes: notes || null,
      });
      setSuccess("Pedido creado exitosamente");
      setCart([]);
      setNotes("");
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Error al crear pedido");
    }
  };

  if (loading) return <p className="p-8 text-muted-foreground">Cargando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Nuevo Pedido</h2>
        <Button variant="outline" onClick={() => router.push("/dashboard/orders")}>Mis Pedidos</Button>
      </div>

      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 p-4 text-sm flex items-center justify-between">
          <span>{success}</span>
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/orders")}>Ver mis pedidos</Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Productos Disponibles</CardTitle></CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay productos disponibles.</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {products.map(p => (
                    <div key={p.id} className="flex items-center justify-between border rounded-md px-4 py-3">
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.sku} · ${p.price.toFixed(2)} · Stock: {p.stockQuantity}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => addToCart(p)} disabled={p.stockQuantity <= 0}>
                        Agregar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader><CardTitle className="text-base">Mi Pedido</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground">Agrega productos al pedido.</p>
              ) : (
                cart.map(i => (
                  <div key={i.product.id} className="flex items-center justify-between border rounded px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{i.product.name}</p>
                      <p className="text-xs text-muted-foreground">${(i.product.price * i.quantity).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button size="sm" variant="ghost" onClick={() => updateQty(i.product.id, i.quantity - 1)}>-</Button>
                      <span className="text-sm w-6 text-center">{i.quantity}</span>
                      <Button size="sm" variant="ghost" onClick={() => updateQty(i.product.id, Math.min(i.quantity + 1, i.product.stockQuantity))}>+</Button>
                    </div>
                  </div>
                ))
              )}
              {cart.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-lg font-bold">Total: ${total.toFixed(2)}</p>
                </div>
              )}
              <Input id="notes" label="Notas (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instrucciones especiales..." />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" onClick={submit} disabled={cart.length === 0}>Enviar Pedido</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
