"use client";

import { useEffect, useState } from "react";
import { api } from "@repo/api";
import { Button, Badge, Input, DataTable, Modal, Card, CardHeader, CardTitle, CardContent, Tooltip, useAuth, useRealtime, type FilterConfig } from "@repo/ui";
import type { ColumnDef } from "@tanstack/react-table";

interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  status: string;
  stockQuantity: number;
  reservedQuantity: number;
  minStock: number;
  createdAt: string;
  updatedAt: string;
}

interface CategoryConfig {
  id: string;
  name: string;
  defaultMinStock: number;
  createdAt: string;
}

const emptyForm = { sku: "", name: "", description: "", price: 0, category: "", imageUrl: "", status: "active" };
const CAT_STATUS = ["active", "inactive", "discontinued"];

function stockInfo(qty: number, min: number) {
  if (qty <= 0) return { label: "Sin stock", variant: "destructive" as const, pct: 0 };
  if (qty <= min) return { label: "Stock bajo", variant: "warning" as const, pct: (qty / Math.max(min * 2, 1)) * 100 };
  return { label: "Disponible", variant: "success" as const, pct: Math.min((qty / Math.max(min * 2, 1)) * 100, 100) };
}

export default function ProductsPage() {
  const { user } = useAuth();
  const slug = user?.tenantSlug ?? "";
  const basePath = slug ? `/tenant/${slug}` : "";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [reportsEnabled, setReportsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [stockModal, setStockModal] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [stockForm, setStockForm] = useState({ quantity: 0, reservedQuantity: 0, minStock: 0 });
  const [error, setError] = useState("");
  const [exportMsg, setExportMsg] = useState("");
  const [exportJobs, setExportJobs] = useState<{ id: string; status: string; fileSizeBytes?: number; createdAt: string }[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const [importModal, setImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; errors: number; errorList: string[] } | null>(null);
  const [importError, setImportError] = useState("");

  const [catModal, setCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", defaultMinStock: 5 });
  const [catEditId, setCatEditId] = useState<string | null>(null);
  const [catError, setCatError] = useState("");

  const load = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get(`${basePath}/products`).catch(() => ({ data: [] as Product[] })),
        api.get(`${basePath}/categories`).catch(() => ({ data: [] as CategoryConfig[] })),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
      try {
        const subRes = await api.get(`${basePath}/subscription`);
        setReportsEnabled(subRes.data?.reportsEnabled ?? false);
      } catch { setReportsEnabled(false); }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [slug]);
  useRealtime("product", "*", () => { load(); });

  const openCreate = () => { setEditing(null); setForm(emptyForm); setError(""); setOpen(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ sku: p.sku, name: p.name, description: p.description ?? "", price: p.price, category: p.category ?? "", imageUrl: p.imageUrl ?? "", status: p.status });
    setError("");
    setOpen(true);
  };
  const openStock = (p: Product) => {
    setStockModal(p);
    setStockForm({ quantity: p.stockQuantity, reservedQuantity: p.reservedQuantity, minStock: p.minStock });
    setError("");
  };

  const save = async () => {
    if (!slug) return;
    setError("");
    try {
      if (editing) await api.put(`${basePath}/products/${editing.id}`, form);
      else await api.post(`${basePath}/products`, form);
      setOpen(false);
      load();
    } catch (e: any) { setError(e?.response?.data?.error ?? "Error al guardar"); }
  };

  const saveStock = async () => {
    if (!slug || !stockModal) return;
    setError("");
    try {
      await api.put(`${basePath}/products/${stockModal.id}/stock`, stockForm);
      setStockModal(null);
      load();
    } catch (e: any) { setError(e?.response?.data?.error ?? "Error al actualizar stock"); }
  };

  const exportStock = async () => {
    try {
      await api.post(`${basePath}/export`, { format: "csv", type: "stock" });
      setExportMsg("Exportación iniciada.");
      setTimeout(async () => {
        try { const r = await api.get(`${basePath}/export`); setExportJobs(r.data); } catch {}
      }, 2000);
    } catch (e: any) {
      setExportMsg(e?.response?.data?.error ?? e?.message ?? "Error al iniciar exportación.");
    }
  };

  const downloadTemplate = async () => {
    try {
      const res = await api.get(`${basePath}/import/template`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "template_productos.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {}
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImportError("");
    setImportResult(null);
    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", importFile);
      const res = await api.post(`${basePath}/import/products`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImportResult(res.data);
      setImportFile(null);
      load();
    } catch (e: any) { setImportError(e?.response?.data?.error ?? "Error al importar"); }
    setImportLoading(false);
  };

  const saveCategory = async () => {
    if (!slug) return;
    setCatError("");
    try {
      if (catEditId) await api.put(`${basePath}/categories/${catEditId}`, catForm);
      else await api.post(`${basePath}/categories`, catForm);
      setCatModal(false);
      load();
    } catch (e: any) { setCatError(e?.response?.data?.error ?? "Error"); }
  };

  const deleteCategory = async (id: string) => {
    if (!slug) return;
    try { await api.delete(`${basePath}/categories/${id}`); load(); } catch {}
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`¿Eliminar ${selectedIds.size} productos?`)) return;
    setDeleting(true);
    for (const id of selectedIds) {
      try { await api.delete(`${basePath}/products/${id}`); } catch {}
    }
    setSelectedIds(new Set());
    setDeleting(false);
    load();
  };

  const openCatCreate = () => { setCatEditId(null); setCatForm({ name: "", defaultMinStock: 5 }); setCatError(""); setCatModal(true); };
  const openCatEdit = (c: CategoryConfig) => { setCatEditId(c.id); setCatForm({ name: c.name, defaultMinStock: c.defaultMinStock }); setCatError(""); setCatModal(true); };

  const lowStockProducts = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.minStock);
  const outOfStockProducts = products.filter(p => p.stockQuantity <= 0);

  const columns: ColumnDef<Product>[] = [
    {
      id: "select", header: () => (
        <input type="checkbox" className="accent-primary" 
          checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
          onChange={() => {
            if (selectedIds.size === filteredProducts.length) setSelectedIds(new Set());
            else setSelectedIds(new Set(filteredProducts.map(p => p.id)));
          }}
        />
      ),
      cell: ({ row }) => (
        <input type="checkbox" className="accent-primary"
          checked={selectedIds.has(row.original.id)}
          onChange={() => {
            const next = new Set(selectedIds);
            if (next.has(row.original.id)) next.delete(row.original.id);
            else next.add(row.original.id);
            setSelectedIds(next);
          }}
        />
      ),
    },
    {
      header: "Producto", id: "product", cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.imageUrl ? (
            <img src={row.original.imageUrl} alt="" className="w-10 h-10 rounded object-cover border" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">N/A</div>
          )}
          <div>
            <p className="font-medium text-sm">{row.original.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{row.original.sku}</p>
          </div>
        </div>
      ),
    },
    { header: "Categoría", accessorKey: "category" },
    { header: "Precio", accessorKey: "price", cell: ({ getValue }) => `$${Number(getValue()).toFixed(2)}` },
    {
      header: "Stock", id: "stock",
      cell: ({ row }) => {
        const p = row.original;
        const info = stockInfo(p.stockQuantity, p.minStock);
        return (
          <div className="min-w-[110px]">
            <div className="flex items-center gap-2">
              <Badge variant={info.variant}>{info.label}</Badge>
              <span className="text-sm font-mono">{p.stockQuantity}</span>
            </div>
            {p.reservedQuantity > 0 && <p className="text-xs text-muted-foreground mt-0.5">Reservado: {p.reservedQuantity}</p>}
            <div className="w-full h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
              <div className={`h-full rounded-full ${info.pct <= 0 ? "bg-red-500" : info.pct <= 50 ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${Math.max(info.pct, 2)}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      header: "Estado", accessorKey: "status",
      cell: ({ getValue }) => {
        const v = getValue() as string;
        const variant = v === "active" ? "success" as const : v === "inactive" ? "warning" as const : "destructive" as const;
        return <Badge variant={variant}>{v}</Badge>;
      },
    },
    {
      id: "actions", header: "Acciones",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}>Editar</Button>
          <Button variant="ghost" size="sm" onClick={() => openStock(row.original)}>Stock</Button>
        </div>
      ),
    },
  ];

  const filters: FilterConfig[] = [
    {
      type: "select", column: "category", label: "Categoría",
      options: Array.from(new Set(products.map(p => p.category).filter(Boolean))).map(c => ({ value: c!, label: c! })),
    },
    {
      type: "select", column: "status", label: "Estado",
      options: CAT_STATUS.map(s => ({ value: s, label: s === "active" ? "Activo" : s === "inactive" ? "Inactivo" : "Discontinuado" })),
    },
  ];

  const [stockFilter, setStockFilter] = useState("");
  const filteredProducts = stockFilter === "low" 
    ? products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.minStock)
    : stockFilter === "out" 
    ? products.filter(p => p.stockQuantity <= 0)
    : stockFilter === "ok"
    ? products.filter(p => p.stockQuantity > p.minStock)
    : products;

  if (loading) return <p className="p-8 text-muted-foreground">Cargando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Productos</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openCatCreate}>Categorías</Button>
          <Button variant="outline" onClick={downloadTemplate}>Template</Button>
          <Button variant="outline" onClick={() => { setImportFile(null); setImportResult(null); setImportError(""); setImportModal(true); }}>Importar</Button>
          {selectedIds.size > 0 && (
            <Button variant="destructive" onClick={deleteSelected} disabled={deleting}>
              {deleting ? `Eliminando...` : `Eliminar (${selectedIds.size})`}
            </Button>
          )}
          <select className="rounded-lg bg-muted/40 px-3 py-2 text-sm" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
            <option value="">Todo el stock</option>
            <option value="ok">Stock suficiente</option>
            <option value="low">Stock bajo</option>
            <option value="out">Sin stock</option>
          </select>
          {reportsEnabled ? (
            <Button variant="outline" onClick={exportStock}>Exportar CSV</Button>
          ) : (
            <Tooltip content="No disponible en tu plan actual.">
              <Button variant="outline" disabled>Exportar CSV</Button>
            </Tooltip>
          )}
          <Button onClick={openCreate}>Nuevo Producto</Button>
        </div>
      </div>

      {exportMsg && (
        <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-3 text-sm flex items-center justify-between">
          <span>{exportMsg}</span>
          <Button variant="ghost" size="sm" onClick={() => setExportMsg("")}>✕</Button>
        </div>
      )}

      {(outOfStockProducts.length > 0 || lowStockProducts.length > 0) && (
        <Card className="border-yellow-200 dark:border-yellow-800">
          <CardHeader><CardTitle className="text-base text-yellow-700 dark:text-yellow-400">Alertas de Stock</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {outOfStockProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{p.name} <span className="text-xs text-muted-foreground font-mono">{p.sku}</span></span>
                <Badge variant="destructive">Sin stock</Badge>
              </div>
            ))}
            {lowStockProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{p.name} <span className="text-xs text-muted-foreground font-mono">{p.sku}</span></span>
                <span className="text-yellow-600 dark:text-yellow-400 text-xs">Quedan {p.stockQuantity} (mín. {p.minStock})</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">No hay productos todavía</p>
          <p className="text-sm">Crea tu primer producto para comenzar a gestionar tu catálogo.</p>
        </div>
      ) : (
        <DataTable columns={columns} data={filteredProducts} filters={filters} searchable={true} pagination={true} />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Editar Producto" : "Nuevo Producto"} description="Complete los datos del producto.">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input id="sku" label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="PROD-001" />
            <Input id="name" label="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <Input id="description" label="Descripción" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input id="price" label="Precio" type="number" step="0.01" value={form.price || ""} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
            <div>
              <label className="text-sm font-medium mb-1 block">Categoría</label>
              <div className="flex gap-1">
                <select
                  className="flex-1 border rounded-md px-3 py-2 text-sm"
                  value={form.category}
                  onChange={(e) => {
                    const cat = categories.find(c => c.name === e.target.value);
                    setForm({ ...form, category: e.target.value, ...(cat && { status: form.status }) });
                  }}
                >
                  <option value="">Seleccionar...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name} {c.defaultMinStock > 0 ? `(mín. ${c.defaultMinStock})` : ""}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <Input id="imageUrl" label="URL Imagen" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
          {form.imageUrl && (
            <img src={form.imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-md border" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          )}
          <div>
            <label className="text-sm font-medium mb-1 block">Estado</label>
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="discontinued">Discontinuado</option>
            </select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save}>{editing ? "Guardar Cambios" : "Crear Producto"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!stockModal} onClose={() => setStockModal(null)} title={`Stock: ${stockModal?.name ?? ""}`} description="Actualice las cantidades de inventario.">
        <div className="space-y-3">
          <Input id="quantity" label="Cantidad disponible" type="number" value={stockForm.quantity || ""} onChange={(e) => setStockForm({ ...stockForm, quantity: parseInt(e.target.value) || 0 })} />
          <Input id="reservedQuantity" label="Cantidad reservada" type="number" value={stockForm.reservedQuantity || ""} onChange={(e) => setStockForm({ ...stockForm, reservedQuantity: parseInt(e.target.value) || 0 })} />
          <Input id="minStock" label="Stock mínimo (alerta)" type="number" value={stockForm.minStock || ""} onChange={(e) => setStockForm({ ...stockForm, minStock: parseInt(e.target.value) || 0 })} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setStockModal(null)}>Cancelar</Button>
            <Button onClick={saveStock}>Actualizar Stock</Button>
          </div>
        </div>
      </Modal>

      <Modal open={catModal} onClose={() => setCatModal(false)} title={catEditId ? "Editar Categoría" : "Nueva Categoría"} description="Configure la categoría y su alerta de stock mínimo.">
        <div className="space-y-3">
          <Input id="catName" label="Nombre" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} placeholder="Electrónicos" />
          <Input id="catMinStock" label="Stock mínimo por defecto" tooltip="Al crear productos de esta categoría, se usará este valor como alerta de stock bajo." type="number" value={catForm.defaultMinStock || ""} onChange={(e) => setCatForm({ ...catForm, defaultMinStock: parseInt(e.target.value) || 0 })} />
          {catError && <p className="text-sm text-destructive">{catError}</p>}
          <div className="border-t pt-3 mt-3">
            <p className="text-sm font-medium mb-2">Categorías existentes</p>
            {categories.length === 0 ? (
              <p className="text-xs text-muted-foreground">No hay categorías.</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {categories.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-sm border rounded px-3 py-2">
                    <div>
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">Alerta: {c.defaultMinStock} und.</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openCatEdit(c)}>Editar</Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteCategory(c.id)}>✕</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setCatModal(false)}>Cerrar</Button>
            <Button onClick={saveCategory}>{catEditId ? "Guardar" : "Crear Categoría"}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={importModal} onClose={() => setImportModal(false)} title="Importar Productos" description="Sube un archivo CSV con los productos a importar. Descarga el template si no tienes uno.">
        <div className="space-y-3">
          <Button variant="outline" className="w-full" onClick={downloadTemplate}>Descargar Template CSV</Button>
          <div>
            <label className="text-sm font-medium mb-1 block">Archivo CSV</label>
            <input type="file" accept=".csv" className="w-full border rounded-md px-3 py-2 text-sm" onChange={(e) => {
              if (e.target.files?.[0]) setImportFile(e.target.files[0]);
            }} />
          </div>
          {importLoading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Importando productos...
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "60%" }} />
              </div>
            </div>
          )}
          {importResult && (
            <div className={`rounded-md border p-3 ${importResult.errors === 0 ? "border-green-200 bg-green-50 dark:bg-green-950" : "border-yellow-200 bg-yellow-50 dark:bg-yellow-950"}`}>
              <p className="text-sm font-medium">Resultado: {importResult.created} creados, {importResult.errors} errores</p>
              {importResult.errorList.length > 0 && (
                <div className="mt-2 text-xs space-y-0.5 max-h-32 overflow-y-auto">
                  {importResult.errorList.map((e, i) => <p key={i} className="text-destructive">{e}</p>)}
                </div>
              )}
            </div>
          )}
          {importError && <p className="text-sm text-destructive">{importError}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setImportModal(false)}>Cancelar</Button>
            <Button onClick={handleImport} disabled={!importFile || importLoading}>{importLoading ? "Importando..." : "Importar"}</Button>
          </div>
        </div>
      </Modal>

      {exportJobs.length > 0 && (
        <Modal open={true} onClose={() => setExportJobs([])} title="Exportaciones" description="Archivos generados listos para descargar.">
          <div className="space-y-2">
            {exportJobs.filter(j => j.status === "completed").map(j => (
              <div key={j.id} className="flex items-center justify-between border rounded px-3 py-2">
                <span className="text-sm">{new Date(j.createdAt).toLocaleString()} — {j.fileSizeBytes ? `${(j.fileSizeBytes / 1024).toFixed(1)} KB` : ""}</span>
                <Button variant="outline" size="sm" onClick={async () => {
                  try {
                    const res = await api.get(`${basePath}/export/${j.id}/download`, { responseType: "blob" });
                    const url = window.URL.createObjectURL(new Blob([res.data]));
                    const link = document.createElement("a");
                    link.href = url;
                    link.setAttribute("download", `productos_${j.id.slice(0, 8)}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                  } catch {}
                }}>Descargar</Button>
              </div>
            ))}
            {exportJobs.filter(j => j.status !== "completed").map(j => (
              <div key={j.id} className="flex items-center justify-between border rounded px-3 py-2">
                <span className="text-sm text-muted-foreground">{new Date(j.createdAt).toLocaleString()} — {j.status}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end mt-3">
            <Button variant="outline" onClick={() => setExportJobs([])}>Cerrar</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
