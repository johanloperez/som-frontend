"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Button, Input, Card, CardHeader, CardTitle, CardContent, useAuth } from "@repo/ui";

export default function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ fullName: "", email: "", businessName: "", taxId: "", taxAddress: "", phoneE164: "", country: "", region: "", city: "", streetLine1: "", streetLine2: "", postalCode: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await api.get("/customers/me");
      const p = res.data;
      setForm({
        fullName: p.fullName || "", email: p.email || "", businessName: p.businessName || "",
        taxId: p.taxId || "", taxAddress: p.taxAddress || "", phoneE164: p.phoneE164 || "",
        country: p.country || "", region: p.region || "", city: p.city || "",
        streetLine1: p.streetLine1 || "", streetLine2: p.streetLine2 || "", postalCode: p.postalCode || ""
      });
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setError(""); setSuccess("");
    try {
      await api.put("/customers/me/profile", form);
      setSuccess("Perfil actualizado correctamente");
    } catch (e: any) { setError(e?.response?.data?.error ?? "Error al guardar"); }
  };

  if (loading) return <p className="p-8 text-muted-foreground">Cargando...</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-3xl font-bold">Mi Perfil</h2>

      <Card>
        <CardHeader><CardTitle className="text-base">Datos Personales</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input id="fullName" label="Nombre completo" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            <Input id="email" label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <Input id="businessName" label="Empresa" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input id="taxId" label="ID Fiscal" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
            <Input id="phoneE164" label="Teléfono" value={form.phoneE164} onChange={(e) => setForm({ ...form, phoneE164: e.target.value })} />
          </div>
          <Input id="taxAddress" label="Dirección fiscal" value={form.taxAddress} onChange={(e) => setForm({ ...form, taxAddress: e.target.value })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Dirección</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Input id="country" label="País" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
            <Input id="region" label="Región" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
            <Input id="city" label="Ciudad" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <Input id="streetLine1" label="Dirección" value={form.streetLine1} onChange={(e) => setForm({ ...form, streetLine1: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input id="streetLine2" label="Dirección 2" value={form.streetLine2} onChange={(e) => setForm({ ...form, streetLine2: e.target.value })} />
            <Input id="postalCode" label="Código postal" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}
      <Button onClick={save}>Guardar Cambios</Button>
    </div>
  );
}
