"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge, Modal, useRealtime } from "@repo/ui";
import { useRouter } from "next/navigation";

interface Association {
  associationId: string;
  tenantId: string;
  customerProfileId: string;
  status: string;
  linkedVia: string;
  linkedAt?: string;
}

interface TenantInfo {
  tenantId: string;
  slug: string;
  displayName: string;
}

export default function AssociationsPage() {
  const router = useRouter();
  const [associations, setAssociations] = useState<(Association & { tenant?: TenantInfo })[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    try {
      const res = await api.get("/associations/my");
      const list = res.data as Association[];
      const enriched = await Promise.all(
        list.map(async (a) => {
          try {
            const t = await api.get(`/directory/wholesalers/${a.tenantId}`);
            return { ...a, tenant: t.data as TenantInfo };
          } catch {
            return { ...a };
          }
        })
      );
      setAssociations(enriched);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);
  useRealtime("association", "*", () => { load(); });

  const entrar = async (tenant: TenantInfo) => {
    try {
      const res = await api.post("/auth/exchange-token", { tenantSlug: tenant.slug });
      const data = res.data as { accessToken: string; userId: string; email: string; fullName: string; role: string; permissions: { code: string; scope: string | null }[]; tenantSlug: string };
      sessionStorage.setItem("auth_user", JSON.stringify({
        id: data.userId, email: data.email, fullName: data.fullName,
        role: data.role, permissions: data.permissions,
        tenantSlug: data.tenantSlug, portal: "wholesaler",
      }));
      sessionStorage.setItem("access_token", data.accessToken);
      window.location.href = "/dashboard/orders";
    } catch {}
  };

  const claimCode = async () => {
    if (!code.trim()) { setError("Ingresa un código"); return; }
    setError("");
    setSuccess("");
    try {
      await api.post("/associations/claim-by-code", { code: code.trim() });
      setSuccess("¡Asociación exitosa!");
      setCode("");
      load();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Error al reclamar código");
    }
  };

  if (loading) return <p className="p-8 text-muted-foreground">Cargando...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Mis Asociaciones</h2>

      <Card>
        <CardHeader><CardTitle className="text-base">Reclamar Código</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Ingresa el código que te dio tu mayorista para vincularte.</p>
          <div className="flex gap-2">
            <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABC-ABCDEFGH" className="flex-1" />
            <Button onClick={claimCode}>Reclamar</Button>
          </div>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          {success && <p className="text-sm text-green-600 dark:text-green-400 mt-2">{success}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Mayoristas Vinculados</CardTitle></CardHeader>
        <CardContent>
          {associations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tienes asociaciones activas. Reclama un código o solicita vincularte a un mayorista.</p>
          ) : (
            <div className="space-y-3">
              {associations.map((a) => (
                <div key={a.associationId} className="flex items-center justify-between rounded-md border px-4 py-3">
                  <div>
                    <p className="font-medium">{a.tenant?.displayName ?? a.tenantId}</p>
                    <p className="text-xs text-muted-foreground">Vía: {a.linkedVia === "code" ? "Código" : a.linkedVia === "qr" ? "QR" : "Solicitud"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={a.status === "active" ? "success" : a.status === "pending" ? "warning" : "destructive"}>
                      {a.status === "active" ? "Activo" : a.status === "pending" ? "Pendiente" : a.status}
                    </Badge>
                    {a.status === "active" && a.tenant && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => entrar(a.tenant!)}>Entrar</Button>
                        <Button size="sm" variant="ghost" onClick={async () => {
                          try { await api.delete(`/associations/${a.tenantId}`); load(); } catch {}
                        }}>Desvincularse</Button>
                      </>
                    )}
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
