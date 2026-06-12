"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Eye, MoreHorizontal } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { DataTable } from "@repo/ui/data-table";
import { DropdownMenu } from "@repo/ui/dropdown-menu";
import { PageHeader } from "@repo/ui/page-header";
import { cn } from "@repo/ui/lib/utils";
import { ordersApi } from "@/lib/api-services";
import { orderStatusMeta, orderStatusTabs } from "@/lib/order-status";
import { useData } from "@/lib/use-api";
import type { Order, OrderStatus } from "@/lib/types";

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "shipped",
  shipped: "delivered",
};

export default function OrdersPage() {
  const router = useRouter();
  const { data: orders = [], refetch } = useData(() => ordersApi.list());
  const [tab, setTab] = useState<OrderStatus | "all">("all");

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: orders.length };
    for (const o of orders) map[o.status] = (map[o.status] ?? 0) + 1;
    return map;
  }, [orders]);

  const filtered = useMemo(() => (tab === "all" ? orders : orders.filter((o) => o.status === tab)), [orders, tab]);

  const columns = useMemo<ColumnDef<Order, unknown>[]>(
    () => [
      { accessorKey: "code", header: "Pedido", cell: ({ row }) => <span className="font-mono font-medium text-foreground">{row.original.code}</span> },
      { accessorKey: "customerName", header: "Cliente" },
      { accessorKey: "sellerName", header: "Vendedor", cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue())}</span> },
      { accessorKey: "date", header: "Fecha" },
      { id: "items", header: "Items", cell: ({ row }) => <Badge variant="secondary">{row.original.items.length}</Badge> },
      { accessorKey: "total", header: "Total", cell: ({ getValue }) => <span className="font-medium">{money(Number(getValue()))}</span> },
      { accessorKey: "status", header: "Estado", cell: ({ row }) => <Badge variant={orderStatusMeta[row.original.status].variant}>{orderStatusMeta[row.original.status].label}</Badge> },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const next = NEXT_STATUS[row.original.status];
          return (
            <div className="flex justify-end">
              <DropdownMenu
                trigger={<span className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"><MoreHorizontal className="size-4" /></span>}
                items={[
                  { label: "Ver detalle", icon: <Eye className="size-4" />, onClick: () => router.push(`/orders/${row.original.id}`) },
                  ...(next ? [{ label: `Marcar como ${orderStatusMeta[next].label.toLowerCase()}`, onClick: async () => { await ordersApi.updateStatus(row.original.id, next); refetch(); } }] : []),
                ]}
              />
            </div>
          );
        },
      },
    ],
    [router],
  );

  return (
    <div>
      <PageHeader title="Pedidos" subtitle="Gestiona los pedidos de tus clientes" />

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

      <DataTable columns={columns} data={filtered} searchPlaceholder="Buscar por código, cliente…" emptyMessage="No hay pedidos en este estado" />
    </div>
  );
}
