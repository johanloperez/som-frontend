"use client";

import { useAuth } from "@repo/ui";

export default function CustomerDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="text-muted-foreground">Bienvenido, {user?.fullName}</p>
      <div className="grid grid-cols-2 gap-4 mt-6">
        <a href="/dashboard/associations" className="rounded-lg border p-6 hover:bg-muted transition-colors">
          <h3 className="font-semibold text-lg">Mis Asociaciones</h3>
          <p className="text-sm text-muted-foreground mt-1">Reclama códigos y gestiona tus vínculos con mayoristas.</p>
        </a>
        <a href="/dashboard/wholesalers" className="rounded-lg border p-6 hover:bg-muted transition-colors">
          <h3 className="font-semibold text-lg">Explorar Mayoristas</h3>
          <p className="text-sm text-muted-foreground mt-1">Encuentra mayoristas y solicita vinculación.</p>
        </a>
      </div>
    </div>
  );
}
