import { get, post, put, patch, del, unwrapList } from "@repo/api";
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
  createdAt: string; updatedAt: string; subscriptionStatus?: string;
  // Only returned by the Detail endpoint (resolved from the tenant's user DB), not by List.
  adminEmail?: string; adminFullName?: string;
}

function mapTenant(t: ApiTenant): Tenant {
  return {
    id: t.id, code: t.code, slug: t.slug,
    name: t.displayName ?? t.legalName,
    status: (t.subscriptionStatus ?? "active") as Tenant["status"],
    taxId: t.taxId, country: t.country ?? "",
    adminName: t.adminFullName || t.legalName, adminEmail: t.adminEmail ?? "",
    address: [t.streetLine1, t.city, t.region].filter(Boolean).join(", ") || "",
    planId: "", planName: "", billingCycle: "monthly",
    createdAt: t.createdAt,
  };
}

export interface CreateTenantInput {
  slug: string;
  displayName: string;
  legalName: string;
  taxId?: string;
  adminEmail: string;
  adminFullName: string;
  planId?: string;
  billingType?: string;
  country?: string;
  region?: string;
  city?: string;
  streetLine1?: string;
  postalCode?: string;
}

export interface TenantCredentials {
  code: string;
  adminEmail: string;
  password: string;
  loginUrl?: string;
  message?: string;
}

async function createTenant(input: CreateTenantInput): Promise<TenantCredentials> {
  const res = await post<{
    tenant: { code: string; slug: string };
    credentials: { email: string; password: string; tenantCode?: string; loginUrl?: string; message?: string };
  }>(`${P}/tenants`, {
    slug: input.slug,
    displayName: input.displayName,
    legalName: input.legalName,
    taxId: input.taxId,
    providerCode: input.slug,
    adminEmail: input.adminEmail,
    adminFullName: input.adminFullName,
    planId: input.planId || undefined,
    billingType: input.billingType ?? "monthly",
    country: input.country,
    region: input.region,
    city: input.city,
    streetLine1: input.streetLine1,
    postalCode: input.postalCode,
  });
  return {
    code: res.credentials.tenantCode ?? res.tenant.code,
    adminEmail: res.credentials.email,
    password: res.credentials.password,
    loginUrl: res.credentials.loginUrl,
    message: res.credentials.message,
  };
}

export const tenantsApi = {
  list: () => unwrap<ApiTenant>(() => get<ApiList<ApiTenant>>(`${P}/tenants`)).then(r => r.map(mapTenant)),
  get: (id: string) => get<ApiTenant>(`${P}/tenants/${id}`).then(mapTenant),
  create: createTenant,
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

// --- Subscription (current plan for a tenant) ---
export interface TenantSubscription {
  id: string;
  planId: string;
  planName: string;
  billingType: string; // monthly | yearly
  status: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currentPeriodEnd: string;
}

interface ApiSubscription {
  id: string; planId: string; planName: string;
  monthlyPrice: number; yearlyPrice: number;
  status: string; billingType: string; currentPeriodEnd: string;
}

export const subscriptionApi = {
  get: (tenantId: string) =>
    get<ApiSubscription>(`${P}/tenants/${tenantId}/subscription`).then((s): TenantSubscription => ({
      id: s.id, planId: s.planId, planName: s.planName,
      billingType: s.billingType, status: s.status,
      monthlyPrice: s.monthlyPrice, yearlyPrice: s.yearlyPrice,
      currentPeriodEnd: (s.currentPeriodEnd ?? "").slice(0, 10),
    })),
  changePlan: (tenantId: string, planId: string, billingType: string) =>
    put<unknown>(`${P}/tenants/${tenantId}/subscription/plan`, { planId, billingType, applyNow: true }),
  changeBillingType: (tenantId: string, billingType: string) =>
    put<unknown>(`${P}/tenants/${tenantId}/subscription/billing-type`, { billingType, applyNow: true }),
};

// --- Billing (platform view of a tenant's subscription billing) ---
export interface BillingInvoice {
  id: string;
  number: string;
  amount: number;
  status: string; // pending | paid | rejected | overdue
  dueDate: string;
  paidAt?: string;
}

export interface UpcomingInvoice {
  planName: string;
  amount: number;
  billingType: string;
  estimatedDate: string;
}

export interface BillingPaymentMethod {
  id: string;
  type: string;
  label: string;
  details?: string;
  isDefault: boolean;
}

interface ApiInvoice {
  invoiceId: string; invoiceNumber: string; totalAmount: number;
  status: string; dueDate: string; paidAt?: string | null;
}
interface ApiUpcoming {
  subscriptionId: string; planName: string; amount: number;
  billingType: string; estimatedDate: string;
}
interface ApiPaymentMethod {
  id: string; type: string; label: string; details?: string | null; isDefault: boolean;
}

const billingBase = (tenantId: string) => `${P}/tenants/${tenantId}/billing`;

function mapInvoice(i: ApiInvoice): BillingInvoice {
  return {
    id: i.invoiceId, number: i.invoiceNumber, amount: i.totalAmount,
    status: i.status, dueDate: (i.dueDate ?? "").slice(0, 10),
    paidAt: i.paidAt ?? undefined,
  };
}

export const billingApi = {
  invoices: (tenantId: string) =>
    unwrap<ApiInvoice>(() => get<ApiList<ApiInvoice>>(`${billingBase(tenantId)}/invoices`)).then((r) => r.map(mapInvoice)),
  upcoming: (tenantId: string) =>
    get<ApiUpcoming>(`${billingBase(tenantId)}/upcoming`).then((u): UpcomingInvoice => ({
      planName: u.planName, amount: u.amount, billingType: u.billingType,
      estimatedDate: (u.estimatedDate ?? "").slice(0, 10),
    })),
  generateInvoice: (tenantId: string) => post<unknown>(`${billingBase(tenantId)}/generate-invoice`, {}),
  confirm: (tenantId: string, invoiceId: string, amount: number) =>
    post<void>(`${billingBase(tenantId)}/invoices/${invoiceId}/confirm`, { amount }),
  reject: (tenantId: string, invoiceId: string, reason: string) =>
    post<void>(`${billingBase(tenantId)}/invoices/${invoiceId}/reject`, { reason }),
  methods: (tenantId: string) =>
    unwrap<ApiPaymentMethod>(() => get<ApiList<ApiPaymentMethod>>(`${billingBase(tenantId)}/methods`)).then((r) =>
      r.map((m): BillingPaymentMethod => ({ id: m.id, type: m.type, label: m.label, details: m.details ?? undefined, isDefault: m.isDefault })),
    ),
  addMethod: (tenantId: string, data: { type: string; label: string; details?: string; isDefault?: boolean }) =>
    post<unknown>(`${billingBase(tenantId)}/methods`, data),
  removeMethod: (tenantId: string, methodId: string) => del<void>(`${billingBase(tenantId)}/methods/${methodId}`),
  setDefaultMethod: (tenantId: string, methodId: string) => patch<void>(`${billingBase(tenantId)}/methods/${methodId}/default`),
};

// --- Geography ---
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
