// Shared domain & API types across all three portals.

export interface Permission {
  code: string;
  scope: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  permissions: Permission[];
  tenantSlug?: string;
  tenantCode?: string;
  avatarUrl?: string;
  mustChangePassword?: boolean;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  tenantCode?: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  redirectUrl?: string;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

export type EntityEvent =
  | "customer"
  | "tenant"
  | "plan"
  | "product"
  | "order"
  | "seller"
  | "publication"
  | "association-request"
  | "region"
  | "subscription"
  | "profit"
  | "role"
  | "user"
  | "resource"
  | "customer-profile"
  | "association";
