"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { cn } from "./cn";
import { CheckCircle, XCircle, X, Undo2 } from "lucide-react";

type ToastType = "success" | "error";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  undo?: () => void;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string, undo?: () => void) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((type: ToastType, message: string, undo?: () => void) => {
    const id = ++nextId;
    setItems((prev) => [...prev, { id, type, message, undo }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[10002] flex flex-col gap-2 max-w-sm">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg text-sm animate-in slide-in-from-right-2",
              item.type === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            )}
          >
            {item.type === "success" ? (
              <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
            )}
            <p className="flex-1">{item.message}</p>
            <div className="flex gap-1 shrink-0">
              {item.undo && (
                <button
                  onClick={() => { item.undo?.(); dismiss(item.id); }}
                  className="rounded p-1 hover:bg-white/20 transition-colors"
                >
                  <Undo2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => dismiss(item.id)}
                className="rounded p-1 hover:bg-white/20 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
