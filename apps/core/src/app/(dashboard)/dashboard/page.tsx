"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Card, CardHeader, CardTitle, CardContent, Tooltip } from "@repo/ui";

interface DashboardStats {
  tenantsCount: number;
  plansCount: number;
  usersCount: number;
  activeSubscriptions: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [tenants, plans, customers] = await Promise.all([
          api.get("/platform/tenants"),
          api.get("/platform/subscription-plans"),
          api.get("/platform/customers"),
        ]);
        setStats({
          tenantsCount: tenants.data.length,
          plansCount: plans.data.length,
          usersCount: customers.data.length,
          activeSubscriptions: tenants.data.filter((t: any) => t.subscriptionStatus === "active" || t.subscriptionStatus === "trial").length,
        });
      } catch { /* ignore */ }
    }
    load();
  }, []);

  const cards = [
    { title: "Tenants", tooltip: "Mayoristas registrados en la plataforma", value: stats?.tenantsCount ?? "—", desc: "Mayoristas registrados" },
    { title: "Planes", tooltip: "Planes de suscripción disponibles para mayoristas", value: stats?.plansCount ?? "—", desc: "Planes de suscripción" },
    { title: "Usuarios", tooltip: "Clientes minoristas registrados en la plataforma", value: stats?.usersCount ?? "—", desc: "Clientes minoristas" },
    { title: "Activos", tooltip: "Mayoristas con suscripción activa actualmente", value: stats?.activeSubscriptions ?? "—", desc: "Suscripciones activas" },
  ];

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground"><Tooltip content={c.tooltip}>{c.title}</Tooltip></CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
