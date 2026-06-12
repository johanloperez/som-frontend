"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Select } from "@repo/ui/select";
import { Textarea } from "@repo/ui/textarea";
import { useToast } from "@repo/ui/toast";
import { cart, useCart } from "@/lib/cart";
import { ordersApi } from "@/lib/api-services";

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-1.5 block">{label}</Label>{children}</div>;
}

export default function CheckoutPage() {
  const router = useRouter();
  const toast = useToast();
  const { items, subtotal } = useCart();
  const [placing, setPlacing] = useState(false);
  const [form, setForm] = useState({ address: "", city: "", phone: "", payment: "transfer", notes: "" });

  useEffect(() => {
    if (items.length === 0 && !placing) router.replace("/cart");
  }, [items.length, placing, router]);

  const bySupplier = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const it of items) {
      const arr = map.get(it.supplier) ?? [];
      arr.push(it);
      map.set(it.supplier, arr);
    }
    return [...map.entries()];
  }, [items]);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function placeOrder() {
    setPlacing(true);
    try {
      const notes = [
        form.address && `Dirección: ${form.address}`,
        form.city && `Ciudad: ${form.city}`,
        form.phone && `Teléfono: ${form.phone}`,
        `Pago: ${form.payment}`,
        form.notes,
      ]
        .filter(Boolean)
        .join(" · ");
      await ordersApi.create({
        items: items.map((i) => ({ productId: i.productId, quantity: i.qty })),
        notes,
      });
      cart.clear();
      toast.success("Pedido realizado", "Tu pedido fue enviado al proveedor");
      router.replace("/orders");
    } catch {
      setPlacing(false);
      toast.error("No se pudo enviar el pedido", "Inténtalo nuevamente");
    }
  }

  const valid = form.address && form.city && form.phone;

  return (
    <div>
      <button onClick={() => router.push("/cart")} className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Carrito
      </button>

      <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">Finalizar compra</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="space-y-4 p-5">
              <h2 className="font-semibold text-foreground">Datos de entrega</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Dirección"><Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Av. Los Próceres 123" /></Field>
                <Field label="Ciudad"><Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Lima" /></Field>
                <Field label="Teléfono de contacto"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+51 987 654 321" /></Field>
                <Field label="Método de pago">
                  <Select
                    value={form.payment}
                    onChange={(e) => set("payment", e.target.value)}
                    options={[
                      { value: "transfer", label: "Transferencia bancaria" },
                      { value: "cash", label: "Efectivo contra entrega" },
                      { value: "credit", label: "Crédito (30 días)" },
                    ]}
                  />
                </Field>
              </div>
              <Field label="Notas para el proveedor"><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Horario de entrega, referencias…" /></Field>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h2 className="mb-3 font-semibold text-foreground">Productos ({bySupplier.length} {bySupplier.length === 1 ? "proveedor" : "proveedores"})</h2>
              <div className="space-y-4">
                {bySupplier.map(([supplier, supplierItems]) => (
                  <div key={supplier}>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{supplier}</p>
                    {supplierItems.map((it) => (
                      <div key={it.productId} className="flex justify-between border-b border-border py-2 text-sm last:border-0">
                        <span className="text-foreground">{it.qty} × {it.name}</span>
                        <span className="font-medium text-foreground">{money(it.qty * it.price)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardContent className="space-y-4 p-5">
              <h2 className="font-semibold text-foreground">Resumen</h2>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">{money(subtotal)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-4">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-lg font-bold text-foreground">{money(subtotal)}</span>
              </div>
              <Button className="w-full" disabled={!valid} loading={placing} onClick={placeOrder}>Confirmar pedido</Button>
              {!valid && <p className="text-xs text-muted-foreground">Completa los datos de entrega para continuar.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
