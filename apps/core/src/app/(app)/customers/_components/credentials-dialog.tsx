"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@repo/ui/button";
import { Dialog } from "@repo/ui/dialog";
import { useToast } from "@repo/ui/toast";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  /** Optional account email shown alongside the password. */
  email?: string;
  password: string;
}

// Shown once after creating a customer or resetting its password: the
// temporary credentials are never returned again, so the operator must copy
// and share them now.
export function CredentialsDialog({ open, onClose, title, description, email, password }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={<Button onClick={onClose}>Listo</Button>}
    >
      <div className="space-y-2">
        {email && <CopyRow label="Usuario / correo" value={email} />}
        <CopyRow label="Contraseña temporal" value={password} mono />
      </div>
    </Dialog>
  );
}

function CopyRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className={`truncate text-sm text-foreground ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
      <button
        onClick={() => {
          navigator.clipboard?.writeText(value);
          setCopied(true);
          toast.success("Copiado", label);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="ml-2 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label={`Copiar ${label}`}
      >
        {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}
