"use client";

import { useEffect, useRef } from "react";
import { realtime } from "@repo/api";

interface RealtimeProviderProps {
  children: React.ReactNode;
  getToken: () => string | null;
}

export function RealtimeProvider({ children, getToken }: RealtimeProviderProps) {
  const connected = useRef(false);

  useEffect(() => {
    const token = getToken();
    if (!token || connected.current) return;
    realtime.connect(token);
    connected.current = true;

    return () => {
      realtime.disconnect();
      connected.current = false;
    };
  }, [getToken]);

  return <>{children}</>;
}
