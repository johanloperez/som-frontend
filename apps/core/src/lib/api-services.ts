import { get, post, put, del, unwrapList } from "@repo/api";
import type { Tenant, Plan, Customer, CoreUser, Resource, Role, PermissionGrant } from "./types";

const P = "/platform";

type ApiList<T> = { value: T[]; Count: number };

// Collection endpoints return bare JSON arrays; unwrapList also tolerates
// { value } / { items } / { data } envelopes for safety.
async function unwrap<T>(fetcher: () => Promise<unknown>): Promise<T[]> {
  return unwrapList<T>(await fetcher());
}

// --- Plans ---
interface ApiPlan {
  id: string; name: string; monthlyPrice: number; yearlyPrice: number;
  maxUsers: number; maxSellers: number; maxStorageMb: number;
  backupEnabled: boolean; exportFormats: string; maxCampaignsPerMonth: number;
  maxProducts: number; includesDirectoryListing: boolean;
  pushNotificationsEnabled: boolean; reportsEnabled: boolean; publicationsEnabled: boolean;
}

function mapPlan(p: ApiPlan): Plan {
  return {
    id: p.id, name: p.name, description: "",
    priceMonthly: p.monthlyPrice, priceYearly: p.yearlyPrice,
    maxProducts: p.maxProducts, maxCustomers: p.maxSellers, maxSellers: p.maxSellers,
    features: {
      backup: p.backupEnabled, directory: p.includesDirectoryListing,
      push: p.pushNotificationsEnabled, reports: p.reportsEnabled,
      publications: p.publicationsEnabled,
    },
    active: true,
  };
}

export const plansApi = {
  list: () => unwrap<ApiPlan>(() => get<ApiList<ApiPlan>>(`${P}/subscription-plans`)).then(r => r.map(mapPlan)),
  get: (id: string) => get<ApiPlan>(`${P}/subscription-plans/${id}`).then(mapPlan),
  create: (data: Omit<Plan, "id">) => post<Plan>(`${P}/subscription-plans`, data),
  update: (id: string, data: Partial<Plan>) => put<void>(`${P}/subscription-plans/${id}`, data),
  remove: (id: string) => del<void>(`${P}/subscription-plans/${id}`),
};

// --- Tenants ---
interface ApiTenant {
  id: string; code: string; slug: string; legalName: string; displayName: string;
  taxId: string; country: string | null; region: string | null; city: string | null;
  streetLine1: string | null; postalCode: string | null;
  createdAt: string; updatedAt: string; subscriptionStatus: string;
}

function mapTenant(t: ApiTenant): Tenant {
  return {
    id: t.id, code: t.code, slug: t.slug,
    name: t.displayName ?? t.legalName,
    status: (t.subscriptionStatus ?? "active") as Tenant["status"],
    taxId: t.taxId, country: t.country ?? "",
    adminName: t.legalName, adminEmail: "",
    address: [t.streetLine1, t.city, t.region].filter(Boolean).join(", ") || "",
    planId: "", planName: "", billingCycle: "monthly",
    createdAt: t.createdAt,
  };
}

export const tenantsApi = {
  list: () => unwrap<ApiTenant>(() => get<ApiList<ApiTenant>>(`${P}/tenants`)).then(r => r.map(mapTenant)),
  get: (id: string) => get<ApiTenant>(`${P}/tenants/${id}`).then(mapTenant),
  create: (data: Omit<Tenant, "id">) => post<Tenant>(`${P}/tenants`, data),
  update: (id: string, data: Partial<Tenant>) => put<void>(`${P}/tenants/${id}`, data),
  remove: (id: string) => del<void>(`${P}/tenants/${id}`),
  updateStatus: (id: string, status: string) => put<void>(`${P}/tenants/${id}/status`, { status }),
  assignPlan: (id: string, planId: string) => post<void>(`${P}/tenants/${id}/subscription/assign`, { planId }),
  suspend: (id: string) => post<void>(`${P}/tenants/${id}/subscription/suspend`),
  reactivate: (id: string) => post<void>(`${P}/tenants/${id}/subscription/reactivate`),
  cancelSubscription: (id: string) => post<void>(`${P}/tenants/${id}/subscription/cancel`),
  updateSubscriptionPlan: (id: string, planId: string) => put<void>(`${P}/tenants/${id}/subscription/plan`, { planId }),
  updateBillingType: (id: string, billingCycle: string) => put<void>(`${P}/tenants/${id}/subscription/billing-type`, { billingCycle }),
};

