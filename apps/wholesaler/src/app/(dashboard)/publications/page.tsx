"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Button, Badge, Input, Card, CardHeader, CardTitle, CardContent, Modal, useAuth } from "@repo/ui";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface Publication {
  id: string; title: string; description: string; photoUrls: string[];
  contactPhone?: string; contactEmail?: string; targetProvinces: string[];
  status: string; createdAt: string;
}

export default function PublicationsPage() {
  const { user } = useAuth();
  const slug = user?.tenantSlug ?? "";
  const basePath = slug ? `/tenant/${slug}` : "";

  const [pubs, setPubs] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [canPublish, setCanPublish] = useState(false);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", contactPhone: "", contactEmail: "", status: "active" });
  const [photos, setPhotos] = useState<string[]>([""]);
  const [targetProvinces, setTargetProvinces] = useState<string[]>([""]);
  const [allProvinces, setAllProvinces] = useState<string[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const [pubsRes, provRes, subRes] = await Promise.all([
        api.get(`${basePath}/publications`).catch(() => ({ data: [] })),
        api.get("/networking/provinces").catch(() => ({ data: [] })),
        api.get(`${basePath}/subscription`).catch(() => null),
      ]);
      setPubs(pubsRes.data);
      setAllProvinces(provRes.data);
      setCanPublish(subRes?.data?.publicationsEnabled ?? false);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [slug]);

  const openCreate = () => { setEditId(null); setForm({ title: "", description: "", contactPhone: "", contactEmail: "", status: "active" }); setPhotos([""]); setTargetProvinces([""]); setError(""); setModal(true); };
  const openEdit = (p: Publication) => { setEditId(p.id); setForm({ title: p.title, description: p.description, contactPhone: p.contactPhone ?? "", contactEmail: p.contactEmail ?? "", status: p.status }); setPhotos(p.photoUrls.length ? p.photoUrls : [""]); setTargetProvinces(p.targetProvinces.length ? p.targetProvinces : [""]); setError(""); setModal(true); };

  const save = async () => {
    if (!form.title.trim()) { setError("Título requerido"); return; }
    try {
      const payload = { ...form, photoUrls: photos.filter(p => p.trim()), targetProvinces: targetProvinces.filter(p => p.trim()) };
      if (editId) await api.put(`${basePath}/publications/${editId}`, payload);
      else await api.post(`${basePath}/publications`, payload);
      setModal(false); load();
    } catch (e: any) { setError(e?.response?.data?.error ?? "Error"); }
  };

  const del = async (id: string) => { try { await api.delete(`${basePath}/publications/${id}`); load(); } catch {} };

  if (loading) return <p className="p-8 text-muted-foreground">Cargando...</p>;

  if (!canPublish) return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Publicaciones</h2>
      <Card><CardContent className="py-12 text-center space-y-3">
        <p className="text-lg font-medium">Función no disponible en tu plan</p>
        <p className="text-sm text-muted-foreground">Actualiza tu plan para acceder a publicaciones y aparecer en el feed de Networking de clientes.</p>
      </CardContent></Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Publicaciones</h2>
        <Button onClick={openCreate}><Plus size={16} className="mr-1" /> Nueva</Button>
      </div>

      {pubs.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No hay publicaciones. Crea una para aparecer en el feed de clientes.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pubs.map(p => (
            <Card key={p.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{p.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={p.status === "active" ? "success" : "default"}>{p.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm line-clamp-2">{p.description}</p>
                {p.photoUrls.length > 0 && (
                  <div className="flex gap-1 overflow-x-auto">
                    {p.photoUrls.map((url, i) => <img key={i} src={url} alt="" className="w-20 h-20 object-cover rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />)}
                  </div>
                )}
                <div className="flex gap-1 text-xs text-muted-foreground">
                  {p.targetProvinces.slice(0, 3).map(p => <span key={p} className="bg-muted px-2 py-0.5 rounded-full">{p}</span>)}
                  {p.targetProvinces.length > 3 && <span>+{p.targetProvinces.length - 3}</span>}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>Editar</Button>
                  <Button variant="ghost" size="sm" onClick={() => del(p.id)}>Eliminar</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Editar Publicación" : "Nueva Publicación"} description="Crea una publicación para que los clientes te descubran en el feed de Networking.">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <Input id="title" label="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input id="description" label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input id="contactPhone" label="Teléfono contacto" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
            <Input id="contactEmail" label="Email contacto" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Fotos</label>
            {photos.map((url, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input id={`photo-${i}`} value={url} onChange={(e) => { const n = [...photos]; n[i] = e.target.value; setPhotos(n); }} placeholder="https://..." className="flex-1" />
                <Button variant="ghost" size="sm" onClick={() => setPhotos(photos.filter((_, j) => j !== i))}><Trash2 size={14} /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setPhotos([...photos, ""])}><Plus size={14} /> Agregar foto</Button>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Provincias objetivo</label>
            <p className="text-xs text-muted-foreground mb-2">Selecciona las provincias donde quieres que se muestre tu publicación.</p>
            <div className="flex flex-wrap gap-1 mb-2">
              {allProvinces.map(p => (
                <button key={p} className={`text-xs px-2 py-1 rounded-full border transition-colors ${targetProvinces.includes(p) ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
                  onClick={() => setTargetProvinces(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Estado</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={save}>{editId ? "Guardar" : "Crear"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
