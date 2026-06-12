import { Store } from "./store";
import type {
  CoreUser,
  Customer,
  Plan,
  Resource,
  Role,
  Tenant,
} from "./types";

export const plansStore = new Store<Plan>([
  {
    id: "plan-basic",
    name: "Básico",
    description: "Para mayoristas que están comenzando",
    priceMonthly: 29,
    priceYearly: 290,
    maxProducts: 100,
    maxCustomers: 50,
    maxSellers: 2,
    features: { backup: false, directory: true, push: false, reports: false, publications: false },
    active: true,
  },
  {
    id: "plan-pro",
    name: "Profesional",
    description: "El más popular entre mayoristas en crecimiento",
    priceMonthly: 79,
    priceYearly: 790,
    maxProducts: 1000,
    maxCustomers: 500,
    maxSellers: 10,
    features: { backup: true, directory: true, push: true, reports: true, publications: false },
    active: true,
  },
  {
    id: "plan-enterprise",
    name: "Empresarial",
    description: "Sin límites, con todas las características",
    priceMonthly: 199,
    priceYearly: 1990,
    maxProducts: 100000,
    maxCustomers: 100000,
    maxSellers: 100,
    features: { backup: true, directory: true, push: true, reports: true, publications: true },
    active: true,
  },
]);

export const tenantsStore = new Store<Tenant>([
  {
    id: "t-1",
    code: "WH-0001",
    name: "Distribuidora Andina",
    slug: "distribuidora-andina",
    status: "active",
    taxId: "20123456789",
    country: "Perú",
    adminName: "Carlos Mendoza",
    adminEmail: "carlos@andina.com",
    address: "Av. La Marina 123, Lima",
    planId: "plan-pro",
    planName: "Profesional",
    billingCycle: "monthly",
    createdAt: "2025-11-02",
  },
  {
    id: "t-2",
    code: "WH-0002",
    name: "Comercial El Sol",
    slug: "comercial-el-sol",
    status: "trial",
    taxId: "20987654321",
    country: "Colombia",
    adminName: "Ana Ruiz",
    adminEmail: "ana@elsol.co",
    address: "Calle 80 #12-34, Bogotá",
    planId: "plan-basic",
    planName: "Básico",
    billingCycle: "monthly",
    createdAt: "2026-01-15",
  },
  {
    id: "t-3",
    code: "WH-0003",
    name: "Mayorista Pacífico",
    slug: "mayorista-pacifico",
    status: "delinquent",
    taxId: "76543210987",
    country: "Chile",
    adminName: "Jorge Soto",
    adminEmail: "jorge@pacifico.cl",
    address: "Av. Providencia 456, Santiago",
    planId: "plan-enterprise",
    planName: "Empresarial",
    billingCycle: "yearly",
    createdAt: "2025-08-21",
  },
  {
    id: "t-4",
    code: "WH-0004",
    name: "Surtidora Central",
    slug: "surtidora-central",
    status: "suspended",
    taxId: "30111222333",
    country: "Argentina",
    adminName: "Lucía Fernández",
    adminEmail: "lucia@central.ar",
    address: "Av. Corrientes 789, Buenos Aires",
    planId: "plan-pro",
    planName: "Profesional",
    billingCycle: "monthly",
    createdAt: "2025-12-09",
  },
  {
    id: "t-5",
    code: "WH-0005",
    name: "Abastos del Norte",
    slug: "abastos-del-norte",
    status: "cancelled",
    taxId: "40555666777",
    country: "México",
    adminName: "Miguel Ángel Torres",
    adminEmail: "miguel@abastosnorte.mx",
    address: "Blvd. Constitución 321, Monterrey",
    planId: "plan-basic",
    planName: "Básico",
    billingCycle: "monthly",
    createdAt: "2025-06-30",
  },
]);

