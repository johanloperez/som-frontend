"use client";

import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { Dialog } from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Stepper } from "@repo/ui/stepper";
import { Switch } from "@repo/ui/switch";
import { Textarea } from "@repo/ui/textarea";
import { useToast } from "@repo/ui/toast";
import { plansApi } from "@/lib/api-services";
import type { Plan, PlanFeatures } from "@/lib/types";

const STEPS = ["Información", "Límites", "Características", "Confirmar"];

const FEATURE_LABELS: Record<keyof PlanFeatures, string> = {
  backup: "Backups automáticos",
  directory: "Directorio de mayoristas",
  push: "Notificaciones push",
  reports: "Reportes avanzados",
  publications: "Publicaciones (networking)",
};

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Plan | null;
  onSaved?: () => void;
}

const empty = {
  name: "",
  description: "",
  priceMonthly: 0,
  priceYearly: 0,
  maxProducts: 100,
  maxCustomers: 50,
  maxSellers: 2,
  features: { backup: false, directory: false, push: false, reports: false, publications: false } as PlanFeatures,
  active: true,
};

export function PlanDialog({ open, onClose, editing, onSaved }: Props) {
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(empty);
  const isEdit = !!editing;

  useEffect(() => {
    if (open) {
      setStep(0);
      setForm(editing ? { ...editing } : empty);
    }
  }, [open, editing]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function toggle(key: keyof PlanFeatures) {
    setForm((f) => ({ ...f, features: { ...f.features, [key]: !f.features[key] } }));
  }

  async function save() {
    if (isEdit) {
      await plansApi.update(editing!.id, { ...form });
      toast.success("Plan actualizado", form.name);
    } else {
      await plansApi.create({ ...form });
      toast.success("Plan creado", form.name);
    }
    onSaved?.();
    onClose();
  }

  const limitsStep = (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label="Máx. productos"><Input type="number" value={form.maxProducts} onChange={(e) => set("maxProducts", +e.target.value)} /></Field>
      <Field label="Máx. clientes"><Input type="number" value={form.maxCustomers} onChange={(e) => set("maxCustomers", +e.target.value)} /></Field>
      <Field label="Máx. vendedores"><Input type="number" value={form.maxSellers} onChange={(e) => set("maxSellers", +e.target.value)} /></Field>
    </div>
  );

  const featuresStep = (
    <div className="space-y-1">
      {(Object.keys(FEATURE_LABELS) as (keyof PlanFeatures)[]).map((key) => (
        <div key={key} className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
          <Label>{FEATURE_LABELS[key]}</Label>
          <Switch checked={form.features[key]} onCheckedChange={() => toggle(key)} />
        </div>
      ))}
    </div>
  );

  const infoStep = (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Nombre del plan"><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Profesional" /></Field>
      <div className="sm:col-span-2">
        <Label className="mb-1.5 block">Descripción</Label>
        <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} />
      </div>
      <Field label="Precio mensual (USD)"><Input type="number" value={form.priceMonthly} onChange={(e) => set("priceMonthly", +e.target.value)} /></Field>
      <Field label="Precio anual (USD)"><Input type="number" value={form.priceYearly} onChange={(e) => set("priceYearly", +e.target.value)} /></Field>
    </div>
  );

  if (isEdit) {
    return (
      <Dialog open={open} onClose={onClose} title="Editar plan" size="lg"
        footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={save}>Guardar</Button></>}>
        <div className="space-y-5">
          {infoStep}
          <div><p className="mb-2 text-sm font-semibold">Límites</p>{limitsStep}</div>
          <div><p className="mb-2 text-sm font-semibold">Características</p>{featuresStep}</div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} title="Nuevo plan" description="Define un plan de suscripción en 4 pasos" size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}>{step === 0 ? "Cancelar" : "Atrás"}</Button>
          {step < 3 ? (
            <Button disabled={step === 0 && !form.name} onClick={() => setStep((s) => s + 1)}>Siguiente</Button>
          ) : (
            <Button onClick={save}>Crear plan</Button>
          )}
        </>
      }>
      <div className="space-y-5">
        <div className="px-2 pb-6"><Stepper steps={STEPS} current={step} /></div>
        {step === 0 && infoStep}
        {step === 1 && limitsStep}
        {step === 2 && featuresStep}
        {step === 3 && (
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <Row label="Nombre" value={form.name} />
            <Row label="Precio" value={`$${form.priceMonthly}/mes · $${form.priceYearly}/año`} />
            <Row label="Límites" value={`${form.maxProducts} prod · ${form.maxCustomers} clientes · ${form.maxSellers} vend.`} />
            <Row label="Características" value={Object.values(form.features).filter(Boolean).length + " activas"} />
          </div>
        )}
      </div>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label className="mb-1.5 block">{label}</Label>{children}</div>;
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border py-1 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
