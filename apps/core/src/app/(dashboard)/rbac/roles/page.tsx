"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Button, Input, DataTable, Modal, Badge, Tooltip, type FilterConfig } from "@repo/ui";
import type { ColumnDef } from "@tanstack/react-table";

interface Role {
  id: string;
  name: string;
  isSystem: boolean;
  permissions: { id: string; code: string }[];
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [resources, setResources] = useState<{ id: string; code: string; group: string; description?: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  const load = async (activeRoleId?: string) => {
    try {
      const [r, res] = await Promise.all([api.get("/platform/roles"), api.get("/platform/resources")]);
      setRoles(r.data);
      setResources(res.data);
      if (activeRoleId) {
        const updated = r.data.find((role: Role) => role.id === activeRoleId);
        if (updated) setSelectedRole(updated);
      }
    } catch { }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setError("");
    try {
      await api.post("/platform/roles", { name: newName });
      setOpen(false);
      setNewName("");
      load();
    } catch (e: any) { setError(e?.response?.data?.error ?? "Error"); }
  };

  const togglePermission = async (roleId: string, resourceId: string) => {
    const role = roles.find((r) => r.id === roleId);
    const has = role?.permissions?.some((p) => p.id === resourceId);
    const ids = has
      ? (role?.permissions ?? []).filter((p) => p.id !== resourceId).map((p) => p.id)
      : [...(role?.permissions ?? []).map((p) => p.id), resourceId];
    try { await api.put(`/platform/roles/${roleId}/permissions`, { resourceIds: ids }); load(roleId); } catch (e: any) { setError(e?.response?.data?.error ?? e?.message ?? "Error al guardar permisos"); }
  };

  const columns: ColumnDef<Role>[] = [
    { header: () => <Tooltip content="Nombre del rol">Nombre</Tooltip>, accessorKey: "name" },
    { header: () => <Tooltip content="Indica si es un rol del sistema (no se puede eliminar)">Sistema</Tooltip>, accessorKey: "isSystem", cell: ({ getValue }) => getValue() ? <Badge>Sistema</Badge> : "—" },
    {
      header: () => <Tooltip content="Permisos asignados a este rol">Permisos</Tooltip>, accessorKey: "permissions",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1 max-w-md">
          {row.original.permissions?.slice(0, 5).map((p) => (<Badge key={p.id} variant="outline">{p.code}</Badge>))}
          {(row.original.permissions?.length ?? 0) > 5 && <Badge variant="outline">+{row.original.permissions.length - 5}</Badge>}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button size="sm" variant="outline" onClick={() => setSelectedRole(row.original)}>Permisos</Button>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      type: "select",
      column: "isSystem",
      label: "Tipo",
      options: [
        { value: "true", label: "Sistema" },
        { value: "false", label: "Personalizado" },
      ],
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Roles</h2>
        <Button onClick={() => { setSelectedRole(null); setOpen(true); }}>Nuevo Rol</Button>
      </div>
      <DataTable columns={columns} data={roles} filters={filters} searchable={true} pagination={true} />

      <Modal open={open && !selectedRole} onClose={() => setOpen(false)} title="Nuevo Rol">
        <div className="space-y-3">
          <Input id="name" label="Nombre" tooltip="Nombre del nuevo rol" value={newName} onChange={(e) => setNewName(e.target.value)} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={create} className="w-full">Crear</Button>
        </div>
      </Modal>

      <Modal open={!!selectedRole} onClose={() => { setSelectedRole(null); setError(""); }} title={`Permisos: ${selectedRole?.name}`}>
        {error && <p className="text-sm text-destructive mb-2">{error}</p>}
        <div className="max-h-96 overflow-y-auto space-y-4">
          {Object.entries(
            resources.reduce<Record<string, typeof resources>>((acc, r) => {
              const g = r.group || "Sin grupo";
              if (!acc[g]) acc[g] = [];
              acc[g].push(r);
              return acc;
            }, {})
          ).map(([group, perms]) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 px-2">{group}</p>
              {perms.map((res) => {
                const role = selectedRole;
                const disabled = role?.isSystem ?? false;
                const has = role ? roles.find((r) => r.id === role.id)?.permissions?.some((p) => p.id === res.id) ?? false : false;
                return (
                  <label key={res.id} className={`flex items-center gap-3 p-2 rounded ${disabled ? "opacity-60" : "hover:bg-muted cursor-pointer"}`}>
                    <input type="checkbox" checked={has} disabled={disabled} onChange={() => togglePermission(role!.id, res.id)} className="h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">{res.description || res.code}</p>
                      <p className="text-xs text-muted-foreground">{res.code}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
