"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@repo/api";
import { Card, CardContent, Badge, Button, Modal, useAuth } from "@repo/ui";

interface Customer {
  id: string;
  globalCustomerId?: string;
}

interface Product {
  id: string;
  stockQuantity: number;
  minStock: number;
}

interface Request {
  associationId: string;
  status: string;
}

interface WidgetDef {
  key: string;
  label: string;
  color: string;
}

const ALL_WIDGETS: WidgetDef[] = [
  { key: "totalCustomers", label: "Total Clientes", color: "text-blue-600 dark:text-blue-400" },
  { key: "linkedCustomers", label: "Clientes Vinculados", color: "text-green-600 dark:text-green-400" },
  { key: "pendingCustomers", label: "Clientes Pendientes", color: "text-yellow-600 dark:text-yellow-400" },
  { key: "pendingRequests", label: "Solicitudes de Vinculación", color: "text-orange-600 dark:text-orange-400" },
  { key: "totalProducts", label: "Total Productos", color: "text-purple-600 dark:text-purple-400" },
  { key: "lowStock", label: "Productos Stock Bajo", color: "text-red-600 dark:text-red-400" },
  { key: "outOfStock", label: "Productos Sin Stock", color: "text-gray-600 dark:text-gray-400" },
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
        api.get(`${basePath}/customers`).catch(() => ({ data: [] as Customer[] })),
        api.get(`${basePath}/associations/requests`).catch(() => ({ data: [] as Request[] })),
        api.get(`${basePath}/products`).catch(() => ({ data: [] as Product[] })),
      ]);

      const customers: Customer[] = custRes.data;
      const requests: Request[] = reqRes.data;
      const products: Product[] = prodRes.data;

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

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {widgets.map((w) => (
          <Card key={w.key}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{w.label}</p>
              <p className={`text-3xl font-bold mt-1 ${w.color}`}>
                {data[w.key as keyof typeof data]}
              </p>
            </CardContent>
          </Card>
        ))}
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
