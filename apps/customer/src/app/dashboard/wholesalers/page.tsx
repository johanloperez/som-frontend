"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Button, Badge, Input, Card, CardContent } from "@repo/ui";
import { ChevronLeft, ChevronRight, Phone, Mail, Link2, Search } from "lucide-react";

interface Publication {
  id: string; title: string; description: string; photoUrls: string[];
  contactPhone?: string; contactEmail?: string; targetProvinces: string[];
  status: string; tenantName: string; tenantSlug: string; createdAt: string;
}

export default function WholesalersFeedPage() {
  const [pubs, setPubs] = useState<Publication[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("");
  const [codeSearch, setCodeSearch] = useState("");
  const [codeError, setCodeError] = useState("");
  const [activeImage, setActiveImage] = useState<Record<string, number>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [pubsRes, provRes] = await Promise.all([
        api.get("/networking/feed", { params: { search: search || undefined, province: province || undefined } }),
        api.get("/networking/provinces"),
      ]);
      setPubs(pubsRes.data);
      setProvinces(provRes.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const claimCode = async () => {
    if (!codeSearch.trim()) { setCodeError("Ingresa un código"); return; }
    setCodeError("");
    try {
      await api.post("/associations/claim-by-code", { code: codeSearch.trim() });
      setCodeSearch("");
      alert("¡Vinculación exitosa! El mayorista aparece ahora en Mis Asociaciones.");
    } catch (e: any) { setCodeError(e?.response?.data?.error ?? "Código inválido"); }
  };

  const nextImage = (pubId: string, len: number) => {
    setActiveImage(prev => ({ ...prev, [pubId]: ((prev[pubId] ?? 0) + 1) % len }));
  };
  const prevImage = (pubId: string, len: number) => {
    setActiveImage(prev => ({ ...prev, [pubId]: ((prev[pubId] ?? 0) - 1 + len) % len }));
  };

  if (loading) return <p className="p-8 text-muted-foreground">Cargando feed...</p>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
      <h2 className="text-3xl font-bold">Mayoristas</h2>
      <p className="text-sm text-muted-foreground mt-1">Descubre nuevos proveedores a través de sus publicaciones.</p>
      </div>

      {/* Search by code */}
      <Card>
        <CardContent className="py-3 space-y-3">
          <p className="text-sm font-medium">¿Tienes un código de vinculación?</p>
          <div className="flex gap-2">
            <Input id="codeSearch" value={codeSearch} onChange={(e) => setCodeSearch(e.target.value)} placeholder="ABC-ABCDEFGH" />
            <Button onClick={claimCode}>Vincular</Button>
          </div>
          {codeError && <p className="text-sm text-destructive">{codeError}</p>}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="w-full rounded-lg bg-muted/40 pl-9 pr-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20" placeholder="Buscar por título..." value={search} onChange={(e) => { setSearch(e.target.value); }} onKeyDown={(e) => { if (e.key === "Enter") load(); }} />
        </div>
        <select className="rounded-lg bg-muted/40 px-3 py-2 text-sm" value={province} onChange={(e) => { setProvince(e.target.value); setTimeout(load, 100); }}>
          <option value="">Todas las provincias</option>
          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <Button variant="outline" size="sm" onClick={load}>Filtrar</Button>
      </div>

      {/* Feed */}
      {pubs.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">No hay publicaciones disponibles. Usa un código de vinculación o espera a que los mayoristas publiquen.</CardContent></Card>
      ) : (
        <div className="space-y-6">
          {pubs.map(p => {
            const imgIdx = activeImage[p.id] ?? 0;
            return (
              <Card key={p.id} className="overflow-hidden">
                {/* Photo carousel */}
                {p.photoUrls.length > 0 && (
                  <div className="relative aspect-video bg-muted">
                    <img src={p.photoUrls[imgIdx]} alt={p.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    {p.photoUrls.length > 1 && (
                      <>
                        <button className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 hover:bg-black/60" onClick={() => prevImage(p.id, p.photoUrls.length)}><ChevronLeft size={20} /></button>
                        <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 hover:bg-black/60" onClick={() => nextImage(p.id, p.photoUrls.length)}><ChevronRight size={20} /></button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">{p.photoUrls.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full ${i === imgIdx ? "bg-white" : "bg-white/40"}`} />)}</div>
                      </>
                    )}
                  </div>
                )}

                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="text-lg font-bold">{p.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{p.tenantSlug}</p>
                  </div>

                  <p className="text-sm">{p.description}</p>

                  {p.targetProvinces.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.targetProvinces.map(prov => <span key={prov} className="text-xs bg-muted px-2 py-0.5 rounded-full">{prov}</span>)}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {p.contactPhone && <span className="flex items-center gap-1"><Phone size={14} /> {p.contactPhone}</span>}
                    {p.contactEmail && <span className="flex items-center gap-1"><Mail size={14} /> {p.contactEmail}</span>}
                  </div>

                  <Button className="w-full" onClick={async () => {
                    try {
                      const res = await api.get(`/directory/wholesalers?search=${p.tenantSlug}`);
                      const tenant = res.data.find((t: any) => t.slug === p.tenantSlug);
                      if (tenant) {
                        await api.post("/associations/requests", { tenantId: tenant.tenantId, message: "Me interesa tu publicación", shareProfile: true, shareCreditScore: false, shareContactData: true });
                        alert("¡Solicitud enviada! El mayorista te responderá pronto.");
                      }
                    } catch (e: any) { alert(e?.response?.data?.error ?? "Error al enviar solicitud"); }
                  }}>
                    <Link2 size={16} className="mr-2" /> Solicitar Vinculación
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
