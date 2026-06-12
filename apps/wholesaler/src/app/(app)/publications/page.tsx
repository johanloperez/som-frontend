"use client";

import { useMemo, useState } from "react";
import { Heart, MessageCircle, Plus } from "lucide-react";
import { Avatar } from "@repo/ui/avatar";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent } from "@repo/ui/card";
import { Dialog } from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { PageHeader } from "@repo/ui/page-header";
import { Select } from "@repo/ui/select";
import { Textarea } from "@repo/ui/textarea";
import { cn } from "@repo/ui/lib/utils";
import { useToast } from "@repo/ui/toast";
import { publicationsApi } from "@/lib/api-services";
import { useData } from "@/lib/use-api";
import type { PublicationType } from "@/lib/types";

const typeMeta: Record<PublicationType, { label: string; variant: "default" | "secondary" | "success" }> = {
  offer: { label: "Oferta", variant: "success" },
  demand: { label: "Demanda", variant: "default" },
  news: { label: "Noticia", variant: "secondary" },
};

const typeTabs: { value: PublicationType | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "offer", label: "Ofertas" },
  { value: "demand", label: "Demandas" },
  { value: "news", label: "Noticias" },
];

const empty = { title: "", body: "", type: "offer" as PublicationType };

export default function PublicationsPage() {
  const toast = useToast();
  const { data: publications = [], refetch } = useData(() => publicationsApi.list());
  const [tab, setTab] = useState<PublicationType | "all">("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const filtered = useMemo(
    () => (tab === "all" ? publications : publications.filter((p) => p.type === tab)),
    [publications, tab],
  );

  async function publish() {
    await publicationsApi.create({
      ...form,
      author: "Distribuidora Andina",
      date: new Date().toISOString().slice(0, 10),
      likes: 0,
      comments: 0,
    });
    toast.success("Publicación creada", form.title);
    setForm(empty);
    setOpen(false);
    refetch();
  }

  return (
    <div>
      <PageHeader
        title="Publicaciones"
        subtitle="Comparte ofertas y conecta con la red mayorista"
        actions={
          <Button onClick={() => { setForm(empty); setOpen(true); }}>
            <Plus className="size-4" /> Nueva publicación
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1 border-b border-border">
        {typeTabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "relative px-3 py-2 text-sm font-medium transition-colors",
              tab === t.value ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {tab === t.value && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">No hay publicaciones en esta categoría.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar name={p.author} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-foreground">{p.author}</span>
                      <Badge variant={typeMeta[p.type].variant}>{typeMeta[p.type].label}</Badge>
                      <span className="text-xs text-muted-foreground">{p.date}</span>
                    </div>
                    <h3 className="mt-2 font-semibold text-foreground">{p.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
                    <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5"><Heart className="size-4" /> {p.likes}</span>
                      <span className="inline-flex items-center gap-1.5"><MessageCircle className="size-4" /> {p.comments}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Nueva publicación"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button disabled={!form.title || !form.body} onClick={publish}>Publicar</Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div>
            <Label className="mb-1.5 block">Tipo</Label>
            <Select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as PublicationType }))}
              options={[
                { value: "offer", label: "Oferta" },
                { value: "demand", label: "Demanda" },
                { value: "news", label: "Noticia" },
              ]}
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Título</Label>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Oferta: Arroz por volumen" />
          </div>
          <div>
            <Label className="mb-1.5 block">Contenido</Label>
            <Textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} placeholder="Describe tu oferta o necesidad…" />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
