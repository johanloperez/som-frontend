"use client";

import { useEffect } from "react";
import { realtime } from "@repo/api";

export function useRealtime(
  entityType: string,
  action: string,
  listener: (data: { entityType: string; entityId: string; action: string; data?: any }) => void
) {
  useEffect(() => {
    const unsub = realtime.on(entityType, action, listener);
    return unsub;
  }, [entityType, action, listener]);
}
