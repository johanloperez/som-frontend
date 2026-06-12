"use client";

import { useState } from "react";
import { Avatar } from "@repo/ui/avatar";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { PageHeader } from "@repo/ui/page-header";
import { Select } from "@repo/ui/select";
import { Switch } from "@repo/ui/switch";
import { useToast } from "@repo/ui/toast";
import { geographyApi } from "@/lib/api-services";
import { useData } from "@/lib/use-api";
import { useAuth } from "@/lib/use-auth";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-1.5 block">{label}</Label>{children}</div>;
}

export default function SettingsPage() {
  const toast = useToast();
  const { user } = useAuth();
  const { data: countryOptions = [] } = useData(() => geographyApi.countries());

  const [profile, setProfile] = useState({
    company: user?.fullName ?? "",
    email: user?.email ?? "",
    phone: "",
    country: "",
    region: "",
  });

  const countryId = countryOptions.find((c) => c.value === profile.country)?.id ?? "";
  const { data: regionOptions = [] } = useData(
    () => (countryId ? geographyApi.regions(countryId) : Promise.resolve([])),
    [countryId],
  );

  const [prefs, setPrefs] = useState({
    orderAlerts: true,
    stockAlerts: true,
    directoryAlerts: false,
    weeklyReport: true,
  });

  function setP<K extends keyof typeof profile>(k: K, v: string) {
    setProfile((p) => ({ ...p, [k]: v }));
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Configuración" subtitle="Administra tu cuenta y preferencias" />

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Perfil del negocio</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={profile.company} size="lg" />
              <div>
                <p className="font-medium text-foreground">{profile.company}</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre del negocio"><Input value={profile.company} onChange={(e) => setP("company", e.target.value)} /></Field>
              <Field label="Correo"><Input type="email" value={profile.email} onChange={(e) => setP("email", e.target.value)} /></Field>
              <Field label="Teléfono"><Input value={profile.phone} onChange={(e) => setP("phone", e.target.value)} /></Field>
              <Field label="País"><Select value={profile.country} onChange={(e) => { setP("country", e.target.value); setP("region", ""); }} options={countryOptions} /></Field>
              <Field label="Región"><Select value={profile.region} onChange={(e) => setP("region", e.target.value)} options={regionOptions} placeholder="Selecciona una región" disabled={!regionOptions.length} /></Field>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => toast.success("Perfil actualizado", profile.company)}>Guardar cambios</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notificaciones</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {([
              ["orderAlerts", "Nuevos pedidos", "Recibe un aviso cuando un cliente realiza un pedido"],
              ["stockAlerts", "Stock bajo", "Te avisamos cuando un producto está por agotarse"],
              ["directoryAlerts", "Solicitudes del directorio", "Conexiones de otros mayoristas de la red"],
              ["weeklyReport", "Reporte semanal", "Resumen de ventas cada lunes por correo"],
            ] as const).map(([key, title, desc]) => (
              <div key={key} className="flex items-center justify-between border-b border-border py-3 last:border-0">
                <div className="pr-4">
                  <p className="font-medium text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
                <Switch checked={prefs[key]} onCheckedChange={(v) => setPrefs((p) => ({ ...p, [key]: v }))} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sesión</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Cierra tu sesión en este dispositivo.</p>
            <Button variant="outline" onClick={() => { window.location.href = "/login"; }}>Cerrar sesión</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
