"use client";

import { useMemo, useState } from "react";
import { Package, ShoppingBag, Wallet } from "lucide-react";
import { Avatar } from "@repo/ui/avatar";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Switch } from "@repo/ui/switch";
import { useToast } from "@repo/ui/toast";
import { ordersApi } from "@/lib/api-services";
import { useData } from "@/lib/use-api";
import { useAuth } from "@/lib/use-auth";

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-1.5 block">{label}</Label>{children}</div>;
}

export default function ProfilePage() {
  const toast = useToast();
  const { user } = useAuth();
  const { data: orders = [], refetch } = useData(() => ordersApi.list());

  const stats = useMemo(() => {
    const spent = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
    return { count: orders.length, spent };
  }, [orders]);

  const [form, setForm] = useState({
    business: user?.fullName ?? "Bodega San Martín",
    email: user?.email ?? "compras@minegocio.com",
    phone: "+51 987 654 321",
    address: "Av. Los Próceres 123, Lima",
  });
  const [prefs, setPrefs] = useState({ orderUpdates: true, promos: false });

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">Mi perfil</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-3 p-4">
          <span className="flex size-10 items-center justify-center rounded-lg bg-accent-1/10 text-accent-1"><Package className="size-5" /></span>
          <div><p className="text-xs text-muted-foreground">Pedidos</p><p className="text-xl font-bold text-foreground">{stats.count}</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4">
          <span className="flex size-10 items-center justify-center rounded-lg bg-accent-2/10 text-accent-2"><Wallet className="size-5" /></span>
          <div><p className="text-xs text-muted-foreground">Total comprado</p><p className="text-xl font-bold text-foreground">{money(stats.spent)}</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-4">
          <span className="flex size-10 items-center justify-center rounded-lg bg-accent-4/10 text-accent-4"><ShoppingBag className="size-5" /></span>
          <div><p className="text-xs text-muted-foreground">Proveedores</p><p className="text-xl font-bold text-foreground">{new Set(orders.map((o) => o.supplier)).size}</p></div>
        </CardContent></Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Datos del negocio</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={form.business} size="lg" />
              <div>
                <p className="font-medium text-foreground">{form.business}</p>
                <p className="text-sm text-muted-foreground">{form.email}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre del negocio"><Input value={form.business} onChange={(e) => set("business", e.target.value)} /></Field>
              <Field label="Correo"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
              <Field label="Teléfono"><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
              <Field label="Dirección de entrega"><Input value={form.address} onChange={(e) => set("address", e.target.value)} /></Field>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => toast.success("Perfil actualizado", form.business)}>Guardar cambios</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notificaciones</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {([
              ["orderUpdates", "Estado de pedidos", "Avísame cuando un pedido cambie de estado"],
              ["promos", "Ofertas y promociones", "Recibe ofertas de tus proveedores favoritos"],
            ] as const).map(([key, title, desc]) => (
              <div key={key} className="flex items-center justify-between border-b border-border py-3 last:border-0">
                <div className="pr-4">
                  <p className="font-medium text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
                <Switch checked={prefs[key]} onCheckedChange={(v) => setPrefs((p) => ({ ...p, [key]: v }))} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
