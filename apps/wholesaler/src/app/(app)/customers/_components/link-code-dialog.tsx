"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Dialog } from "@repo/ui/dialog";
import { useToast } from "@repo/ui/toast";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Customer name, shown for context. */
  customerName?: string;
  code: string;
}

// Wholesaler customers don't get a password; they link their account using a
// one-time code. Shown once after creating the customer so the operator can
// share it (the code is also the QR payload the customer can scan).
export function LinkCodeDialog({ open, onClose, customerName, code }: Props) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Código de acceso del cliente"
      description={
        customerName
          ? `Comparte este código con ${customerName} para que vincule su cuenta.`
          : "Comparte este código con el cliente para que vincule su cuenta."
      }
      footer={<Button onClick={onClose}>Listo</Button>}
    >
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Código de enlace
          </p>
          <p className="truncate font-mono text-sm text-foreground">{code}</p>
        </div>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(code);
            setCopied(true);
            toast.success("Copiado", "Código de enlace");
            setTimeout(() => setCopied(false), 2000);
          }}
          className="ml-2 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Copiar código de enlace"
        >
          {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
        </button>
      </div>
    </Dialog>
  );
}
