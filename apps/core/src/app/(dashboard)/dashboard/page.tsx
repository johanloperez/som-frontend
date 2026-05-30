"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Tooltip } from "@repo/ui";
import { Building2, Users, Package, BarChart3 } from "lucide-react";

interface DashboardStats {
  tenantsCount: number;
  plansCount: number;
  usersCount: number;
  activeSubscriptions: number;
}

const cards = [
  { key: "tenants", title: "Tenants", tooltip: "Mayoristas registrados", icon: Building2, card: 1 },
  { key: "plans", title: "Planes", tooltip: "Planes de suscripción", icon: Package, card: 2 },
  { key: "users", title: "Clientes", tooltip: "Clientes minoristas", icon: Users, card: 3 },
  { key: "active", title: "Activos", tooltip: "Suscripciones activas", icon: BarChart3, card: 4 },
];

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
      } catch {}
    }
    load();
  }, []);

  const values: Record<string, number> = {
    tenants: stats?.tenantsCount ?? 0,
    plans: stats?.plansCount ?? 0,
    users: stats?.usersCount ?? 0,
    active: stats?.activeSubscriptions ?? 0,
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Tooltip key={c.key} content={c.tooltip}>
              <div className="rounded-2xl shadow-card hover:shadow-card-hover p-5 text-center transition-all duration-200"
                style={{
                  backgroundColor: `var(--color-card-${c.card}-bg)`,
                  color: `var(--color-card-${c.card}-text)`,
                  border: `1px solid var(--color-card-${c.card}-border)`,
                }}
              >
                <Icon size={24} className="mx-auto mb-2 opacity-70" />
                <p className="text-xs uppercase tracking-wider font-medium opacity-70">{c.title}</p>
                <p className="text-3xl font-bold mt-1">{values[c.key]}</p>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
