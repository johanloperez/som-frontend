"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Building2, Search } from "lucide-react";
import { Avatar } from "@repo/ui/avatar";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { Input } from "@repo/ui/input";
import { PageHeader } from "@repo/ui/page-header";
import { Select } from "@repo/ui/select";
import { useToast } from "@repo/ui/toast";
import { directoryApi } from "@/lib/api-services";
import { countryOptions } from "@/lib/order-status";
import { useData } from "@/lib/use-api";

export default function DirectoryPage() {
  const toast = useToast();
  const { data: entries = [] } = useData(() => directoryApi.list());
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(
      (e) =>
        (!country || e.country === country) &&
        (!q || e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)),
    );
  }, [entries, query, country]);

  return (
    <div>
      <PageHeader title="Directorio" subtitle="Conecta con otros mayoristas de la red" />

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre o categoría…" />
        </div>
        <div className="w-44">
          <Select value={country} onChange={(e) => setCountry(e.target.value)} options={[{ value: "", label: "Todos los países" }, ...countryOptions]} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center text-muted-foreground">
          <Building2 className="size-8" />
          <p>No se encontraron mayoristas.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => (
            <Card key={e.id}>
              <CardContent className="flex flex-col gap-4 p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={e.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-semibold text-foreground">{e.name}</p>
                      {e.verified && <BadgeCheck className="size-4 shrink-0 text-accent-2" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{e.country}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{e.category}</Badge>
                  <Badge variant="outline">{e.plan}</Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => toast.success("Solicitud enviada", `Te conectaste con ${e.name}`)}
                >
                  Conectar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
