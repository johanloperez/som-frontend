"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  Clock,
  Download,
  Repeat,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { DataTable } from "@repo/ui/data-table";
import { PageHeader } from "@repo/ui/page-header";
import { Select } from "@repo/ui/select";
import { StatCard, type AccentColor } from "@repo/ui/stat-card";
import { profitApi } from "@/lib/api-services";
import { useApi } from "@/lib/use-api";

const RANGE_OPTIONS = [
  { value: "6m", label: "Últimos 6 meses" },
  { value: "3m", label: "Últimos 3 meses" },
  { value: "1m", label: "Último mes" },
];

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ProfitPage() {
  const [range, setRange] = useState("6m");

  const { data: summary } = useApi(() => profitApi.summary(), []);
  const { data: details } = useApi(() => profitApi.details(), []);

  const months = useMemo(() => {
    const all = (details?.monthlyHistory ?? []).map((m) => ({
      month: m.month,
      collected: m.collected,
      pending: m.pending,
    }));
    const n = range === "1m" ? 1 : range === "3m" ? 3 : 6;
    return all.slice(-n);
  }, [details, range]);

  const kpis = useMemo(() => {
    const collected = summary?.totalCollected ?? 0;
    const pending = summary?.totalPending ?? 0;
    const overdue = summary?.totalOverdue ?? 0;
    const mrr = summary?.monthlyRecurringRevenue ?? 0;
    const arr = summary?.annualRecurringRevenue ?? 0;
    const activeSubs = summary?.activeSubscriptions ?? 0;
    const growth = summary?.growthPercent ?? 0;
    const estimated = summary?.estimatedNextMonth ?? 0;
    return { collected, pending, overdue, mrr, arr, activeSubs, growth, estimated };
  }, [summary]);

  const maxBar = useMemo(
    () => Math.max(...months.map((m) => m.collected + m.pending), 1),
    [months],
  );

  const cards: { label: string; value: string; icon: typeof Wallet; accent: AccentColor; hint?: string }[] = [
    { label: "Recaudado", value: money(kpis.collected), icon: Wallet, accent: "violet", hint: "En el periodo" },
    { label: "Pendiente", value: money(kpis.pending), icon: Clock, accent: "amber", hint: "Por cobrar" },
    { label: "Vencido", value: money(kpis.overdue), icon: CircleDollarSign, accent: "pink", hint: "En mora" },
    { label: "MRR", value: money(kpis.mrr), icon: Repeat, accent: "cyan", hint: "Ingreso recurrente mensual" },
    { label: "ARR", value: money(kpis.arr), icon: TrendingUp, accent: "violet", hint: "Ingreso recurrente anual" },
    { label: "Estimado", value: money(kpis.estimated), icon: CircleDollarSign, accent: "cyan", hint: "Recaudado + pendiente" },
    { label: "Suscripciones", value: String(kpis.activeSubs), icon: Users, accent: "pink", hint: "Activas" },
    { label: "Crecimiento", value: `${kpis.growth > 0 ? "+" : ""}${kpis.growth}%`, icon: ArrowUpRight, accent: "amber", hint: "Vs. inicio del periodo" },
  ] as const;

  const monthlyColumns = useMemo<ColumnDef<{ month: string; collected: number; pending: number }, unknown>[]>(
    () => [
      { accessorKey: "month", header: "Mes" },
      { accessorKey: "collected", header: "Recaudado", cell: ({ getValue }) => money(Number(getValue())) },
      { accessorKey: "pending", header: "Pendiente", cell: ({ getValue }) => money(Number(getValue())) },
      {
        id: "total",
        header: "Total",
        cell: ({ row }) => <span className="font-medium">{money(row.original.collected + row.original.pending)}</span>,
      },
    ],
    [],
  );

  const planColumns = useMemo<ColumnDef<{ plan: string; subscriptions: number; mrr: number; share: number }, unknown>[]>(
    () => [
      { accessorKey: "plan", header: "Plan", cell: ({ getValue }) => <span className="font-medium">{String(getValue())}</span> },
      { accessorKey: "subscriptions", header: "Suscripciones" },
      { accessorKey: "mrr", header: "MRR", cell: ({ getValue }) => money(Number(getValue())) },
      { accessorKey: "share", header: "Participación", cell: ({ getValue }) => <Badge variant="secondary">{String(getValue())}%</Badge> },
    ],
    [],
  );

  const byPlan = useMemo(() =>
    (details?.byPlan ?? []).map((p) => ({ plan: p.planName, subscriptions: p.activeSubscriptions, mrr: p.mrr, share: p.percentOfTotal })),
    [details],
  );

  const byTenant = useMemo(() =>
    (details?.byTenant ?? []).map((t) => ({ tenant: t.tenantName, plan: t.planName, amount: t.totalInvoiced })),
    [details],
  );

  const payerColumns = useMemo<ColumnDef<{ tenant: string; plan: string; amount: number }, unknown>[]>(
    () => [
      { accessorKey: "tenant", header: "Mayorista", cell: ({ getValue }) => <span className="font-medium">{String(getValue())}</span> },
      { accessorKey: "plan", header: "Plan", cell: ({ getValue }) => <Badge variant="outline">{String(getValue())}</Badge> },
      { accessorKey: "amount", header: "Monto anual", cell: ({ getValue }) => money(Number(getValue())) },
    ],
    [],
  );

  function exportAll() {
    const rows: (string | number)[][] = [
      ["Reporte financiero", RANGE_OPTIONS.find((r) => r.value === range)?.label ?? ""],
      [],
      ["KPI", "Valor"],
      ...cards.map((c) => [c.label, c.value]),
      [],
      ["Mes", "Recaudado", "Pendiente", "Total"],
      ...months.map((m) => [m.month, m.collected, m.pending, m.collected + m.pending]),
      [],
      ["Plan", "Suscripciones", "MRR", "Participación %"],
      ...byPlan.map((p) => [p.plan, p.subscriptions, p.mrr, p.share]),
      [],
      ["Mayorista", "Plan", "Monto anual"],
      ...byTenant.map((p) => [p.tenant, p.plan, p.amount]),
    ];
    downloadCsv(`finanzas-${range}.csv`, rows);
  }

  return (
    <div>
      <PageHeader
        title="Finanzas"
        subtitle="Recaudación, ingresos recurrentes y reportes de la plataforma"
        actions={
          <div className="flex items-center gap-2">
            <div className="w-48">
              <Select value={range} onChange={(e) => setRange(e.target.value)} options={RANGE_OPTIONS} />
            </div>
            <Button variant="outline" onClick={exportAll}>
              <Download className="size-4" /> Exportar CSV
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} icon={c.icon} accent={c.accent} hint={c.hint} />
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" /> Recaudación mensual
          </CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-success" /> Recaudado</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-accent-4" /> Pendiente</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 sm:gap-6" style={{ height: 220 }}>
            {months.map((m) => {
              const total = m.collected + m.pending;
              return (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">{money(total)}</span>
                  <div className="flex w-full flex-col justify-end overflow-hidden rounded-md" style={{ height: 160 }}>
                    <div className="w-full bg-accent-4" style={{ height: `${(m.pending / maxBar) * 160}px` }} title={`Pendiente: ${money(m.pending)}`} />
                    <div className="w-full bg-success" style={{ height: `${(m.collected / maxBar) * 160}px` }} title={`Recaudado: ${money(m.collected)}`} />
                  </div>
                  <span className="text-xs font-medium text-foreground">{m.month}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Desglose mensual</h3>
          <DataTable columns={monthlyColumns} data={months} globalFilter={false} emptyMessage="Sin datos en el periodo" pageSize={12} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Ingresos por plan</h3>
            <DataTable columns={planColumns} data={byPlan} globalFilter={false} pageSize={10} />
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">Mayores pagadores</h3>
            <DataTable columns={payerColumns} data={byTenant} globalFilter={false} pageSize={10} />
          </div>
        </div>
      </div>
    </div>
  );
}
