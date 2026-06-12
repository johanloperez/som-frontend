"use client";

import { useEffect, useState } from "react";
import { Check, Lock, MoreHorizontal, Pencil, Plus, ShieldCheck, Users } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Dialog } from "@repo/ui/dialog";
import { DropdownMenu } from "@repo/ui/dropdown-menu";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { PageHeader } from "@repo/ui/page-header";
import { cn } from "@repo/ui/lib/utils";
import { useToast } from "@repo/ui/toast";
import { resourcesApi, rolesApi } from "@/lib/api-services";
import { useData } from "@/lib/use-api";
import type { PermissionGrant, Role } from "@/lib/types";

type Action = "read" | "create" | "update" | "delete";
const ACTIONS: { key: Action; label: string }[] = [
  { key: "read", label: "Ver" },
  { key: "create", label: "Crear" },
  { key: "update", label: "Editar" },
  { key: "delete", label: "Eliminar" },
];

const emptyForm = { name: "", description: "", permissions: {} as Record<string, Action[]> };

function gripToMap(perms: PermissionGrant[]): Record<string, Action[]> {
  return Object.fromEntries(perms.map((p) => [p.resourceId, p.actions]));
}

export default function RolesPage() {
  const toast = useToast();
  const { data: roles = [], refetch } = useData(() => rolesApi.list(), [], ["role", "user"]);
  const { data: resources = [] } = useData(() => resourcesApi.list(), [], ["resource"]);
  const [dialog, setDialog] = useState<{ open: boolean; editing: Role | null }>({ open: false, editing: null });
  const [form, setForm] = useState(emptyForm);

  // Only the system role (super admin) is locked: it always holds every permission.
  const readOnly = !!dialog.editing?.system;

  useEffect(() => {
    if (!dialog.open) return;
    if (!dialog.editing) {
      setForm(emptyForm);
      return;
    }
    if (dialog.editing.system) {
      // System role: show all resources granted, read-only.
      const all = Object.fromEntries(resources.map((r) => [r.id, ACTIONS.map((a) => a.key)])) as Record<string, Action[]>;
      setForm({ name: dialog.editing.name, description: dialog.editing.description, permissions: all });
    } else {
      setForm({ name: dialog.editing.name, description: dialog.editing.description, permissions: gripToMap(dialog.editing.permissions) });
    }
  }, [dialog, resources]);

  function toggle(resourceId: string, action: Action) {
    if (readOnly) return;
    setForm((f) => {
      const current = f.permissions[resourceId] ?? [];
      const next = current.includes(action) ? current.filter((a) => a !== action) : [...current, action];
      const permissions = { ...f.permissions };
      if (next.length) permissions[resourceId] = next;
      else delete permissions[resourceId];
      return { ...f, permissions };
    });
  }

  async function save() {
    // Grants are resource-level: a resource with any action checked is granted.
    const resourceIds = Object.keys(form.permissions);
    try {
      if (dialog.editing) {
        await rolesApi.updatePermissions(dialog.editing.id, resourceIds);
        toast.success("Permisos actualizados", form.name);
      } else {
        const created = await rolesApi.create({ name: form.name, description: form.description, permissions: [], system: false, userCount: 0 });
        if (resourceIds.length) await rolesApi.updatePermissions(created.id, resourceIds);
        toast.success("Rol creado", form.name);
      }
      refetch();
      setDialog({ open: false, editing: null });
    } catch (e) {
      toast.error("No se pudo guardar el rol", (e as { message?: string })?.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Roles"
        subtitle="Define qué puede hacer cada grupo de administradores"
        actions={
          <Button onClick={() => setDialog({ open: true, editing: null })}>
            <Plus className="size-4" /> Nuevo rol
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id} className="flex flex-col">
            <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
              <div className="flex items-start gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {role.name}
                    {role.system && <Lock className="size-3.5 text-muted-foreground" />}
                  </CardTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground">{role.description}</p>
                </div>
              </div>
              <DropdownMenu
                trigger={<span className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"><MoreHorizontal className="size-4" /></span>}
                items={[
                  { label: role.system ? "Ver permisos" : "Editar permisos", icon: <Pencil className="size-4" />, onClick: () => setDialog({ open: true, editing: role }) },
                ]}
              />
            </CardHeader>
            <CardContent className="mt-auto flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="size-4" /> {role.userCount} {role.userCount === 1 ? "usuario" : "usuarios"}
              </span>
              {role.system ? (
                <Badge variant="warning">Sistema</Badge>
              ) : (
                <Badge variant="secondary">{role.permissions.reduce((s, p) => s + p.actions.length, 0)} permisos</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ open: false, editing: null })}
        title={dialog.editing ? (readOnly ? "Permisos del rol" : "Editar permisos") : "Nuevo rol"}
        description={readOnly ? "El rol de sistema tiene todos los permisos y no se puede modificar." : "Marca cualquier acción para conceder acceso al recurso."}
        size="lg"
        footer={
          readOnly ? (
            <Button variant="outline" onClick={() => setDialog({ open: false, editing: null })}>Cerrar</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setDialog({ open: false, editing: null })}>Cancelar</Button>
              <Button disabled={!form.name} onClick={save}>Guardar</Button>
            </>
          )
        }
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label className="mb-1.5 block">Nombre del rol</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} disabled={readOnly} placeholder="Soporte" /></div>
            <div><Label className="mb-1.5 block">Descripción</Label><Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} disabled={readOnly} placeholder="Lectura general" /></div>
          </div>

          <div>
            <Label className="mb-2 block">Permisos</Label>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5 text-left">Recurso</th>
                    {ACTIONS.map((a) => (
                      <th key={a.key} className="px-2 py-2.5 text-center">{a.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resources.map((res) => {
                    const granted = form.permissions[res.id] ?? [];
                    return (
                      <tr key={res.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-foreground">{res.name}</p>
                          {res.description && <p className="text-[11px] text-muted-foreground">{res.description}</p>}
                        </td>
                        {ACTIONS.map((a) => {
                          const on = granted.includes(a.key);
                          return (
                            <td key={a.key} className="px-2 py-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => toggle(res.id, a.key)}
                                disabled={readOnly}
                                aria-pressed={on}
                                className={cn(
                                  "inline-flex size-6 items-center justify-center rounded-md border transition-colors",
                                  on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card hover:bg-accent",
                                  readOnly && "cursor-not-allowed opacity-70",
                                )}
                              >
                                {on && <Check className="size-4" />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
