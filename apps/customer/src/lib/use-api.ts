"use client";

import { useState, useEffect, useCallback } from "react";
import { onEntityChange } from "@repo/api";

interface UseApiResult<T> {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  realtimeTypes?: string[],
): UseApiResult<T> {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher()
      .then((res) => { if (!cancelled) { setData(res); } })
      .catch((e: unknown) => { if (!cancelled) { const msg = (e as { message?: string })?.message ?? "Error al cargar datos"; setError(msg); } })
      .finally(() => { if (!cancelled) { setLoading(false); } });
    return () => { cancelled = true; };
  }, [tick, ...deps]);

  // Real-time: refetch automatically when the server pushes a matching entity
  // change, so the UI stays fresh without the user reloading. Bursts are
  // debounced so a flurry of changes triggers a single refetch.
  const typesKey = realtimeTypes ? realtimeTypes.join(",") : "*";
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = onEntityChange(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => refetch(), 150);
    }, realtimeTypes);
    return () => { if (timer) clearTimeout(timer); unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typesKey, refetch]);

  return { data, loading, error, refetch };
}

export function useData<T>(
  apiFetcher: () => Promise<T[]>,
  deps: unknown[] = [],
  realtimeTypes?: string[],
): UseApiResult<T[]> {
  return useApi(apiFetcher, deps, realtimeTypes);
}

export function useDataItem<T>(
  apiFetcher: () => Promise<T>,
  id: string,
  realtimeTypes?: string[],
): UseApiResult<T> {
  return useApi(apiFetcher, [id], realtimeTypes);
}

export { useApi };
