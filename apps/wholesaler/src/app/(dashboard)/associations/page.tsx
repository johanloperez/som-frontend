"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, useAuth, useRealtime } from "@repo/ui";

interface Request {
  associationId: string;
  tenantId: string;
  customerProfileId: string;
  status: string;
  linkedVia: string;
  linkedAt?: string;
  businessName?: string;
  email?: string;
  phoneE164?: string;
  taxId?: string;
  country?: string;
  region?: string;
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
  useRealtime("association-request", "*", () => { load(); });

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
                <div key={r.associationId} className="rounded-xl border px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-base">{r.businessName || `Cliente #${r.customerProfileId.slice(0, 8)}`}</p>
                        <Badge variant="warning">Pendiente</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                        {r.email && <p className="text-muted-foreground"><span className="text-xs uppercase tracking-wider">Email:</span> {r.email}</p>}
                        {r.phoneE164 && <p className="text-muted-foreground"><span className="text-xs uppercase tracking-wider">Tel:</span> {r.phoneE164}</p>}
                        {r.taxId && <p className="text-muted-foreground"><span className="text-xs uppercase tracking-wider">ID Fiscal:</span> {r.taxId}</p>}
                        {r.country && <p className="text-muted-foreground"><span className="text-xs uppercase tracking-wider">País:</span> {r.country}{r.region ? `, ${r.region}` : ""}</p>}
                      </div>
                      <p className="text-xs text-muted-foreground">Vía: {r.linkedVia === "request" ? "Solicitud manual" : r.linkedVia}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="sm" onClick={() => approve(r.associationId)}>Aprobar</Button>
                      <Button variant="destructive" size="sm" onClick={() => reject(r.associationId)}>Rechazar</Button>
                    </div>
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
