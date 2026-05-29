"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, useAuth } from "@repo/ui";

interface Request {
  associationId: string;
  tenantId: string;
  customerProfileId: string;
  status: string;
  linkedVia: string;
  linkedAt?: string;
}

export default function AssociationsPage() {
  const { user } = useAuth();
  const slug = user?.tenantSlug ?? "";
  const basePath = slug ? `/tenant/${slug}` : "";

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await api.get(`${basePath}/associations/requests`);
      setRequests(res.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [slug]);

  const approve = async (id: string) => {
    try {
      await api.post(`${basePath}/associations/requests/${id}/approve`);
      load();
    } catch {}
  };

  const reject = async (id: string) => {
    try {
      await api.post(`${basePath}/associations/requests/${id}/reject`, { reason: "Rechazada" });
      load();
    } catch {}
  };

  if (loading) return <p className="p-8 text-muted-foreground">Cargando...</p>;

  const pending = requests.filter(r => r.status === "pending");

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Solicitudes de Vinculación</h2>

      <Card>
        <CardHeader><CardTitle className="text-base">Solicitudes Pendientes</CardTitle></CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay solicitudes pendientes.</p>
          ) : (
            <div className="space-y-3">
              {pending.map((r) => (
                <div key={r.associationId} className="flex items-center justify-between rounded-md border px-4 py-3">
                  <div>
                    <p className="font-medium text-sm">Cliente #{r.customerProfileId.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">Vía: {r.linkedVia === "request" ? "Solicitud manual" : r.linkedVia}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => approve(r.associationId)}>Aprobar</Button>
                    <Button variant="destructive" size="sm" onClick={() => reject(r.associationId)}>Rechazar</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
