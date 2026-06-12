"use client";

import { Loader2 } from "lucide-react";
import * as React from "react";
import { onLoadingChange } from "@repo/api";

export function LoadingOverlay() {
  const [active, setActive] = React.useState(false);

  React.useEffect(() => onLoadingChange(setActive), []);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-3 shadow-lg">
        <Loader2 className="size-5 animate-spin text-primary" />
        <span className="text-sm font-medium text-card-foreground">Cargando…</span>
      </div>
    </div>
  );
}
