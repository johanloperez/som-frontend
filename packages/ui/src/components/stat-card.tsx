"use client";

import { type LucideIcon } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/utils";

export type AccentColor = "violet" | "cyan" | "pink" | "amber";

const accentMap: Record<AccentColor, { border: string; bg: string; text: string }> = {
  violet: { border: "border-t-accent-1", bg: "bg-accent-1/10", text: "text-accent-1" },
  cyan: { border: "border-t-accent-2", bg: "bg-accent-2/10", text: "text-accent-2" },
  pink: { border: "border-t-accent-3", bg: "bg-accent-3/10", text: "text-accent-3" },
  amber: { border: "border-t-accent-4", bg: "bg-accent-4/10", text: "text-accent-4" },
};

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  accent: AccentColor;
  hint?: string;
  onClick?: () => void;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  hint,
  onClick,
}: StatCardProps) {
  const colors = accentMap[accent];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "group flex flex-col items-start gap-3 rounded-xl border border-border border-t-4 bg-card p-5 text-left shadow-sm transition-all",
        colors.border,
        onClick && "cursor-pointer hover:shadow-lg hover:-translate-y-0.5",
      )}
    >
      <div className="flex w-full items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-lg",
            colors.bg,
            colors.text,
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
      <span className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        {value}
      </span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </button>
  );
}
