"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, DataTable, type FilterConfig } from "@repo/ui";
import type { ColumnDef } from "@tanstack/react-table";

interface ProfitSummary {
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  estimatedNextMonth: number;
  collectedThisMonth: number;
  collectedLastMonth: number;
  growthPercent: number;
  activeSubscriptions: number;
  totalSubscriptions: number;
}

interface MonthlyHistory {
  month: string;
  year: number;
  monthNumber: number;
  collected: number;
  pending: number;
  overdue: number;
}

interface PlanBreakdown {
  planId: string;
  planName: string;
  activeSubscriptions: number;
  mrr: number;
  percentOfTotal: number;
}

interface TenantBreakdown {
  tenantId: string;
  tenantName: string;
  planName: string;
  totalInvoiced: number;
  totalCollected: number;
  pendingAmount: number;
}

interface ProfitDetails {
  monthlyHistory: MonthlyHistory[];
  byPlan: PlanBreakdown[];
  byTenant: TenantBreakdown[];
}

function BarChart({ data, maxValue }: { data: MonthlyHistory[]; maxValue: number }) {
  return (
    <div className="flex items-end gap-2 h-48 mt-2">
      {data.map((m) => {
        const collectedH = maxValue > 0 ? (m.collected / maxValue) * 100 : 0;
        const pendingH = maxValue > 0 ? (m.pending / maxValue) * 100 : 0;
        return (
          <div key={`${m.year}-${m.monthNumber}`} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col-reverse" style={{ height: "160px" }}>
              <div className="w-full bg-green-500 rounded-t" style={{ height: `${collectedH}%` }} title={`Recaudado: $${m.collected.toFixed(0)}`} />
              <div className="w-full bg-amber-500" style={{ height: `${pendingH}%` }} title={`Pendiente: $${m.pending.toFixed(0)}`} />
            </div>
            <span className="text-xs text-muted-foreground">{m.month}</span>
          </div>
        );
      })}
    </div>
  );
}

const formatCurrency = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function ProfitPage() {
  const [summary, setSummary] = useState<ProfitSummary | null>(null);
  const [details, setDetails] = useState<ProfitDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(0);
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", new Date(startDate).toISOString());
      if (endDate) params.set("endDate", new Date(endDate + "T23:59:59").toISOString());

      const [s, d] = await Promise.all([
        api.get(`/platform/profit/summary?${params.toString()}`).catch(() => ({ data: null })),
        api.get(`/platform/profit/details?${params.toString()}`).catch(() => ({ data: null })),
      ]);
      setSummary(s.data);
      setDetails(d.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [startDate, endDate]);

  const exportCsv = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", new Date(startDate).toISOString());
      if (endDate) params.set("endDate", new Date(endDate + "T23:59:59").toISOString());

      const res = await api.get(`/platform/profit/export?${params.toString()}`);
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `profit_report_${startDate}_${endDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {}
  };

  const maxBar = details?.monthlyHistory?.length
    ? Math.max(...details.monthlyHistory.map((m) => m.collected + m.pending + m.overdue), 1)
    : 1;

  const planColumns: ColumnDef<PlanBreakdown>[] = [
    { header: "Plan", accessorKey: "planName" },
    { header: "Suscripciones Activas", accessorKey: "activeSubscriptions" },
    { header: "MRR", accessorKey: "mrr", cell: ({ getValue }) => formatCurrency(getValue() as number) },
    { header: "% del Total", accessorKey: "percentOfTotal", cell: ({ getValue }) => `${getValue()}%` },
  ];

  const tenantColumns: ColumnDef<TenantBreakdown>[] = [
    { header: "Mayorista", accessorKey: "tenantName" },
    { header: "Plan", accessorKey: "planName" },
    { header: "Facturado", accessorKey: "totalInvoiced", cell: ({ getValue }) => formatCurrency(getValue() as number) },
    { header: "Cobrado", accessorKey: "totalCollected", cell: ({ getValue }) => formatCurrency(getValue() as number) },
    { header: "Pendiente", accessorKey: "pendingAmount", cell: ({ getValue }) => formatCurrency(getValue() as number) },
  ];

  const historyColumns: ColumnDef<MonthlyHistory>[] = [
    { header: "Mes", id: "month", cell: ({ row }) => `${row.original.month} ${row.original.year}` },
    { header: "Recaudado", accessorKey: "collected", cell: ({ getValue }) => formatCurrency(getValue() as number) },
    { header: "Pendiente", accessorKey: "pending", cell: ({ getValue }) => formatCurrency(getValue() as number) },
    { header: "Vencido", accessorKey: "overdue", cell: ({ getValue }) => formatCurrency(getValue() as number) },
  ];

  if (loading) return <p className="p-8">Cargando...</p>;

  const growthColor = (summary?.growthPercent ?? 0) >= 0 ? "text-green-600" : "text-red-600";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Ganancias</h2>
        <Button variant="outline" onClick={exportCsv}>Exportar CSV</Button>
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-muted-foreground">Rango:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border rounded-md px-3 py-1 text-sm"
        />
        <span className="text-muted-foreground">a</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border rounded-md px-3 py-1 text-sm"
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Recaudado Total</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary?.totalCollected ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Pendiente</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(summary?.totalPending ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Vencido</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summary?.totalOverdue ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(summary?.monthlyRecurringRevenue ?? 0)}<span className="text-sm text-muted-foreground">/mes</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">ARR</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatCurrency(summary?.annualRecurringRevenue ?? 0)}<span className="text-sm text-muted-foreground">/año</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Estimado Próx. Mes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(summary?.estimatedNextMonth ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Suscripciones Activas</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary?.activeSubscriptions ?? 0}<span className="text-sm text-muted-foreground"> / {summary?.totalSubscriptions ?? 0} total</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Crecimiento vs Mes Anterior</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${growthColor}`}>
              {summary?.growthPercent ?? 0 >= 0 ? "+" : ""}{summary?.growthPercent ?? 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly History Chart */}
      {details?.monthlyHistory && details.monthlyHistory.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Historial Mensual</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-4 text-sm mb-2">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded inline-block" /> Recaudado</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-500 rounded inline-block" /> Pendiente</span>
            </div>
            <BarChart data={details.monthlyHistory} maxValue={maxBar} />
            <div className="mt-4">
              <DataTable columns={historyColumns} data={details.monthlyHistory} searchable={false} pagination={false} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* By Plan */}
      {details?.byPlan && details.byPlan.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Desglose por Plan</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={planColumns} data={details.byPlan} searchable={false} pagination={false} />
          </CardContent>
        </Card>
      )}

      {/* Top Tenants */}
      {details?.byTenant && details.byTenant.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Top Mayores Facturadores</CardTitle></CardHeader>
          <CardContent>
            <DataTable columns={tenantColumns} data={details.byTenant} searchable={true} pagination={true} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
