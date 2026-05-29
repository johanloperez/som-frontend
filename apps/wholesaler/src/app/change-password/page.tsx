"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@repo/ui";
import { api } from "@repo/api";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); return; }
    if (newPassword !== confirmPassword) { setError("Las contraseñas no coinciden"); return; }

    const tenantSlug = sessionStorage.getItem("auth_user") ? JSON.parse(sessionStorage.getItem("auth_user")!).tenantSlug : null;
    if (!tenantSlug) { setError("Sesión no encontrada"); return; }

    setLoading(true);
    try {
      await api.post(`/tenant/${tenantSlug}/auth/change-password`, { currentPassword, newPassword });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Error al cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Cambiar Contraseña</CardTitle>
          <CardDescription>Esta es la primera vez que inicias sesión o tu contraseña fue restablecida. Debes cambiarla para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input id="currentPassword" label="Contraseña actual" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            <Input id="newPassword" label="Nueva contraseña" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            <Input id="confirmPassword" label="Confirmar contraseña" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Guardando..." : "Cambiar Contraseña"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
