"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Card, CardContent } from "@repo/ui/card";
import { cn } from "@repo/ui/lib/utils";
import { ordersApi } from "@/lib/api-services";
import { orderStatusMeta, orderStatusTabs } from "@/lib/order-status";
import { useData } from "@/lib/use-api";
import type { RetailOrderStatus } from "@/lib/types";

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

export default function OrdersPage() {
  const router = useRouter();
  const { data: orders = [], refetch } = useData(() => ordersApi.list());
  const [tab, setTab] = useState<RetailOrderStatus | "all">("all");

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: orders.length };
    for (const o of orders) map[o.status] = (map[o.status] ?? 0) + 1;
    return map;
  }, [orders]);

  const filtered = useMemo(() => (tab === "all" ? orders : orders.filter((o) => o.status === tab)), [orders, tab]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground">Mis pedidos</h1>
      <p className="mb-6 text-sm text-muted-foreground">Historial de compras a tus proveedores</p>

      <div className="mb-4 flex flex-wrap gap-1 border-b border-border">
        {orderStatusTabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "relative px-3 py-2 text-sm font-medium transition-colors",
              tab === t.value ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">{counts[t.value] ?? 0}</span>
            {tab === t.value && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center text-muted-foreground">
          <Package className="size-8" />
          <p>No tienes pedidos en este estado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const meta = orderStatusMeta[o.status];
            return (
              <Card key={o.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => router.push(`/orders/${o.id}`)}>
                <CardContent className="flex items-center gap-4 p-4">
                  <span className="flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Package className="size-5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-mono font-medium text-foreground">{o.code}</p>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{o.supplier} · {o.date} · {o.items.length} {o.items.length === 1 ? "producto" : "productos"}</p>
                  </div>
                  <p className="text-lg font-bold text-foreground">{money(o.total)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
