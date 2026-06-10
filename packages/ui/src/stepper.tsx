"use client";

import { cn } from "./cn";
import { Check } from "lucide-react";

export interface Step {
  label: string;
  description?: string;
}

export function Stepper({
  steps,
  current,
}: {
  steps: Step[];
  current: number;
}) {
  return (
    <div className="flex items-start gap-0 mb-6">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  done && "bg-primary text-primary-foreground",
                  active && "bg-primary text-primary-foreground ring-2 ring-primary/30",
                  !done && !active && "bg-muted text-muted-foreground"
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <div className={cn("min-w-0 overflow-hidden", active ? "text-foreground" : "text-muted-foreground")}>
                <p className="text-sm font-medium leading-tight truncate">{step.label}</p>
                {step.description && (
                  <p className="text-xs leading-tight truncate">{step.description}</p>
                )}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-px flex-1 min-w-[12px] transition-colors self-center",
                  done ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
