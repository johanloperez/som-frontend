"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { PageHeader } from "@repo/ui/page-header";
import { StatCard, type AccentColor } from "@repo/ui/stat-card";
import { productsApi, customersApi, ordersApi } from "@/lib/api-services";
import { orderStatusMeta } from "@/lib/order-status";
import { useData } from "@/lib/use-api";
import { useAuth } from "@/lib/use-auth";

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: products = [], loading: loadingP } = useData(() => productsApi.list());
  const { data: customers = [], loading: loadingC } = useData(() => customersApi.list());
  const { data: orders = [], loading: loadingO } = useData(() => ordersApi.list());
  const loading = loadingP || loadingC || loadingO;

  const revenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 20).length;

  const cards: { label: string; value: string; icon: typeof Package; accent: AccentColor; hint?: string; href: string }[] = [
    { label: "Ventas del periodo", value: loading ? "—" : money(revenue), icon: DollarSign, accent: "violet", hint: `${orders.length} pedidos`, href: "/reports" },
    { label: "Pedidos pendientes", value: loading ? "—" : String(pendingOrders), icon: ShoppingCart, accent: "amber", hint: "Requieren atención", href: "/orders" },
    { label: "Productos", value: loading ? "—" : String(products.length), icon: Package, accent: "cyan", hint: `${lowStock} con stock bajo`, href: "/products" },
    { label: "Clientes activos", value: loading ? "—" : String(customers.filter((c) => c.active).length), icon: Users, accent: "pink", href: "/customers" },
  ];

  const recent = [...orders].slice(0, 5);
  const lowStockItems = products.filter((p) => p.stock <= 20).slice(0, 5);

  return (
    <div>
      <PageHeader
        title={`Hola, ${user?.fullName?.split(" ")[0] ?? "Mayorista"}`}
        subtitle="Resumen de tu negocio"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} accent={c.accent} hint={c.hint} onClick={() => router.push(c.href)} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Pedidos recientes</CardTitle>
            <button onClick={() => router.push("/orders")} className="text-sm font-medium text-primary hover:underline">Ver todos</button>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {recent.map((o) => (
                <button key={o.id} onClick={() => router.push(`/orders/${o.id}`)} className="flex w-full items-center justify-between py-3 text-left transition-colors hover:bg-accent/40">
                  <div>
                    <p className="font-medium text-foreground">{o.code} · {o.customerName}</p>
                    <p className="text-xs text-muted-foreground">{o.date} · {o.sellerName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{money(o.total)}</span>
                    <Badge variant={orderStatusMeta[o.status].variant}>{orderStatusMeta[o.status].label}</Badge>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-accent-4" /> Stock bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todo el inventario está en niveles saludables.</p>
            ) : (
              <div className="divide-y divide-border">
                {lowStockItems.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs font-mono text-muted-foreground">{p.sku}</p>
                    </div>
                    <Badge variant={p.stock === 0 ? "destructive" : "warning"}>{p.stock} {p.unit}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
