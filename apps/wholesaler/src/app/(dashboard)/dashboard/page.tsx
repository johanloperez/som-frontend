"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@repo/api";
import { Button, Modal, useAuth, useRealtime } from "@repo/ui";
import { Users, UserCheck, Clock, ShoppingCart, Package, AlertTriangle, Archive, type LucideIcon } from "lucide-react";

interface WidgetDef {
  key: string;
  label: string;
  card: number;
  icon: LucideIcon;
  href: string;
}

const ALL_WIDGETS: WidgetDef[] = [
  { key: "totalCustomers", label: "Total Clientes", card: 1, icon: Users, href: "/customers" },
  { key: "linkedCustomers", label: "Clientes Vinculados", card: 2, icon: UserCheck, href: "/customers" },
  { key: "pendingCustomers", label: "Clientes Pendientes", card: 3, icon: Clock, href: "/customers" },
  { key: "pendingRequests", label: "Solicitudes de Vinculación", card: 4, icon: ShoppingCart, href: "/associations" },
  { key: "totalProducts", label: "Total Productos", card: 1, icon: Package, href: "/products" },
  { key: "lowStock", label: "Productos Stock Bajo", card: 2, icon: AlertTriangle, href: "/products" },
  { key: "outOfStock", label: "Productos Sin Stock", card: 3, icon: Archive, href: "/products" },
];

const STORAGE_KEY = "wholesaler_dashboard_widgets";

export default function DashboardPage() {
  const { user } = useAuth();
  const slug = user?.tenantSlug ?? "";
  const basePath = slug ? `/tenant/${slug}` : "";

  const [showConfig, setShowConfig] = useState(false);

  const [enabled, setEnabled] = useState<string[]>(() => {
    if (typeof window === "undefined") return ALL_WIDGETS.map(w => w.key);
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : ALL_WIDGETS.map(w => w.key);
  });

  const saveEnabled = useCallback((keys: string[]) => {
    setEnabled(keys);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  }, []);

  const [data, setData] = useState({
    totalCustomers: 0,
    linkedCustomers: 0,
    pendingCustomers: 0,
    pendingRequests: 0,
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
  });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const [custRes, reqRes, prodRes] = await Promise.all([
        api.get(`${basePath}/customers`).catch(() => ({ data: [] as any[] })),
        api.get(`${basePath}/associations/requests`).catch(() => ({ data: [] as any[] })),
        api.get(`${basePath}/products`).catch(() => ({ data: [] as any[] })),
      ]);

      const customers: any[] = custRes.data;
      const requests: any[] = reqRes.data;
      const products: any[] = prodRes.data;

      setData({
        totalCustomers: customers.length,
        linkedCustomers: customers.filter(c => !!c.globalCustomerId).length,
        pendingCustomers: customers.filter(c => !c.globalCustomerId).length,
        pendingRequests: requests.filter(r => r.status === "pending").length,
        totalProducts: products.length,
        lowStock: products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.minStock).length,
        outOfStock: products.filter(p => p.stockQuantity <= 0).length,
      });
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [slug]);
  useRealtime("customer", "*", () => { load(); });

  if (loading) return <p className="p-8 text-muted-foreground">Cargando...</p>;

  const widgets = ALL_WIDGETS.filter(w => enabled.includes(w.key));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">Bienvenido, {user?.fullName}</p>
        </div>
        <Button variant="outline" onClick={() => setShowConfig(true)}>Personalizar</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {widgets.map((w) => {
          const Icon = w.icon;
          return (
          <Link key={w.key} href={w.href}
            className="rounded-xl bg-white shadow-sm hover:shadow-lg pt-6 pb-7 px-4 text-center transition-all duration-200 border-t-4 block"
            style={{
              borderTopColor: `var(--app-dash-card-${w.card}-border)`,
              color: `var(--app-dash-card-${w.card}-text)`,
            }}
          >
            <Icon size={30} className="mx-auto mb-3 opacity-80" style={{ color: `var(--app-dash-card-${w.card}-text)` }} />
            <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">{w.label}</p>
            <p className="text-3xl md:text-4xl lg:text-5xl font-bold" style={{ color: `var(--app-dash-card-${w.card}-text)` }}>
              {data[w.key as keyof typeof data]}
            </p>
          </Link>
        );})}
      </div>

      <Modal open={showConfig} onClose={() => setShowConfig(false)} title="Personalizar Dashboard" description="Selecciona los indicadores que quieres ver.">
        <div className="space-y-3">
          {ALL_WIDGETS.map((w) => {
            const checked = enabled.includes(w.key);
            return (
              <label key={w.key} className="flex items-center justify-between cursor-pointer border rounded-md px-4 py-3 hover:bg-muted transition-colors">
                <span className="text-sm font-medium">{w.label}</span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    if (checked) saveEnabled(enabled.filter(k => k !== w.key));
                    else saveEnabled([...enabled, w.key]);
                  }}
                  className="accent-primary w-4 h-4"
                />
              </label>
            );
          })}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => { saveEnabled(ALL_WIDGETS.map(w => w.key)); setShowConfig(false); }}>
              Seleccionar todos
            </Button>
            <Button onClick={() => setShowConfig(false)}>Cerrar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
