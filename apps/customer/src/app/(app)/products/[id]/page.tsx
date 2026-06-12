"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingCart, Store, Truck } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { cn } from "@repo/ui/lib/utils";
import { useToast } from "@repo/ui/toast";
import { useCart } from "@/lib/cart";
import { productsApi } from "@/lib/api-services";
import { accentStyles } from "@/lib/order-status";
import { useDataItem } from "@/lib/use-api";

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { data: product, refetch } = useDataItem(() => productsApi.get(params.id), params.id);
  const [qty, setQty] = useState(product?.minOrder ?? 1);
  const { add } = useCart();

  if (!product) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-muted-foreground">Producto no encontrado.</p>
        <Button variant="outline" onClick={() => router.push("/catalog")}>Volver al catálogo</Button>
      </div>
    );
  }

  const accent = accentStyles[product.accent];
  const belowMin = qty < product.minOrder;

  return (
    <div>
      <button onClick={() => router.push("/catalog")} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Catálogo
      </button>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={cn("flex h-72 items-center justify-center rounded-xl border border-border", accent?.bg)}>
          <span className={cn("text-7xl font-bold", accent?.text)}>{product.name[0]}</span>
        </div>

        <div>
          <Badge variant="secondary">{product.category}</Badge>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{product.name}</h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{product.sku}</p>

          <p className="mt-4 text-3xl font-bold text-foreground">{money(product.price)}</p>
          <p className="text-sm text-muted-foreground">por {product.unit} · pedido mínimo {product.minOrder} {product.unit}s</p>

          <p className="mt-4 text-sm text-muted-foreground">{product.description}</p>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center rounded-lg border border-border">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex size-10 items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Disminuir">
                <Minus className="size-4" />
              </button>
              <input
                type="number"
                value={qty}
                min={1}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                className="w-16 border-x border-border bg-transparent py-2 text-center text-sm font-medium text-foreground outline-none"
              />
              <button onClick={() => setQty((q) => q + 1)} className="flex size-10 items-center justify-center text-muted-foreground hover:text-foreground" aria-label="Aumentar">
                <Plus className="size-4" />
              </button>
            </div>
            <div className="text-sm">
              <p className="text-muted-foreground">Subtotal</p>
              <p className="text-lg font-bold text-foreground">{money(qty * product.price)}</p>
            </div>
          </div>

          {belowMin && (
            <p className="mt-2 text-xs text-destructive">El pedido mínimo para este producto es {product.minOrder} {product.unit}s.</p>
          )}

          <Button
            className="mt-4 w-full sm:w-auto"
            disabled={belowMin}
            onClick={() => { add(product, qty); toast.success("Agregado al carrito", `${qty} × ${product.name}`); }}
          >
            <ShoppingCart className="size-4" /> Agregar al carrito
          </Button>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Store className="size-4" /></span>
                <div>
                  <p className="text-xs text-muted-foreground">Proveedor</p>
                  <p className="text-sm font-medium text-foreground">{product.supplier}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Truck className="size-4" /></span>
                <div>
                  <p className="text-xs text-muted-foreground">Disponibilidad</p>
                  <p className="text-sm font-medium text-foreground">{product.stock.toLocaleString("en-US")} {product.unit}s</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
