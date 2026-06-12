import { get, post, unwrapList } from "@repo/api";
import type { RetailOrder, RetailOrderItem, RetailOrderStatus, StoreProduct } from "./types";

// The customer (minoristas) storefront is scoped to a single wholesaler tenant,
// configured via NEXT_PUBLIC_TENANT_SLUG. All catalog/order endpoints are
// tenant-scoped under /api/v1/tenant/{slug}/...
const TENANT_SLUG =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_TENANT_SLUG) || "";

const tenantBase = `/tenant/${TENANT_SLUG}`;

// Backend list endpoints return bare JSON arrays; unwrapList also tolerates
// OData-style { value } / paged { items, data } envelopes for safety.
const asArray = unwrapList;

function str(v: unknown, fallback = ""): string {
  return v == null ? fallback : String(v);
}
function num(v: unknown, fallback = 0): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : fallback;
}

// ---- Products -------------------------------------------------------------

interface ApiProduct {
  id?: string;
  productId?: string;
  sku?: string;
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  categoryName?: string;
  imageUrl?: string;
  status?: string;
  stock?: number;
  stockQuantity?: number;
  unit?: string;
  minOrder?: number;
  minOrderQuantity?: number;
  supplier?: string;
}

function mapProduct(p: ApiProduct, i: number): StoreProduct {
  return {
    id: str(p.id ?? p.productId),
    name: str(p.name, "Producto"),
    sku: str(p.sku),
    category: str(p.category ?? p.categoryName, "General"),
    supplier: str(p.supplier, TENANT_SLUG),
    price: num(p.price),
    unit: str(p.unit, "unidad"),
    minOrder: num(p.minOrder ?? p.minOrderQuantity, 1),
    stock: num(p.stock ?? p.stockQuantity, 0),
    accent: `accent-${(i % 4) + 1}`,
    description: str(p.description),
  };
}

export const productsApi = {
  list: async (): Promise<StoreProduct[]> => {
    const res = await get<unknown>(`${tenantBase}/products`);
    return asArray<ApiProduct>(res).map(mapProduct);
  },
  get: async (id: string): Promise<StoreProduct> => {
    const p = await get<ApiProduct>(`${tenantBase}/products/${id}`);
    return mapProduct(p, 0);
  },
};

// ---- Orders ---------------------------------------------------------------

const STATUS_MAP: Record<string, RetailOrderStatus> = {
  pending: "pending",
  pendiente: "pending",
  created: "pending",
  draft: "pending",
  confirmed: "confirmed",
  confirmado: "confirmed",
  accepted: "confirmed",
  processing: "confirmed",
  shipped: "shipped",
  enviado: "shipped",
  intransit: "shipped",
  in_transit: "shipped",
  delivered: "delivered",
  entregado: "delivered",
  completed: "delivered",
  cancelled: "cancelled",
  canceled: "cancelled",
  cancelado: "cancelled",
  rejected: "cancelled",
};

function mapStatus(s: unknown): RetailOrderStatus {
  return STATUS_MAP[str(s).toLowerCase().replace(/\s+/g, "")] ?? "pending";
}

interface ApiOrderItem {
  productId?: string;
  name?: string;
  productName?: string;
  quantity?: number;
  qty?: number;
  price?: number;
  unitPrice?: number;
}

interface ApiOrder {
  id?: string;
  orderId?: string;
  code?: string;
  number?: string;
  orderNumber?: string;
  supplier?: string;
  supplierName?: string;
  tenantName?: string;
  createdAt?: string;
  date?: string;
  status?: string;
  items?: ApiOrderItem[];
  lines?: ApiOrderItem[];
  total?: number;
  totalAmount?: number;
}

function mapOrderItem(it: ApiOrderItem): RetailOrderItem {
  return {
    productId: str(it.productId),
    name: str(it.name ?? it.productName, "Producto"),
    qty: num(it.quantity ?? it.qty, 1),
    price: num(it.price ?? it.unitPrice),
  };
}

function mapOrder(o: ApiOrder): RetailOrder {
  const items = (o.items ?? o.lines ?? []).map(mapOrderItem);
  const total = num(
    o.total ?? o.totalAmount,
    items.reduce((s, i) => s + i.qty * i.price, 0),
  );
  const created = str(o.createdAt ?? o.date);
  return {
    id: str(o.id ?? o.orderId),
    code: str(o.code ?? o.orderNumber ?? o.number, str(o.id ?? o.orderId).slice(0, 8)),
    supplier: str(o.supplier ?? o.supplierName ?? o.tenantName, TENANT_SLUG),
    date: created ? created.slice(0, 10) : new Date().toISOString().slice(0, 10),
    status: mapStatus(o.status),
    items,
    total,
  };
}

export interface CreateOrderInput {
  items: { productId: string; quantity: number }[];
  notes?: string;
}

// ---- Associations (link customer to a wholesaler by code) -----------------

export interface Association {
  tenantId: string;
  slug: string;
  name: string;
  status: string;
}

interface ApiAssociation {
  tenantId?: string;
  id?: string;
  slug?: string;
  displayName?: string;
  legalName?: string;
  name?: string;
  status?: string;
}

function mapAssociation(a: ApiAssociation): Association {
  return {
    tenantId: str(a.tenantId ?? a.id),
    slug: str(a.slug),
    name: str(a.displayName ?? a.name ?? a.legalName ?? a.slug, "Mayorista"),
    status: str(a.status, "active"),
  };
}

export const associationsApi = {
  my: async (): Promise<Association[]> => {
    const res = await get<unknown>("/associations/my");
    return asArray<ApiAssociation>(res).map(mapAssociation);
  },
  claimByCode: (code: string) =>
    post<unknown>("/associations/claim-by-code", { code }),
};

export const ordersApi = {
  list: async (): Promise<RetailOrder[]> => {
    const res = await get<unknown>(`${tenantBase}/orders/my`);
    return asArray<ApiOrder>(res).map(mapOrder);
  },
  get: async (id: string): Promise<RetailOrder> => {
    const o = await get<ApiOrder>(`${tenantBase}/orders/${id}`);
    return mapOrder(o);
  },
  create: (input: CreateOrderInput) =>
    post<unknown>(`${tenantBase}/orders`, { items: input.items, notes: input.notes ?? "" }),
  cancel: (id: string) => post<unknown>(`${tenantBase}/orders/${id}/cancel`),
};
