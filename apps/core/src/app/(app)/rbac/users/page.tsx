"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { Plus, ShieldCheck, Lock, Pencil } from "lucide-react";
import { Avatar } from "@repo/ui/avatar";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { DataTable } from "@repo/ui/data-table";
import { Dialog } from "@repo/ui/dialog";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { PageHeader } from "@repo/ui/page-header";
import { Select } from "@repo/ui/select";
import { useToast } from "@repo/ui/toast";
import { rolesApi, usersApi } from "@/lib/api-services";
import { useData } from "@/lib/use-api";
import type { CoreUser } from "@/lib/types";

type DialogState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "editRoles"; user: CoreUser };

const emptyCreate = { fullName: "", email: "", password: "", roleId: "" };

export default function UsersPage() {
  const toast = useToast();
  const { data: users = [], refetch } = useData(() => usersApi.list(), [], ["user"]);
  const { data: roles = [] } = useData(() => rolesApi.list(), [], ["role"]);
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [editRoleId, setEditRoleId] = useState("");
  const [saving, setSaving] = useState(false);

  const roleOptions = useMemo(() => roles.map((r) => ({ value: r.id, label: r.name })), [roles]);

  useEffect(() => {
    if (dialog.mode === "create") {
      setCreateForm({ ...emptyCreate, roleId: roles[0]?.id ?? "" });
    } else if (dialog.mode === "editRoles") {
      setEditRoleId(dialog.user.roleId || roles[0]?.id || "");
    }
  }, [dialog, roles]);

  async function createUser() {
    setSaving(true);
    try {
      await usersApi.create({
        email: createForm.email.trim(),
        fullName: createForm.fullName.trim(),
        password: createForm.password,
        roleIds: createForm.roleId ? [createForm.roleId] : [],
      });
      toast.success("Usuario creado", createForm.fullName);
      refetch();
      setDialog({ mode: "closed" });
    } catch (e) {
      toast.error("No se pudo crear el usuario", (e as { message?: string })?.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveRoles() {
    if (dialog.mode !== "editRoles") return;
    setSaving(true);
    try {
      await usersApi.assignRoles(dialog.user.id, editRoleId ? [editRoleId] : []);
      toast.success("Roles actualizados", dialog.user.fullName);
      refetch();
      setDialog({ mode: "closed" });
    } catch (e) {
      toast.error("No se pudieron actualizar los roles", (e as { message?: string })?.message);
    } finally {
      setSaving(false);
    }
  }

  const columns = useMemo<ColumnDef<CoreUser, unknown>[]>(
    () => [
      {
        accessorKey: "fullName",
        header: "Usuario",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar name={row.original.fullName} />
            <div>
              <p className="font-medium text-foreground">{row.original.fullName}</p>
              <p className="text-xs text-muted-foreground">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      { accessorKey: "roleName", header: "Rol", cell: ({ getValue }) => <Badge variant="secondary"><ShieldCheck className="size-3" /> {String(getValue())}</Badge> },
      { accessorKey: "active", header: "Estado", cell: ({ getValue }) => (getValue() ? <Badge variant="success">Activo</Badge> : <Badge variant="secondary">Inactivo</Badge>) },
      {
        id: "actions",
        header: "",
        cell: ({ row }) =>
          row.original.isProtected ? (
            <Badge variant="secondary" title="El super usuario no se puede modificar"><Lock className="size-3" /> Protegido</Badge>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setDialog({ mode: "editRoles", user: row.original })}>
              <Pencil className="size-3.5" /> Editar roles
            </Button>
          ),
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Usuarios"
        subtitle="Administradores de la plataforma y sus roles"
        actions={
          <Button onClick={() => setDialog({ mode: "create" })}>
            <Plus className="size-4" /> Nuevo usuario
          </Button>
        }
      />

      <DataTable columns={columns} data={users} searchPlaceholder="Buscar por nombre, correo…" />

      <Dialog
        open={dialog.mode === "create"}
        onClose={() => setDialog({ mode: "closed" })}
        title="Nuevo usuario"
        footer={<><Button variant="outline" onClick={() => setDialog({ mode: "closed" })}>Cancelar</Button><Button disabled={saving || !createForm.fullName || !createForm.email || !createForm.password || !createForm.roleId} onClick={createUser}>Guardar</Button></>}
      >
        <div className="grid gap-4">
          <div><Label className="mb-1.5 block">Nombre completo</Label><Input value={createForm.fullName} onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))} placeholder="Laura Vega" /></div>
          <div><Label className="mb-1.5 block">Correo</Label><Input type="email" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} placeholder="laura@plataforma.com" /></div>
          <div><Label className="mb-1.5 block">Contraseña</Label><Input type="password" value={createForm.password} onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••" /></div>
          <div><Label className="mb-1.5 block">Rol</Label><Select value={createForm.roleId} options={roleOptions} onChange={(e) => setCreateForm((f) => ({ ...f, roleId: e.target.value }))} /></div>
        </div>
      </Dialog>

      <Dialog
        open={dialog.mode === "editRoles"}
        onClose={() => setDialog({ mode: "closed" })}
        title={dialog.mode === "editRoles" ? `Editar roles · ${dialog.user.fullName}` : "Editar roles"}
        footer={<><Button variant="outline" onClick={() => setDialog({ mode: "closed" })}>Cancelar</Button><Button disabled={saving || !editRoleId} onClick={saveRoles}>Guardar</Button></>}
      >
        <div className="grid gap-4">
          <div><Label className="mb-1.5 block">Rol</Label><Select value={editRoleId} options={roleOptions} onChange={(e) => setEditRoleId(e.target.value)} /></div>
        </div>
      </Dialog>
    </div>
  );
}
