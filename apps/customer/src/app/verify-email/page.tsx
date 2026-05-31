"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@repo/ui";
import { useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("verification_token");
    if (saved) setToken(saved);
  }, []);

  const verify = async () => {
    setError("");
    try {
      await api.post("/auth/verify-email", { token: token.trim() });
      setSuccess("Email verificado. Redirigiendo al login...");
      sessionStorage.removeItem("verification_token");
      sessionStorage.removeItem("verification_email");
      setTimeout(() => router.push("/login"), 2000);
    } catch (e: any) { setError(e?.response?.data?.error ?? "Token inválido"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Verificar Email</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Hemos enviado un token de verificación a tu email. Ingresa el token para activar tu cuenta.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {success ? (
            <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950 p-4 text-center text-sm text-green-800 dark:text-green-200">
              {success}
            </div>
          ) : (
            <>
              <Input id="token" label="Token de verificación" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Pega aquí el token de tu email" />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button className="w-full" onClick={verify}>Verificar Email</Button>
              <p className="text-sm text-center text-muted-foreground">
                ¿No recibiste el token? <a href="/register" className="text-primary hover:underline">Regístrate de nuevo</a>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
