import { get, post, put, del, unwrapList } from "@repo/api";
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
  const slug = process.env.NEXT_PUBLIC_TENANT_SLUG;
  if (!slug) throw new Error("NEXT_PUBLIC_TENANT_SLUG is required");
  return `/tenant/${slug}${path}`;
}

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

export const customersApi = {
  list: () => unwrap<WholesaleCustomer>(() => get<ApiList<WholesaleCustomer>>(tenantPath("/customers"))),
  get: (id: string) => get<WholesaleCustomer>(tenantPath(`/customers/${id}`)),
  create: (data: Omit<WholesaleCustomer, "id">) => post<WholesaleCustomer>(tenantPath("/customers"), data),
  update: (id: string, data: Partial<WholesaleCustomer>) => put<void>(tenantPath(`/customers/${id}`), data),
  remove: (id: string) => del<void>(tenantPath(`/customers/${id}`)),
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
