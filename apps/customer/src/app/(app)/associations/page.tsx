"use client";

import { useState } from "react";
import { BadgeCheck, Link2, Store } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { useToast } from "@repo/ui/toast";
import { associationsApi } from "@/lib/api-services";
import { useData } from "@/lib/use-api";

export default function AssociationsPage() {
  const toast = useToast();
  const { data: associations = [], loading, refetch } = useData(() => associationsApi.my());
  const [code, setCode] = useState("");
  const [claiming, setClaiming] = useState(false);

  async function claim() {
    const value = code.trim();
    if (!value) return;
    setClaiming(true);
    try {
      await associationsApi.claimByCode(value);
      toast.success("Mayorista vinculado", "Ya puedes ver su catálogo");
      setCode("");
      refetch();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Verifica el código e inténtalo de nuevo";
      toast.error("No se pudo vincular", msg);
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Mis mayoristas</h1>
        <p className="text-sm text-muted-foreground">
          Vincúlate con un mayorista usando el código que te compartió para ver su catálogo y hacer pedidos.
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label className="mb-1.5 block" htmlFor="code">Código de vinculación</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") claim(); }}
                placeholder="Ej. ABC-12345"
              />
            </div>
            <Button onClick={claim} loading={claiming} disabled={!code.trim()}>
              <Link2 className="size-4" /> Vincular
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="size-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : associations.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <Store className="size-8" />
          <p>Aún no estás vinculado a ningún mayorista.</p>
          <p className="text-sm">Ingresa un código arriba para empezar a comprar.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {associations.map((a) => (
            <Card key={a.tenantId || a.slug}>
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Store className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-semibold text-foreground">{a.name}</p>
                      <BadgeCheck className="size-4 shrink-0 text-accent-2" />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{a.slug}</p>
                  </div>
                </div>
                <Badge variant={a.status === "active" ? "success" : "secondary"} className="self-start">
                  {a.status === "active" ? "Activo" : a.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
