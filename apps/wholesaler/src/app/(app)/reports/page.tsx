"use client";

import { BarChart3 } from "lucide-react";
import { PageHeader } from "@repo/ui/page-header";

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="Reportes" subtitle="Desempeño de ventas de los últimos 6 meses" />
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <BarChart3 className="size-10 text-muted-foreground" />
        <p className="text-muted-foreground">No hay reportes disponibles.</p>
      </div>
    </div>
  );
}
