export type TenantStatus =
  | "active"
  | "trial"
  | "suspended"
  | "delinquent"
  | "cancelled";

export interface Tenant {
  id: string;
  code: string;
  name: string;
  slug: string;
  status: TenantStatus;
  taxId: string;
  country: string;
  adminName: string;
  adminEmail: string;
  address: string;
  planId: string;
  planName: string;
  billingCycle: "monthly" | "yearly";
  createdAt: string;
}

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  active: boolean;
  company?: string;
  country: string;
  region?: string;
  createdAt: string;
}

export interface PlanFeatures {
  backup: boolean;
  directory: boolean;
  push: boolean;
  reports: boolean;
  publications: boolean;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  maxProducts: number;
  maxCustomers: number;
  maxSellers: number;
  features: PlanFeatures;
  active: boolean;
}

export interface CoreUser {
  id: string;
  fullName: string;
  email: string;
  roleId: string;
  roleName: string;
  active: boolean;
  createdAt: string;
  /** The protected super user cannot have its roles edited. */
  isProtected: boolean;
}

export interface PermissionGrant {
  resourceId: string;
  actions: ("read" | "create" | "update" | "delete")[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  system: boolean;
  permissions: PermissionGrant[];
  userCount: number;
}

export interface Resource {
  id: string;
  code: string;
  name: string;
  description: string;
}
