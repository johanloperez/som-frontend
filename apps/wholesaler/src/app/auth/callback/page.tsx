"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

function CallbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const tenantSlug = searchParams.get("tenantSlug");

    if (accessToken) {
      sessionStorage.setItem("access_token", accessToken);
    }

    const userId = searchParams.get("userId");
    const email = searchParams.get("email");
    const fullName = searchParams.get("fullName");
    const role = searchParams.get("role");
    const permissionsRaw = searchParams.get("permissions");

    if (userId) {
      sessionStorage.setItem("auth_user", JSON.stringify({
        id: userId,
        email: email ?? "",
        fullName: fullName ?? "",
        role: role ?? "",
        permissions: permissionsRaw ? JSON.parse(permissionsRaw) : [],
        tenantSlug: tenantSlug ?? "",
        portal: "wholesaler",
      }));
    }

    router.replace("/dashboard");
  }, [searchParams, router]);

  return <p>Redirecting...</p>;
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <CallbackInner />
    </Suspense>
  );
}
