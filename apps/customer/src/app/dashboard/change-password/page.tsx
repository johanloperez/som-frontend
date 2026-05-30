"use client";

import { useState } from "react";
import { api } from "@repo/api";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "@repo/ui";

export default function ChangePasswordPage() {
  const [current, setCurrent] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const change = async () => {
    if (newPwd.length < 8) { setError("Mínimo 8 caracteres"); return; }
    if (newPwd !== confirm) { setError("No coinciden"); return; }
    setError(""); setSuccess("");
    try {
      await api.post("/auth/change-password", { currentPassword: current, newPassword: newPwd });
      setSuccess("Contraseña actualizada");
      setCurrent(""); setNewPwd(""); setConfirm("");
    } catch (e: any) { setError(e?.response?.data?.error ?? "Error"); }
  };

  return (
    <div className="space-y-6 max-w-md">
      <h2 className="text-3xl font-bold">Cambiar Contraseña</h2>
      <Card>
        <CardContent className="space-y-3 pt-6">
          <Input id="current" label="Contraseña actual" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          <Input id="newPwd" label="Nueva contraseña" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
          <Input id="confirm" label="Confirmar" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <Button className="w-full" onClick={change}>Cambiar Contraseña</Button>
        </CardContent>
      </Card>
    </div>
  );
}
