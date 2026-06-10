"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@repo/api";
import { useRealtime } from "@repo/ui";
import { Building2, Users, Package, BarChart3, type LucideIcon } from "lucide-react";

interface DashboardStats {
  tenantsCount: number;
  plansCount: number;
  usersCount: number;
  activeSubscriptions: number;
}

interface CardDef {
  key: string;
  label: string;
  tooltip: string;
  icon: LucideIcon;
  href: string;
  card: number;
}

const cards: CardDef[] = [
  { key: "tenants", label: "Mayoristas", tooltip: "Mayoristas registrados", icon: Building2, href: "/tenants", card: 1 },
  { key: "plans", label: "Planes", tooltip: "Planes de suscripción", icon: Package, href: "/plans", card: 2 },
  { key: "users", label: "Clientes", tooltip: "Clientes minoristas", icon: Users, href: "/customers", card: 3 },
  { key: "active", label: "Activos", tooltip: "Suscripciones activas", icon: BarChart3, href: "/tenants", card: 4 },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const load = async () => {
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
  };

  useEffect(() => { load(); }, []);
  useRealtime("tenant", "*", () => { load(); });

  const values: Record<string, number> = {
    tenants: stats?.tenantsCount ?? 0,
    plans: stats?.plansCount ?? 0,
    users: stats?.usersCount ?? 0,
    active: stats?.activeSubscriptions ?? 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Panel de administración general</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.key} href={c.href}
              className="rounded-xl bg-white shadow-sm hover:shadow-lg pt-6 pb-7 px-4 text-center transition-all duration-200 border-t-4 block"
              style={{
                borderTopColor: `var(--app-dash-card-${c.card}-border)`,
                color: `var(--app-dash-card-${c.card}-text)`,
              }}
            >
              <Icon size={30} className="mx-auto mb-3 opacity-80" style={{ color: `var(--app-dash-card-${c.card}-text)` }} />
              <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">{c.label}</p>
              <p className="text-3xl md:text-4xl lg:text-5xl font-bold" style={{ color: `var(--app-dash-card-${c.card}-text)` }}>
                {values[c.key]}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
