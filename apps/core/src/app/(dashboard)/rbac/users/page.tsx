"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Button, Input, DataTable, Modal, Badge, Tooltip, type FilterConfig } from "@repo/ui";
import type { ColumnDef } from "@tanstack/react-table";

interface CoreUser {
  id: string;
  email: string;
  fullName: string;
  status: string;
  role: string;
  roles: { id: string; name: string }[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<CoreUser[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CoreUser | null>(null);
  const [form, setForm] = useState({ email: "", fullName: "", password: "" });
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [u, r] = await Promise.all([api.get("/platform/users"), api.get("/platform/roles")]);
      setUsers(u.data.filter((u: CoreUser) => u.role === "platform_admin"));
      setRoles(r.data);
    } catch { }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setError("");
    try {
      await api.post("/platform/users", form);
      setOpen(false);
      setForm({ email: "", fullName: "", password: "" });
      load();
    } catch (e: any) { setError(e?.response?.data?.error ?? "Error"); }
  };

  const assignRole = async (userId: string, roleId: string) => {
    try { await api.post(`/platform/users/${userId}/roles`, { roleIds: [roleId] }); load(); } catch { }
  };

  const columns: ColumnDef<CoreUser>[] = [
    { header: () => <Tooltip content="Nombre completo del usuario">Nombre</Tooltip>, accessorKey: "fullName" },
    { header: () => <Tooltip content="Correo electrónico del usuario">Email</Tooltip>, accessorKey: "email" },
    { header: () => <Tooltip content="Estado de la cuenta del usuario">Estado</Tooltip>, accessorKey: "status", cell: ({ getValue }) => <Badge variant={getValue() === "active" ? "success" : "warning"}>{getValue() as string}</Badge> },
    {
      id: "roles",
      header: () => <Tooltip content="Roles asignados al usuario">Roles</Tooltip>,
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.roles?.map((r) => (<Badge key={r.id} variant="outline">{r.name}</Badge>))}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button size="sm" variant="outline" onClick={() => { setSelectedUser(row.original); setOpen(true); }}>
          Asignar Rol
        </Button>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      type: "select",
      column: "status",
      label: "Estado",
      options: [
        { value: "active", label: "Activo" },
        { value: "inactive", label: "Inactivo" },
      ],
    },
  ];

  const close = () => { setOpen(false); setSelectedUser(null); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Usuarios Core</h2>
        <Button onClick={() => { setSelectedUser(null); setOpen(true); }}>Nuevo Admin</Button>
      </div>
      <DataTable columns={columns} data={users} filters={filters} searchable={true} pagination={true} />

      <Modal open={open} onClose={close} title={selectedUser ? "Asignar Rol" : "Nuevo Administrador"}>
        {selectedUser ? (
          <div className="space-y-3">
            <p className="text-sm">Usuario: <strong>{selectedUser.fullName}</strong></p>
            {roles.map((r) => (
              <Button key={r.id} variant="outline" className="w-full justify-start" onClick={() => assignRole(selectedUser.id, r.id)}>
                {r.name}
              </Button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <Input id="fullName" label="Nombre" tooltip="Nombre completo del nuevo administrador" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            <Input id="email" label="Email" tooltip="Correo electrónico del nuevo administrador" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input id="password" label="Contraseña" tooltip="Contraseña temporal del nuevo administrador" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={create} className="w-full">Crear</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
