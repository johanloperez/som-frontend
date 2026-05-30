"use client";

import { useAuth } from "@repo/ui";
import { Handshake, Store } from "lucide-react";

export default function CustomerDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <p className="text-muted-foreground mb-6">Bienvenido, {user?.fullName}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a href="/dashboard/associations" className="rounded-2xl shadow-card hover:shadow-card-hover p-6 text-center transition-all duration-200"
          style={{ backgroundColor: "var(--color-card-1-bg)", color: "var(--color-card-1-text)", border: "1px solid var(--color-card-1-border)" }}>
          <Handshake size={28} className="mx-auto mb-3 opacity-70" />
          <h3 className="font-semibold text-lg mb-1">Mis Asociaciones</h3>
          <p className="text-sm opacity-70">Reclama códigos y gestiona tus vínculos con mayoristas.</p>
        </a>
        <a href="/dashboard/wholesalers" className="rounded-2xl shadow-card hover:shadow-card-hover p-6 text-center transition-all duration-200"
          style={{ backgroundColor: "var(--color-card-2-bg)", color: "var(--color-card-2-text)", border: "1px solid var(--color-card-2-border)" }}>
          <Store size={28} className="mx-auto mb-3 opacity-70" />
          <h3 className="font-semibold text-lg mb-1">Mayoristas</h3>
          <p className="text-sm opacity-70">Descubre proveedores a través de sus publicaciones.</p>
        </a>
      </div>
    </div>
  );
}
