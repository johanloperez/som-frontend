"use client";

import { Bell } from "lucide-react";
import { PageHeader } from "@repo/ui/page-header";

export default function NotificationsPage() {
  return (
    <div>
      <PageHeader title="Notificaciones" subtitle="Mantente al día con las novedades" />
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <Bell className="size-10 text-muted-foreground" />
        <p className="text-muted-foreground">No hay notificaciones.</p>
      </div>
    </div>
  );
}
