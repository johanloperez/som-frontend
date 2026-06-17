import { get, post, put, del, getUser, unwrapList } from "@repo/api";
import type {
  Category, Product, WholesaleCustomer, Order, Seller, DirectoryEntry, Publication,
} from "./types";

type ApiList<T> = { value: T[]; Count: number };

// Collection endpoints return bare JSON arrays; unwrapList also tolerates
// { value } / { items } / { data } envelopes for safety.
async function unwrap<T>(fetcher: () => Promise<unknown>): Promise<T[]> {
  return unwrapList<T>(await fetcher());
}

function tenantPath(path: string) {
  // Tenant routes are keyed by the wholesaler *code* (e.g. "mayorista-004136857").
  // Prefer the code from the session (set at login); fall back to the build-time
  // env var for single-tenant deployments (whose value is also the code, despite
  // the legacy NEXT_PUBLIC_TENANT_SLUG name).
  const code = getUser()?.tenantCode ?? process.env.NEXT_PUBLIC_TENANT_SLUG;
  if (!code) throw new Error("No hay un mayorista seleccionado. Inicia sesión de nuevo.");
  return `/tenant/${code}${path}`;
}

// --- Geography (platform-level, not tenant-scoped) ---
interface ApiCountry { id: string; name: string; code: string; }
interface ApiRegion { id: string; name: string; }

export interface CountryOption { id: string; value: string; label: string; }

export const geographyApi = {
  countries: () =>
    unwrap<ApiCountry>(() => get<ApiList<ApiCountry>>("/geography/countries")).then((list) =>
      list.map((c): CountryOption => ({ id: c.id, value: c.name, label: c.name })),
    ),
  regions: (countryId: string) =>
    unwrap<ApiRegion>(() => get<ApiList<ApiRegion>>(`/geography/countries/${countryId}/regions`)).then((list) =>
      list.map((r) => ({ value: r.name, label: r.name })),
    ),
};

export const categoriesApi = {
  list: () => unwrap<Category>(() => get<ApiList<Category>>(tenantPath("/categories"))),
  get: (id: string) => get<Category>(tenantPath(`/categories/${id}`)),
  create: (data: Omit<Category, "id">) => post<Category>(tenantPath("/categories"), data),
  update: (id: string, data: Partial<Category>) => put<void>(tenantPath(`/categories/${id}`), data),
  remove: (id: string) => del<void>(tenantPath(`/categories/${id}`)),
};

export const productsApi = {
  list: () => unwrap<Product>(() => get<ApiList<Product>>(tenantPath("/products"))),
  get: (id: string) => get<Product>(tenantPath(`/products/${id}`)),
  create: (data: Omit<Product, "id">) => post<Product>(tenantPath("/products"), data),
  update: (id: string, data: Partial<Product>) => put<void>(tenantPath(`/products/${id}`), data),
  remove: (id: string) => del<void>(tenantPath(`/products/${id}`)),
};

export interface LinkCode {
  id: string;
  code: string;
  qrToken: string;
  maxUses: number;
  expiresAt: string | null;
}

export const customersApi = {
  list: () => unwrap<WholesaleCustomer>(() => get<ApiList<WholesaleCustomer>>(tenantPath("/customers"))),
  get: (id: string) => get<WholesaleCustomer>(tenantPath(`/customers/${id}`)),
  create: (data: Omit<WholesaleCustomer, "id">) => post<WholesaleCustomer>(tenantPath("/customers"), data),
  update: (id: string, data: Partial<WholesaleCustomer>) => put<void>(tenantPath(`/customers/${id}`), data),
  remove: (id: string) => del<void>(tenantPath(`/customers/${id}`)),
  // Wholesaler customers don't have a login; they associate their account with
  // a one-time link code (shareable text/QR). Generated on creation so the
  // operator can hand it to the customer.
  createLinkCode: (customerId: string) =>
    post<LinkCode>(tenantPath(`/customers/${customerId}/link-codes`), { maxUses: 1 }),
};

export const sellersApi = {
  list: () => unwrap<Seller>(() => get<ApiList<Seller>>(tenantPath("/sellers"))),
  get: (id: string) => get<Seller>(tenantPath(`/sellers/${id}`)),
  create: (data: Omit<Seller, "id">) => post<Seller>(tenantPath("/sellers"), data),
  update: (id: string, data: Partial<Seller>) => put<void>(tenantPath(`/sellers/${id}`), data),
  remove: (id: string) => del<void>(tenantPath(`/sellers/${id}`)),
};

export const ordersApi = {
  list: () => unwrap<Order>(() => get<ApiList<Order>>(tenantPath("/orders"))),
  get: (id: string) => get<Order>(tenantPath(`/orders/${id}`)),
  create: (data: Omit<Order, "id">) => post<Order>(tenantPath("/orders"), data),
  updateStatus: (id: string, status: string) => put<void>(tenantPath(`/orders/${id}/status`), { status }),
  cancel: (id: string) => post<void>(tenantPath(`/orders/${id}/cancel`)),
};

export const directoryApi = {
  list: (search?: string) => unwrap<DirectoryEntry>(() => get<ApiList<DirectoryEntry>>(`/directory/wholesalers${search ? `?search=${search}` : ""}`)),
};

export const publicationsApi = {
  list: () => unwrap<Publication>(() => get<ApiList<Publication>>(tenantPath("/publications"))),
  create: (data: Omit<Publication, "id">) => post<Publication>(tenantPath("/publications"), data),
};
