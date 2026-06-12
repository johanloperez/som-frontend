"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { StatCard, type AccentColor } from "@repo/ui/stat-card";
import { Building2, CheckCircle2, Layers, Users } from "lucide-react";
import { PageHeader } from "@repo/ui/page-header";
import { customersApi, plansApi, tenantsApi } from "@/lib/api-services";
import { useData } from "@/lib/use-api";
import { useAuth } from "@/lib/use-auth";

const cardDefs: {
  label: string;
  icon: typeof Building2;
  accent: AccentColor;
  href: string;
}[] = [
  { label: "Mayoristas", icon: Building2, accent: "violet", href: "/tenants" },
  { label: "Planes", icon: Layers, accent: "cyan", href: "/plans" },
  { label: "Clientes", icon: Users, accent: "pink", href: "/customers" },
  { label: "Suscripciones activas", icon: CheckCircle2, accent: "amber", href: "/tenants" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: tenants = [] } = useData(() => tenantsApi.list());
  const { data: customers = [] } = useData(() => customersApi.list());
  const { data: plans = [] } = useData(() => plansApi.list());

  const values = [
    tenants.length,
    plans.length,
    customers.length,
    tenants.filter((t) => t.status === "active").length,
  ];

  return (
    <div>
      <PageHeader
        title={`Hola, ${user?.fullName?.split(" ")[0] ?? "Admin"}`}
        subtitle="Resumen general de la plataforma"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cardDefs.map((c, i) => (
          <StatCard
            key={c.label}
            label={c.label}
            value={(values[i] ?? 0).toLocaleString("es")}
            icon={c.icon}
            accent={c.accent}
            onClick={() => router.push(c.href)}
          />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              La actividad en tiempo real aparecerá aquí cuando el backend esté
              conectado.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Accesos rápidos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {cardDefs.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.label}
                  onClick={() => router.push(c.href)}
                  className="flex items-center gap-2 rounded-lg border border-border p-3 text-left text-sm font-medium transition-colors hover:bg-accent"
                >
                  <Icon className="size-4 text-primary" />
                  {c.label}
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
