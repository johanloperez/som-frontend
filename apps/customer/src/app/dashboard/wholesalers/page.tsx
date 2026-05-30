"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Card, CardContent, Button, Input, Modal, DataTable, Badge } from "@repo/ui";
import type { ColumnDef } from "@tanstack/react-table";

interface Wholesaler {
  tenantId: string;
  slug: string;
  displayName: string;
  legalName: string;
  featured: boolean;
  status?: string;
}

export default function WholesalersPage() {
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [requestModal, setRequestModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Wholesaler | null>(null);
  const [message, setMessage] = useState("");
  const [shareProfile, setShareProfile] = useState(true);
  const [error, setError] = useState("");

  const load = async (q?: string) => {
    setLoading(true);
    try {
      const [dirRes, assocRes] = await Promise.all([
        api.get("/directory/wholesalers", { params: { search: q || undefined } }),
        api.get("/associations/my").catch(() => ({ data: [] })),
      ]);

      const associations = assocRes.data as { tenantId: string; status: string }[];
      const associatedIds = new Set(associations.map(a => a.tenantId));

      const filtered = dirRes.data
        .filter((w: Wholesaler) => !associatedIds.has(w.tenantId))
        .map((w: Wholesaler) => ({ ...w, status: undefined }));

      setWholesalers(filtered);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const sendRequest = async () => {
    if (!selectedTenant) return;
    try {
      await api.post("/associations/requests", {
        tenantId: selectedTenant.tenantId,
        message: message || null,
        shareProfile,
        shareCreditScore: false,
        shareContactData: true,
      });
      setRequestModal(false);
      setMessage("");
      setError("");
      load();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "Error al enviar solicitud");
    }
  };

  const columns: ColumnDef<Wholesaler>[] = [
    { header: "Nombre", accessorKey: "displayName" },
    { header: "Razón Social", accessorKey: "legalName" },
    { header: "Slug", accessorKey: "slug" },
    {
      header: "Acción", id: "action",
      cell: ({ row }) => (
        <Button variant="outline" size="sm" onClick={() => { setSelectedTenant(row.original); setRequestModal(true); setError(""); }}>
          Solicitar Vinculación
        </Button>
      ),
    },
  ];

  if (loading) return <p className="p-8 text-muted-foreground">Cargando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Mayoristas</h2>
        <div className="flex gap-2">
          <Input id="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar mayorista..." />
          <Button variant="outline" onClick={() => load(search)}>Buscar</Button>
        </div>
      </div>

      {wholesalers.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No se encontraron mayoristas disponibles.</CardContent></Card>
      ) : (
        <DataTable columns={columns} data={wholesalers} searchable={false} pagination={true} />
      )}

      <Modal open={requestModal} onClose={() => setRequestModal(false)} title="Solicitar Vinculación" description={`Envía una solicitud a ${selectedTenant?.displayName}.`}>
        <div className="space-y-3">
          <Input id="message" label="Mensaje (opcional)" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Hola, me interesaría comprar sus productos..." />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={shareProfile} onChange={(e) => setShareProfile(e.target.checked)} className="accent-primary" />
            Compartir mi perfil con el mayorista
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setRequestModal(false)}>Cancelar</Button>
            <Button onClick={sendRequest}>Enviar Solicitud</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
