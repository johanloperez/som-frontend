"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  Database,
  MapPin,
  User,
} from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { ConfirmDialog } from "@repo/ui/confirm-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/tabs";
import { useToast } from "@repo/ui/toast";
import { plansApi, tenantsApi } from "@/lib/api-services";
import { useData, useDataItem } from "@/lib/use-api";
import { getTenantStatusMeta } from "@/lib/tenant-status";
import { BillingTab } from "./_tabs/billing-tab";

export default function TenantDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { data: plans = [] } = useData(() => plansApi.list());
  const { data: tenant, refetch } = useDataItem(() => tenantsApi.get(params.id), params.id);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (!tenant) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-muted-foreground">Mayorista no encontrado.</p>
        <Button variant="outline" onClick={() => router.push("/tenants")}>
          Volver
        </Button>
      </div>
    );
  }

  const meta = getTenantStatusMeta(tenant.status);

  return (
    <div>
      <button
        onClick={() => router.push("/tenants")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Mayoristas
      </button>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="size-6" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{tenant.name}</h1>
              <Badge variant={meta.variant}>{meta.label}</Badge>
            </div>
            <p className="font-mono text-sm text-muted-foreground">{tenant.code}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="subscription">Suscripción</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="billing">Facturación</TabsTrigger>
        </TabsList>

        {/* INFO */}
        <TabsContent value="info">
          <div className="grid gap-4 lg:grid-cols-3">
            <InfoCard icon={Building2} title="Empresa">
              <Row label="Nombre" value={tenant.name} />
              <Row label="Slug" value={tenant.slug} mono />
              <Row label="ID Fiscal" value={tenant.taxId} mono />
              <Row label="País" value={tenant.country} />
            </InfoCard>
            <InfoCard icon={User} title="Administrador">
              <Row label="Nombre" value={tenant.adminName} />
              <Row label="Correo" value={tenant.adminEmail} />
            </InfoCard>
            <InfoCard icon={MapPin} title="Dirección">
              <Row label="Dirección" value={tenant.address} />
              <Row label="Registrado" value={tenant.createdAt} />
            </InfoCard>
          </div>
        </TabsContent>

        {/* SUBSCRIPTION */}
        <TabsContent value="subscription">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Plan activo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold text-foreground">{tenant.planName}</span>
                  <Badge>{tenant.billingCycle === "monthly" ? "Mensual" : "Anual"}</Badge>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {plans
                    .filter((p) => p.id !== tenant.planId)
                    .map((p) => (
                      <Button
                        key={p.id}
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await tenantsApi.update(tenant.id, { planId: p.id, planName: p.name });
                          refetch();
                          toast.success("Plan actualizado", `Ahora: ${p.name}`);
                        }}
                      >
                        Cambiar a {p.name}
                      </Button>
                    ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const next = tenant.billingCycle === "monthly" ? "yearly" : "monthly";
                    await tenantsApi.update(tenant.id, { billingCycle: next });
                    refetch();
                    toast.success("Ciclo actualizado");
                  }}
                >
                  <Calendar className="size-4" />
                  Cambiar a ciclo {tenant.billingCycle === "monthly" ? "anual" : "mensual"}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle className="text-destructive">Zona de peligro</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-muted-foreground">
                  Cancelar la suscripción detiene la facturación y revoca el acceso del
                  mayorista al final del periodo.
                </p>
                <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                  Cancelar suscripción
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* BACKUPS */}
        <TabsContent value="backups">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de backups</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Row label="Frecuencia" value="Diaria · 03:00 UTC" />
                <Row label="Retención" value="30 días" />
                <Row label="Último backup" value="2026-06-10 03:00" />
                <Row label="Tamaño" value="142 MB" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Backup manual</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-muted-foreground">
                  Genera una copia de seguridad inmediata de los datos de este mayorista.
                </p>
                <Button
                  variant="outline"
                  onClick={() => toast.success("Backup iniciado", "Te notificaremos al completarse")}
                >
                  <Database className="size-4" />
                  Ejecutar backup ahora
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* BILLING */}
        <TabsContent value="billing">
          <BillingTab tenantName={tenant.name} />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="¿Cancelar la suscripción?"
        description={`La cuenta de ${tenant.name} pasará a estado cancelado.`}
        confirmLabel="Sí, cancelar"
        onConfirm={async () => {
          await tenantsApi.update(tenant.id, { status: "cancelled" });
          refetch();
          toast.success("Suscripción cancelada", tenant.name);
        }}
      />
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Building2;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-1.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium text-foreground ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}
