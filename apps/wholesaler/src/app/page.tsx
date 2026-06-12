"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/use-auth";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;
    router.replace(isAuthenticated ? "/dashboard" : "/login");
  }, [ready, isAuthenticated, router]);

  return null;
}