// --- Customers ---
interface ApiCustomer {
  id: string; fullName: string; email: string; username: string;
  active: boolean; company?: string; country: string; region?: string; createdAt: string;
}

export const customersApi = {
  list: () => unwrap<ApiCustomer>(() => get<ApiList<ApiCustomer>>(`${P}/customers`)),
  get: (id: string) => get<Customer>(`${P}/customers/${id}`),
  create: (data: Omit<Customer, "id">) => post<Customer>(`${P}/customers`, data),
  update: (id: string, data: Partial<Customer>) => put<void>(`${P}/customers/${id}`, data),
  remove: (id: string) => del<void>(`${P}/customers/${id}`),
};

// --- Resources ---
interface ApiResource { id: string; code: string; name?: string; description: string; group: string; }

function mapResource(r: ApiResource): Resource {
  // Use the stored name; fall back to the code for legacy rows created before the name column existed.
  return { id: r.id, code: r.code, name: r.name?.trim() || r.code.toUpperCase(), description: r.description };
}

export const resourcesApi = {
  list: () => unwrap<ApiResource>(() => get<ApiList<ApiResource>>(`${P}/resources`)).then(r => r.map(mapResource)),
  create: (data: Omit<Resource, "id">) => post<Resource>(`${P}/resources`, data),
  remove: (id: string) => del<void>(`${P}/resources/${id}`),
};

// --- Roles ---
interface ApiRolePermission { id: string; code: string; description: string; group: string; }
interface ApiRole { id: string; name: string; isSystem: boolean; permissions: ApiRolePermission[]; userCount?: number; }

// The backend stores grants at the resource level (no per-action granularity),
// so a granted resource is shown with all actions enabled in the matrix.
const ALL_ACTIONS = ["read", "create", "update", "delete"] as const;

function mapRole(r: ApiRole): Role {
  return {
    id: r.id, name: r.name, description: r.permissions.map(p => p.description).join(", "),
    system: r.isSystem, userCount: r.userCount ?? 0,
    permissions: r.permissions.map(p => ({ resourceId: p.id, actions: [...ALL_ACTIONS] })),
  };
}

export const rolesApi = {
  list: () => unwrap<ApiRole>(() => get<ApiList<ApiRole>>(`${P}/roles`)).then(r => r.map(mapRole)),
  create: (data: Omit<Role, "id">) => post<Role>(`${P}/roles`, data),
  updatePermissions: (id: string, resourceIds: string[]) => put<void>(`${P}/roles/${id}/permissions`, { resourceIds }),
};

// --- Users ---
interface ApiUserRole { id: string; name: string; isSystem: boolean; permissions: string; }
interface ApiUser { id: string; email: string; fullName: string; status: string; role: string; roles: ApiUserRole[]; isProtected?: boolean; }

function mapUser(u: ApiUser): CoreUser {
  return {
    id: u.id, fullName: u.fullName, email: u.email,
    roleId: u.roles?.[0]?.id ?? "", roleName: u.roles?.[0]?.name ?? u.role ?? "",
    active: u.status === "active", createdAt: "", isProtected: u.isProtected ?? false,
  };
}

export interface CreateUserPayload {
  email: string;
  fullName: string;
  password: string;
  roleIds: string[];
}

export const usersApi = {
  list: () => unwrap<ApiUser>(() => get<ApiList<ApiUser>>(`${P}/users`)).then(r => r.map(mapUser)),
  create: (data: CreateUserPayload) => post<CoreUser>(`${P}/users`, data),
  assignRoles: (id: string, roleIds: string[]) => post<void>(`${P}/users/${id}/roles`, { roleIds }),
};

// --- Profit ---
export const profitApi = {
  summary: () => get<{
    totalCollected: number; totalPending: number; totalOverdue: number;
    monthlyRecurringRevenue: number; annualRecurringRevenue: number;
    estimatedNextMonth: number; collectedThisMonth: number; collectedLastMonth: number;
    growthPercent: number; activeSubscriptions: number; totalSubscriptions: number;
  }>(`${P}/profit/summary`),
  details: () => get<{
    monthlyHistory: { month: string; year: number; monthNumber: number; collected: number; pending: number; overdue: number }[];
    byPlan: { planId: string; planName: string; activeSubscriptions: number; mrr: number; percentOfTotal: number }[];
    byTenant: { tenantId: string; tenantName: string; planName: string; totalInvoiced: number; totalCollected: number; pendingAmount: number }[];
  }>(`${P}/profit/details`),
};
