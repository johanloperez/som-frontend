"use client";

import { useState } from "react";
import { Button } from "@repo/ui/button";
import { Dialog } from "@repo/ui/dialog";
import { Label } from "@repo/ui/label";
import { Select } from "@repo/ui/select";
import { Textarea } from "@repo/ui/textarea";
import { useToast } from "@repo/ui/toast";
import { tenantsApi } from "@/lib/api-services";
import type { Tenant } from "@/lib/types";

const REASONS = [
  { value: "non-payment", label: "Falta de pago" },
  { value: "abuse", label: "Uso indebido / abuso" },
  { value: "request", label: "Solicitud del cliente" },
  { value: "fraud", label: "Sospecha de fraude" },
  { value: "other", label: "Otra" },
];

interface Props {
  tenant: Tenant | null;
  mode: "suspend" | "reactivate";
  onClose: () => void;
  onSaved?: () => void;
}

export function SuspendDialog({ tenant, mode, onClose, onSaved }: Props) {
  const toast = useToast();
  const [reason, setReason] = useState("non-payment");
  const [note, setNote] = useState("");

  if (!tenant) return null;
  const suspending = mode === "suspend";

  async function confirm() {
    await tenantsApi.update(tenant!.id, { status: suspending ? "suspended" : "active" });
    toast.success(
      suspending ? "Mayorista suspendido" : "Mayorista reactivado",
      tenant!.name,
    );
    onSaved?.();
    onClose();
  }

  return (
    <Dialog
      open={!!tenant}
      onClose={onClose}
      title={suspending ? "Suspender mayorista" : "Reactivar mayorista"}
      description={tenant.name}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant={suspending ? "destructive" : "default"} onClick={confirm}>
            {suspending ? "Suspender" : "Reactivar"}
          </Button>
        </>
      }
    >
      {suspending ? (
        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Razón de suspensión</Label>
            <Select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              options={REASONS}
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Nota (opcional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Detalles adicionales para el registro interno…"
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          El mayorista recuperará el acceso completo a su portal y se reanudará la
          facturación. ¿Deseas continuar?
        </p>
      )}
    </Dialog>
  );
}
