"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Button, Badge, Input, DataTable, Modal, useAuth, useRealtime } from "@repo/ui";
import type { ColumnDef } from "@tanstack/react-table";

interface RegionData {
  id: string;
  name: string;
  country: string;
  provinceCount: number;
  createdAt: string;
}

interface CountryData {
  id: string;
  name: string;
  code: string;
}

interface ProvinceData {
  id: string;
  name: string;
}

export default function RegionsPage() {
  const { user } = useAuth();
  const slug = user?.tenantSlug ?? "";
  const basePath = slug ? `/tenant/${slug}` : "";

  const [regions, setRegions] = useState<RegionData[]>([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [regionName, setRegionName] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCountryName, setSelectedCountryName] = useState("");
  const [provinces, setProvinces] = useState<ProvinceData[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const r = await api.get(`${basePath}/regions`);
      setRegions(r.data);
    } catch {}
    setLoading(false);
  };

  const loadCountries = async () => {
    try { const r = await api.get("/geography/countries"); setCountries(r.data); } catch {}
  };

  useEffect(() => { load(); loadCountries(); }, [slug]);
  useRealtime("region", "*", () => { load(); });

  const loadProvinces = async (countryId: string) => {
    try {
      const r = await api.get(`/geography/countries/${countryId}/regions`);
      setProvinces(r.data);
      setSelectedProvinces([]);
    } catch { setProvinces([]); }
  };

  const openCreate = () => {
    setEditId(null);
    setRegionName("");
    setSelectedCountry("");
    setSelectedCountryName("");
    setProvinces([]);
    setSelectedProvinces([]);
    setError("");
    setModal(true);
  };

  const toggleProvince = (name: string) => {
    setSelectedProvinces(prev => prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]);
  };

  const save = async () => {
    if (!regionName.trim()) { setError("Ingresa un nombre"); return; }
    if (!selectedCountry) { setError("Selecciona un país"); return; }
    if (selectedProvinces.length === 0) { setError("Selecciona al menos una provincia"); return; }
    try {
      const payload = { name: regionName.trim(), country: selectedCountryName, provinceCount: selectedProvinces.length };
      if (editId) await api.put(`${basePath}/regions/${editId}`, payload);
      else await api.post(`${basePath}/regions`, payload);
      setModal(false);
      load();
    } catch (e: any) { setError(e?.response?.data?.error ?? "Error"); }
  };

  const del = async (id: string) => { try { await api.delete(`${basePath}/regions/${id}`); load(); } catch {} };

  const columns: ColumnDef<RegionData>[] = [
    { header: "Nombre", accessorKey: "name" },
    { header: "País", accessorKey: "country" },
    { header: "Provincias", accessorKey: "provinceCount" },
    { header: "Acciones", id: "actions", cell: ({ row }) => (
      <Button variant="ghost" size="sm" onClick={() => del(row.original.id)}>Eliminar</Button>
    )},
  ];

  if (loading) return <p className="p-8 text-muted-foreground">Cargando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Regiones</h2>
        <Button onClick={openCreate}>Nueva Región</Button>
      </div>

      <DataTable columns={columns} data={regions} searchable={true} pagination={true} />

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Editar Región" : "Nueva Región"} description="Crea una región personalizada agrupando provincias de un país.">
        <div className="space-y-3">
          <Input id="regionName" label="Nombre de la región" value={regionName} onChange={(e) => setRegionName(e.target.value)} placeholder="Zona Norte, Capital, Costa..." />
          <div>
            <label className="text-sm font-medium mb-1 block">País</label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={selectedCountry} onChange={(e) => {
              const c = countries.find(x => x.id === e.target.value);
              setSelectedCountry(e.target.value);
              setSelectedCountryName(c?.name ?? "");
              loadProvinces(e.target.value);
            }}>
              <option value="">Seleccionar país...</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {provinces.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-1 block">Provincias/Estados ({selectedProvinces.length} seleccionadas)</label>
              <div className="border rounded-md max-h-[250px] overflow-y-auto divide-y">
                {provinces.map(p => (
                  <label key={p.id} className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm hover:bg-muted ${selectedProvinces.includes(p.name) ? "bg-primary/10" : ""}`}>
                    <input type="checkbox" checked={selectedProvinces.includes(p.name)} onChange={() => toggleProvince(p.name)} className="accent-primary" />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={save}>{editId ? "Guardar" : "Crear Región"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