export const customersStore = new Store<Customer>([
  {
    id: "c-1",
    fullName: "María González",
    email: "maria.gonzalez@tienda.com",
    username: "mgonzalez",
    active: true,
    company: "Bodega María",
    country: "Perú",
    region: "Lima",
    createdAt: "2026-02-10",
  },
  {
    id: "c-2",
    fullName: "Pedro Ramírez",
    email: "pedro.ramirez@minimarket.com",
    username: "pramirez",
    active: true,
    company: "Minimarket Pedro",
    country: "Colombia",
    region: "Antioquia",
    createdAt: "2026-03-05",
  },
  {
    id: "c-3",
    fullName: "Sofía Castro",
    email: "sofia@bazarcastro.cl",
    username: "scastro",
    active: false,
    company: "Bazar Castro",
    country: "Chile",
    region: "Valparaíso",
    createdAt: "2025-12-18",
  },
  {
    id: "c-4",
    fullName: "Diego Morales",
    email: "diego.morales@gmail.com",
    username: "dmorales",
    active: true,
    country: "Argentina",
    region: "Córdoba",
    createdAt: "2026-04-22",
  },
]);

export const resourcesStore = new Store<Resource>([
  { id: "r-tenants", code: "tenants", name: "Mayoristas", description: "Gestión de cuentas mayoristas" },
  { id: "r-customers", code: "customers", name: "Clientes", description: "Gestión de clientes minoristas" },
  { id: "r-plans", code: "plans", name: "Planes", description: "Planes de suscripción" },
  { id: "r-billing", code: "billing", name: "Facturación", description: "Facturación y pagos" },
  { id: "r-rbac", code: "rbac", name: "Control de acceso", description: "Roles, usuarios y permisos" },
  { id: "r-profit", code: "profit", name: "Finanzas", description: "Reportes financieros" },
]);

export const rolesStore = new Store<Role>([
  {
    id: "role-super",
    name: "Super Administrador",
    description: "Acceso total a la plataforma",
    system: true,
    userCount: 1,
    permissions: resourcesStore.getAll().map((r) => ({
      resourceId: r.id,
      actions: ["read", "create", "update", "delete"],
    })),
  },
  {
    id: "role-support",
    name: "Soporte",
    description: "Lectura general y gestión de clientes",
    system: false,
    userCount: 3,
    permissions: [
      { resourceId: "r-tenants", actions: ["read"] },
      { resourceId: "r-customers", actions: ["read", "update"] },
      { resourceId: "r-billing", actions: ["read"] },
    ],
  },
  {
    id: "role-finance",
    name: "Finanzas",
    description: "Acceso a facturación y reportes financieros",
    system: false,
    userCount: 2,
    permissions: [
      { resourceId: "r-billing", actions: ["read", "update"] },
      { resourceId: "r-profit", actions: ["read"] },
    ],
  },
]);

export const usersStore = new Store<CoreUser>([
  {
    id: "u-1",
    fullName: "Admin Demo",
    email: "admin@plataforma.com",
    roleId: "role-super",
    roleName: "Super Administrador",
    active: true,
    createdAt: "2025-01-01",
    isProtected: true,
  },
  {
    id: "u-2",
    fullName: "Laura Vega",
    email: "laura@plataforma.com",
    roleId: "role-support",
    roleName: "Soporte",
    active: true,
    createdAt: "2025-09-12",
    isProtected: false,
  },
  {
    id: "u-3",
    fullName: "Raúl Núñez",
    email: "raul@plataforma.com",
    roleId: "role-finance",
    roleName: "Finanzas",
    active: false,
    createdAt: "2025-10-30",
    isProtected: false,
  },
]);

// --- Profit / finance mock -------------------------------------------------
export interface MonthlyProfit {
  month: string;
  collected: number;
  pending: number;
}

export const profitMonthly: MonthlyProfit[] = [
  { month: "Ene", collected: 12400, pending: 2100 },
  { month: "Feb", collected: 13800, pending: 1800 },
  { month: "Mar", collected: 15200, pending: 2600 },
  { month: "Abr", collected: 14100, pending: 3200 },
  { month: "May", collected: 16900, pending: 1500 },
  { month: "Jun", collected: 18300, pending: 2400 },
];

export const profitByPlan = [
  { plan: "Empresarial", subscriptions: 8, mrr: 1592, share: 46 },
  { plan: "Profesional", subscriptions: 21, mrr: 1659, share: 38 },
  { plan: "Básico", subscriptions: 34, mrr: 986, share: 16 },
];

export const topPayers = [
  { tenant: "Mayorista Pacífico", plan: "Empresarial", amount: 1990 },
  { tenant: "Distribuidora Andina", plan: "Profesional", amount: 790 },
  { tenant: "Surtidora Central", plan: "Profesional", amount: 790 },
  { tenant: "Comercial El Sol", plan: "Básico", amount: 290 },
];
