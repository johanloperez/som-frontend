"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, description, children }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div ref={ref} style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)" }} onClick={onClose} />
      <div style={{ position: "relative", zIndex: 10000, width: "100%", maxWidth: "32rem", borderRadius: "0.5rem", border: "1px solid var(--color-border, #e5e7eb)", backgroundColor: "var(--color-background, #fff)", padding: "1.5rem", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", color: "var(--color-foreground, #000)" }}>
        <div style={{ marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>{title}</h2>
          {description && <p style={{ fontSize: "0.875rem", color: "var(--color-muted-foreground, #666)", marginTop: "0.25rem" }}>{description}</p>}
        </div>
        {children}
        <button
          onClick={onClose}
          style={{ position: "absolute", right: "1rem", top: "1rem", borderRadius: "0.25rem", opacity: 0.7, background: "none", border: "none", cursor: "pointer", color: "var(--color-foreground, #000)" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
    </div>,
    document.body
  );
}
