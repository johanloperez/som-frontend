"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { Dialog } from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Select } from "@repo/ui/select";
import { Stepper } from "@repo/ui/stepper";
import { useToast } from "@repo/ui/toast";
import { geographyApi, plansApi, tenantsApi } from "@/lib/api-services";
import { useData } from "@/lib/use-api";

const STEPS = ["Empresa", "Administrador", "Dirección", "Plan"];

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

interface Credentials {
  code: string;
  adminEmail: string;
  password: string;
}

const emptyForm = {
  name: "",
  slug: "",
  taxId: "",
  adminName: "",
  adminEmail: "",
  address: "",
  country: "",
  region: "",
  planId: "",
  billingCycle: "monthly" as "monthly" | "yearly",
};

export function CreateTenantDialog({ open, onClose, onSaved }: Props) {
  const toast = useToast();
  const { data: plans = [] } = useData(() => plansApi.list());
  const { data: countryOptions = [] } = useData(() => geographyApi.countries());
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  const [form, setForm] = useState(emptyForm);

  const countryId = countryOptions.find((c) => c.value === form.country)?.id ?? "";
  const { data: regionOptions = [] } = useData(
    () => (countryId ? geographyApi.regions(countryId) : Promise.resolve([])),
    [countryId],
  );

  // Default to the first available plan/country once the lists load from the DB.
  useEffect(() => {
    const first = plans[0];
    if (first && !form.planId) setForm((f) => ({ ...f, planId: first.id }));
  }, [plans, form.planId]);
  useEffect(() => {
    const first = countryOptions[0];
    if (first && !form.country) setForm((f) => ({ ...f, country: first.value }));
  }, [countryOptions, form.country]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function reset() {
    setStep(0);
    setCredentials(null);
    setForm(emptyForm);
  }

  function handleClose() {
    onClose();
    setTimeout(reset, 200);
  }

  const canNext =
    (step === 0 && form.name && form.slug && form.taxId) ||
    (step === 1 && form.adminName && form.adminEmail) ||
    (step === 2 && form.address && form.country) ||
    step === 3;

  async function submit() {
    setSubmitting(true);
    try {
      const result = await tenantsApi.create({
        slug: form.slug,
        displayName: form.name,
        legalName: form.name,
        taxId: form.taxId,
        adminEmail: form.adminEmail,
        adminFullName: form.adminName,
        planId: form.planId,
        billingType: form.billingCycle,
        country: form.country,
        region: form.region,
        streetLine1: form.address,
      });
      setCredentials({
        code: result.code,
        adminEmail: result.adminEmail,
        password: result.password,
      });
      onSaved?.();
      toast.success("Mayorista creado", `${form.name} fue registrado correctamente`);
    } catch (e) {
      toast.error("No se pudo crear el mayorista", e instanceof Error ? e.message : "Inténtalo de nuevo");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={credentials ? "Mayorista creado" : "Nuevo mayorista"}
      description={
        credentials ? undefined : "Completa los 4 pasos para registrar la cuenta"
      }
      size="lg"
      footer={
        credentials ? (
          <Button onClick={handleClose}>Finalizar</Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => (step === 0 ? handleClose() : setStep((s) => s - 1))}
            >
              {step === 0 ? "Cancelar" : "Atrás"}
            </Button>
            {step < 3 ? (
              <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
                Siguiente
              </Button>
            ) : (
              <Button onClick={submit} loading={submitting}>Crear mayorista</Button>
            )}
          </>
        )
      }
    >
      {credentials ? (
        <CredentialsView credentials={credentials} />
      ) : (
        <div className="space-y-5">
          <div className="px-2 pb-6">
            <Stepper steps={STEPS} current={step} />
          </div>

          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre de la empresa">
                <Input
                  value={form.name}
                  onChange={(e) => {
                    set("name", e.target.value);
                    set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                  }}
                  placeholder="Distribuidora Andina"
                />
              </Field>
              <Field label="Slug">
                <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="distribuidora-andina" />
              </Field>
              <Field label="ID Fiscal">
                <Input value={form.taxId} onChange={(e) => set("taxId", e.target.value)} placeholder="20123456789" />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre del administrador">
                <Input value={form.adminName} onChange={(e) => set("adminName", e.target.value)} placeholder="Carlos Mendoza" />
              </Field>
              <Field label="Correo del administrador">
                <Input type="email" value={form.adminEmail} onChange={(e) => set("adminEmail", e.target.value)} placeholder="carlos@andina.com" />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Dirección" className="sm:col-span-2">
                <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Av. La Marina 123, Lima" />
              </Field>
              <Field label="País">
                <Select
                  value={form.country}
                  onChange={(e) => { set("country", e.target.value); set("region", ""); }}
                  options={countryOptions}
                />
              </Field>
              <Field label="Región">
                <Select
                  value={form.region}
                  onChange={(e) => set("region", e.target.value)}
                  options={regionOptions}
                  placeholder="Selecciona una región"
                  disabled={!regionOptions.length}
                />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Field label="Plan de suscripción">
                <Select
                  value={form.planId}
                  onChange={(e) => set("planId", e.target.value)}
                  options={plans.map((p) => ({
                    value: p.id,
                    label: `${p.name} — $${p.priceMonthly}/mes`,
                  }))}
                />
              </Field>
              <Field label="Ciclo de facturación">
                <Select
                  value={form.billingCycle}
                  onChange={(e) => set("billingCycle", e.target.value as "monthly" | "yearly")}
                  options={[
                    { value: "monthly", label: "Mensual" },
                    { value: "yearly", label: "Anual" },
                  ]}
                />
              </Field>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

function CredentialsView({ credentials }: { credentials: Credentials }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-lg bg-success/10 p-3 text-success">
        <Check className="size-5" />
        <p className="text-sm font-medium">
          La cuenta fue creada. Comparte estas credenciales con el administrador.
        </p>
      </div>
      <div className="space-y-2">
        <CredRow label="Código de mayorista" value={credentials.code} />
        <CredRow label="Correo de acceso" value={credentials.adminEmail} />
        <CredRow label="Contraseña temporal" value={credentials.password} />
      </div>
    </div>
  );
}

function CredRow({ label, value }: { label: string; value: string }) {
  const toast = useToast();
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="font-mono text-sm text-foreground">{value}</p>
      </div>
      <button
        onClick={() => {
          navigator.clipboard?.writeText(value);
          toast.success("Copiado", label);
        }}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Copiar"
      >
        <Copy className="size-4" />
      </button>
    </div>
  );
}
