"use client";

import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { Dialog } from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { Select } from "@repo/ui/select";
import { Stepper } from "@repo/ui/stepper";
import { useToast } from "@repo/ui/toast";
import { customersApi, geographyApi } from "@/lib/api-services";
import { useData } from "@/lib/use-api";
import type { Customer } from "@/lib/types";

const STEPS = ["Datos personales", "Identificación", "Dirección", "Confirmar"];

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Customer | null;
  onSaved?: () => void;
}

const empty = {
  fullName: "",
  email: "",
  username: "",
  company: "",
  country: "",
  region: "",
  active: true,
};

export function CustomerDialog({ open, onClose, editing, onSaved }: Props) {
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(empty);

  const { data: countries = [] } = useData(() => geographyApi.countries());
  const countryId = countries.find((c) => c.value === form.country)?.id ?? "";
  const { data: regions = [] } = useData(
    () => (countryId ? geographyApi.regions(countryId) : Promise.resolve([])),
    [countryId],
  );

  useEffect(() => {
    if (open) {
      setStep(0);
      setForm(
        editing
          ? {
              fullName: editing.fullName,
              email: editing.email,
              username: editing.username,
              company: editing.company ?? "",
              country: editing.country,
              region: editing.region ?? "",
              active: editing.active,
            }
          : empty,
      );
    }
  }, [open, editing]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const isEdit = !!editing;

  async function save() {
    if (isEdit) {
      await customersApi.update(editing!.id, { ...form });
      toast.success("Cliente actualizado", form.fullName);
    } else {
      await customersApi.create({
        ...form,
        createdAt: new Date().toISOString().slice(0, 10),
      });
      toast.success("Cliente creado", form.fullName);
    }
    onSaved?.();
    onClose();
  }

  const canNext =
    (step === 0 && form.fullName && form.email) ||
    (step === 1 && form.username) ||
    (step === 2 && form.country) ||
    step === 3;

  // Edit mode: single flat form, no stepper.
  if (isEdit) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title="Editar cliente"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={save}>Guardar cambios</Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre completo"><Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} /></Field>
          <Field label="Correo"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="Usuario"><Input value={form.username} onChange={(e) => set("username", e.target.value)} /></Field>
          <Field label="Empresa"><Input value={form.company} onChange={(e) => set("company", e.target.value)} /></Field>
          <Field label="País">
            <Select value={form.country} options={countries}
              onChange={(e) => { set("country", e.target.value); set("region", ""); }} />
          </Field>
          <Field label="Región">
            <Select value={form.region} options={regions}
              onChange={(e) => set("region", e.target.value)} />
          </Field>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Nuevo cliente"
      description="Registra un cliente minorista en 4 pasos"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}>
            {step === 0 ? "Cancelar" : "Atrás"}
          </Button>
          {step < 3 ? (
            <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)}>Siguiente</Button>
          ) : (
            <Button onClick={save}>Crear cliente</Button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        <div className="px-2 pb-6"><Stepper steps={STEPS} current={step} /></div>

        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre completo"><Input value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="María González" /></Field>
            <Field label="Correo"><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="maria@tienda.com" /></Field>
            <Field label="Empresa (opcional)"><Input value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Bodega María" /></Field>
          </div>
        )}
        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre de usuario"><Input value={form.username} onChange={(e) => set("username", e.target.value)} placeholder="mgonzalez" /></Field>
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="País">
              <Select value={form.country} options={countries}
                onChange={(e) => { set("country", e.target.value); set("region", ""); }} />
            </Field>
            <Field label="Región">
              <Select value={form.region} options={regions}
                onChange={(e) => set("region", e.target.value)} />
            </Field>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
            <Summary label="Nombre" value={form.fullName} />
            <Summary label="Correo" value={form.email} />
            <Summary label="Usuario" value={form.username} />
            <Summary label="Empresa" value={form.company || "—"} />
            <Summary label="Ubicación" value={`${form.region}, ${form.country}`} />
          </div>
        )}
      </div>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border py-1 last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
