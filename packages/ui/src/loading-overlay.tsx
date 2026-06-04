"use client";

import { useEffect, useState } from "react";
import { onLoadingChange } from "@repo/api";
import { Loader } from "lucide-react";

export function LoadingOverlay() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return onLoadingChange(setLoading);
  }, []);

  if (!loading) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60">
      <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-3 shadow-lg">
        <Loader className="h-5 w-5 animate-spin text-gray-600" />
        <span className="text-sm text-gray-600">Cargando...</span>
      </div>
    </div>
  );
}
