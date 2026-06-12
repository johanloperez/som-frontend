"use client";

import { useEffect, useState } from "react";
import {
  clearSession,
  getSession,
  subscribe,
  type AuthSession,
} from "@repo/api";

export function useAuth() {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSessionState(getSession());
    setReady(true);
    return subscribe(setSessionState);
  }, []);

  return {
    session,
    user: session?.user ?? null,
    isAuthenticated: !!session,
    ready,
    logout: clearSession,
  };
}
