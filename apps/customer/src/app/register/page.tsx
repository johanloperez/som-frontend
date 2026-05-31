"use client";

import { useState } from "react";
import { api } from "@repo/api";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@repo/ui";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", businessName: "", phoneE164: "", taxId: "" });
  const [error, setError] = useState("");

  const register = async () => {
    if (!form.fullName || !form.email || !form.password) { setError("Completa nombre, email y contraseña"); return; }
    if (form.password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); return; }
    setError("");
    try {
      const res = await api.post("/auth/register-customer", form);
      sessionStorage.setItem("verification_email", res.data.email);
      sessionStorage.setItem("verification_token", res.data.verificationToken);
      router.push("/verify-email");
    } catch (e: any) { setError(e?.response?.data?.error ?? "Error al registrarse"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Crear Cuenta</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Regístrate como cliente minorista para descubrir mayoristas.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input id="fullName" label="Nombre completo" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <Input id="email" label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input id="password" label="Contraseña" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Input id="businessName" label="Empresa (opcional)" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
          <Input id="phoneE164" label="Teléfono (opcional)" value={form.phoneE164} onChange={(e) => setForm({ ...form, phoneE164: e.target.value })} />
          <Input id="taxId" label="ID Fiscal (opcional)" value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" onClick={register}>Crear Cuenta</Button>
          <p className="text-sm text-center text-muted-foreground">
            ¿Ya tienes cuenta? <a href="/login" className="text-primary hover:underline">Inicia sesión</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
