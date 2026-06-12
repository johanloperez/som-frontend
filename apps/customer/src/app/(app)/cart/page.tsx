"use client";

import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { useCart } from "@/lib/cart";

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function CartPage() {
  const router = useRouter();
  const { items, subtotal, setQty, remove } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShoppingCart className="size-6" />
        </span>
        <div>
          <p className="font-medium text-foreground">Tu carrito está vacío</p>
          <p className="text-sm text-muted-foreground">Explora el catálogo y agrega productos.</p>
        </div>
        <Button onClick={() => router.push("/catalog")}>Ir al catálogo</Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">Carrito</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {items.map((it) => (
            <Card key={it.productId}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{it.name}</p>
                  <p className="text-xs text-muted-foreground">{it.supplier} · {money(it.price)} / {it.unit}</p>
                </div>
                <div className="flex items-center rounded-lg border border-border">
                  <button onClick={() => setQty(it.productId, it.qty - 1)} className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Disminuir">
                    <Minus className="size-3.5" />
                  </button>
                  <span className="w-12 text-center text-sm font-medium text-foreground">{it.qty}</span>
                  <button onClick={() => setQty(it.productId, it.qty + 1)} className="flex size-8 items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Aumentar">
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <p className="w-24 text-right font-semibold text-foreground">{money(it.qty * it.price)}</p>
                <button onClick={() => remove(it.productId)} className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-destructive" aria-label="Eliminar">
                  <Trash2 className="size-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <Card>
            <CardContent className="space-y-4 p-5">
              <h2 className="font-semibold text-foreground">Resumen</h2>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">{money(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Envío</span>
                <span className="text-muted-foreground">Se calcula al confirmar</span>
              </div>
              <div className="flex justify-between border-t border-border pt-4">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-lg font-bold text-foreground">{money(subtotal)}</span>
              </div>
              <Button className="w-full" onClick={() => router.push("/checkout")}>Continuar al pago</Button>
              <Button variant="outline" className="w-full" onClick={() => router.push("/catalog")}>Seguir comprando</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
