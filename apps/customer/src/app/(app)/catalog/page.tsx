"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, ShoppingBag, Store } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Select } from "@repo/ui/select";
import { cn } from "@repo/ui/lib/utils";
import { useToast } from "@repo/ui/toast";
import { useCart } from "@/lib/cart";
import { productsApi } from "@/lib/api-services";
import { accentStyles, categoryOptions } from "@/lib/order-status";
import { useData } from "@/lib/use-api";

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function CatalogPage() {
  const router = useRouter();
  const toast = useToast();
  const { data: products = [], refetch } = useData(() => productsApi.list());
  const { add } = useCart();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (!category || p.category === category) &&
        (!q || p.name.toLowerCase().includes(q) || p.supplier.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)),
    );
  }, [products, query, category]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Catálogo</h1>
        <p className="text-sm text-muted-foreground">Productos al por mayor de proveedores verificados</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar producto, proveedor o SKU…" />
        </div>
        <div className="w-44">
          <Select value={category} onChange={(e) => setCategory(e.target.value)} options={[{ value: "", label: "Todas las categorías" }, ...categoryOptions]} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center text-muted-foreground">
          <ShoppingBag className="size-8" />
          {products.length === 0 ? (
            <>
              <p>Aún no ves productos.</p>
              <p className="text-sm">Vincúlate con un mayorista para ver su catálogo.</p>
              <Button className="mt-2" onClick={() => router.push("/associations")}>
                <Store className="size-4" /> Vincular mayorista
              </Button>
            </>
          ) : (
            <p>No se encontraron productos.</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Card key={p.id} className="overflow-hidden transition-shadow hover:shadow-md">
              <button onClick={() => router.push(`/products/${p.id}`)} className="block w-full text-left">
                <div className={cn("flex h-32 items-center justify-center", accentStyles[p.accent]?.bg)}>
                  <span className={cn("text-3xl font-bold", accentStyles[p.accent]?.text)}>{p.name[0]}</span>
                </div>
              </button>
              <CardContent className="p-4">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <button onClick={() => router.push(`/products/${p.id}`)} className="text-left">
                    <p className="font-semibold leading-tight text-foreground hover:text-primary">{p.name}</p>
                  </button>
                  <Badge variant="secondary">{p.category}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{p.supplier}</p>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-lg font-bold text-foreground">{money(p.price)}</p>
                    <p className="text-xs text-muted-foreground">por {p.unit} · mín. {p.minOrder}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => { add(p, p.minOrder); toast.success("Agregado al carrito", `${p.minOrder} × ${p.name}`); }}
                  >
                    <Plus className="size-4" /> Agregar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
