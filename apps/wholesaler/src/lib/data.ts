import { Store } from "./store";
import type {
  AppNotification,
  Category,
  DirectoryEntry,
  Order,
  Product,
  Publication,
  Seller,
  WholesaleCustomer,
} from "./types";

export const categoriesStore = new Store<Category>([
  { id: "cat-abarrotes", name: "Abarrotes", description: "Productos secos y enlatados", active: true },
  { id: "cat-bebidas", name: "Bebidas", description: "Gaseosas, aguas y jugos", active: true },
  { id: "cat-limpieza", name: "Limpieza", description: "Artículos de aseo y hogar", active: true },
  { id: "cat-snacks", name: "Snacks", description: "Galletas, dulces y pasabocas", active: true },
  { id: "cat-lacteos", name: "Lácteos", description: "Leche, quesos y derivados", active: false },
]);

export const productsStore = new Store<Product>([
  { id: "p-1", name: "Arroz Extra 1kg", sku: "ABR-0001", categoryId: "cat-abarrotes", categoryName: "Abarrotes", price: 1.2, cost: 0.9, stock: 1840, unit: "bolsa", active: true },
  { id: "p-2", name: "Aceite Vegetal 1L", sku: "ABR-0002", categoryId: "cat-abarrotes", categoryName: "Abarrotes", price: 2.5, cost: 1.95, stock: 920, unit: "botella", active: true },
  { id: "p-3", name: "Gaseosa Cola 3L", sku: "BEB-0010", categoryId: "cat-bebidas", categoryName: "Bebidas", price: 1.8, cost: 1.3, stock: 640, unit: "botella", active: true },
  { id: "p-4", name: "Agua Mineral 625ml x6", sku: "BEB-0011", categoryId: "cat-bebidas", categoryName: "Bebidas", price: 2.1, cost: 1.5, stock: 380, unit: "pack", active: true },
  { id: "p-5", name: "Detergente 5kg", sku: "LIM-0020", categoryId: "cat-limpieza", categoryName: "Limpieza", price: 6.4, cost: 4.8, stock: 210, unit: "bolsa", active: true },
  { id: "p-6", name: "Lejía 1L", sku: "LIM-0021", categoryId: "cat-limpieza", categoryName: "Limpieza", price: 0.9, cost: 0.6, stock: 12, unit: "botella", active: true },
  { id: "p-7", name: "Galleta Soda x6", sku: "SNK-0030", categoryId: "cat-snacks", categoryName: "Snacks", price: 0.75, cost: 0.5, stock: 1500, unit: "paquete", active: true },
  { id: "p-8", name: "Chocolate Barra x12", sku: "SNK-0031", categoryId: "cat-snacks", categoryName: "Snacks", price: 3.2, cost: 2.4, stock: 0, unit: "caja", active: false },
]);

export const customersStore = new Store<WholesaleCustomer>([
  { id: "wc-1", fullName: "María González", email: "maria@bodegamaria.com", phone: "+51 987 654 321", company: "Bodega María", country: "Perú", region: "Lima", active: true, ordersCount: 24, totalSpent: 4820, createdAt: "2025-09-12" },
  { id: "wc-2", fullName: "Pedro Ramírez", email: "pedro@minimarketpedro.com", phone: "+57 310 222 1133", company: "Minimarket Pedro", country: "Colombia", region: "Antioquia", active: true, ordersCount: 18, totalSpent: 3120, createdAt: "2025-10-03" },
  { id: "wc-3", fullName: "Sofía Castro", email: "sofia@bazarcastro.cl", phone: "+56 9 8123 4567", company: "Bazar Castro", country: "Chile", region: "Valparaíso", active: false, ordersCount: 6, totalSpent: 740, createdAt: "2025-12-18" },
  { id: "wc-4", fullName: "Diego Morales", email: "diego.morales@gmail.com", phone: "+54 351 555 7788", company: "Kiosco Diego", country: "Argentina", region: "Córdoba", active: true, ordersCount: 31, totalSpent: 6210, createdAt: "2026-01-22" },
  { id: "wc-5", fullName: "Lucía Fernández", email: "lucia@almacencentral.pe", phone: "+51 999 111 222", company: "Almacén Central", country: "Perú", region: "Arequipa", active: true, ordersCount: 12, totalSpent: 1980, createdAt: "2026-03-08" },
]);

export const sellersStore = new Store<Seller>([
  { id: "s-1", fullName: "Carlos Mendoza", email: "carlos@miempresa.com", phone: "+51 980 100 200", region: "Lima", active: true, ordersCount: 64, salesTotal: 12400 },
  { id: "s-2", fullName: "Ana Ruiz", email: "ana@miempresa.com", phone: "+51 980 300 400", region: "Arequipa", active: true, ordersCount: 41, salesTotal: 8230 },
  { id: "s-3", fullName: "Jorge Soto", email: "jorge@miempresa.com", phone: "+51 980 500 600", region: "Cusco", active: false, ordersCount: 12, salesTotal: 2110 },
]);

export const ordersStore = new Store<Order>([
  {
    id: "o-1", code: "PED-1042", customerId: "wc-1", customerName: "Bodega María", sellerName: "Carlos Mendoza",
    date: "2026-06-08", status: "pending", total: 248.5,
    items: [
      { productId: "p-1", name: "Arroz Extra 1kg", qty: 100, price: 1.2 },
      { productId: "p-3", name: "Gaseosa Cola 3L", qty: 40, price: 1.8 },
      { productId: "p-7", name: "Galleta Soda x6", qty: 75, price: 0.75 },
    ],
  },
  {
    id: "o-2", code: "PED-1041", customerId: "wc-4", customerName: "Kiosco Diego", sellerName: "Ana Ruiz",
    date: "2026-06-07", status: "confirmed", total: 512.0,
    items: [
      { productId: "p-5", name: "Detergente 5kg", qty: 50, price: 6.4 },
      { productId: "p-2", name: "Aceite Vegetal 1L", qty: 75, price: 2.5 },
    ],
  },
  {
    id: "o-3", code: "PED-1040", customerId: "wc-2", customerName: "Minimarket Pedro", sellerName: "Carlos Mendoza",
    date: "2026-06-05", status: "shipped", total: 189.0,
    items: [{ productId: "p-4", name: "Agua Mineral 625ml x6", qty: 90, price: 2.1 }],
  },
  {
    id: "o-4", code: "PED-1039", customerId: "wc-5", customerName: "Almacén Central", sellerName: "Ana Ruiz",
    date: "2026-06-02", status: "delivered", total: 96.0,
    items: [{ productId: "p-1", name: "Arroz Extra 1kg", qty: 80, price: 1.2 }],
  },
  {
    id: "o-5", code: "PED-1038", customerId: "wc-3", customerName: "Bazar Castro", sellerName: "Jorge Soto",
    date: "2026-05-29", status: "cancelled", total: 64.0,
    items: [{ productId: "p-7", name: "Galleta Soda x6", qty: 85, price: 0.75 }],
  },
]);

export const directoryStore = new Store<DirectoryEntry>([
  { id: "d-1", name: "Comercial El Sol", country: "Colombia", category: "Abarrotes", plan: "Profesional", verified: true },
  { id: "d-2", name: "Mayorista Pacífico", country: "Chile", category: "Bebidas", plan: "Empresarial", verified: true },
  { id: "d-3", name: "Surtidora Central", country: "Argentina", category: "Limpieza", plan: "Profesional", verified: false },
  { id: "d-4", name: "Abastos del Norte", country: "México", category: "Snacks", plan: "Básico", verified: false },
  { id: "d-5", name: "Distribuidora Lima", country: "Perú", category: "Abarrotes", plan: "Empresarial", verified: true },
]);

export const publicationsStore = new Store<Publication>([
  { id: "pub-1", title: "Oferta: Aceite vegetal por volumen", body: "Descuento del 15% en pedidos de más de 200 unidades este mes.", author: "Distribuidora Andina", type: "offer", date: "2026-06-09", likes: 12, comments: 3 },
  { id: "pub-2", title: "Busco proveedor de lácteos en Lima", body: "Necesitamos abastecimiento semanal de leche y quesos. Contactar por interno.", author: "Bodega María", type: "demand", date: "2026-06-07", likes: 5, comments: 8 },
  { id: "pub-3", title: "Nuevo centro de distribución en Arequipa", body: "Ampliamos cobertura al sur del país con entregas en 24h.", author: "Almacén Central", type: "news", date: "2026-06-04", likes: 21, comments: 6 },
]);

export const notificationsStore = new Store<AppNotification>([
  { id: "n-1", title: "Nuevo pedido PED-1042", body: "Bodega María realizó un pedido por $248.50", date: "2026-06-08 09:14", read: false, type: "order" },
  { id: "n-2", title: "Stock bajo: Lejía 1L", body: "Quedan 12 unidades en inventario", date: "2026-06-08 08:02", read: false, type: "stock" },
  { id: "n-3", title: "Pedido PED-1040 enviado", body: "El pedido de Minimarket Pedro fue despachado", date: "2026-06-05 16:40", read: true, type: "order" },
  { id: "n-4", title: "Nueva solicitud en el directorio", body: "Mayorista Pacífico quiere conectar contigo", date: "2026-06-03 11:20", read: true, type: "directory" },
]);

// --- Reports mock ----------------------------------------------------------
export interface MonthlySales {
  month: string;
  sales: number;
  orders: number;
}

export const monthlySales: MonthlySales[] = [
  { month: "Ene", sales: 8400, orders: 62 },
  { month: "Feb", sales: 9200, orders: 71 },
  { month: "Mar", sales: 10800, orders: 88 },
  { month: "Abr", sales: 9900, orders: 79 },
  { month: "May", sales: 12300, orders: 96 },
  { month: "Jun", sales: 13750, orders: 104 },
];

export const topProducts = [
  { name: "Arroz Extra 1kg", sku: "ABR-0001", sold: 4200, revenue: 5040 },
  { name: "Detergente 5kg", sku: "LIM-0020", sold: 780, revenue: 4992 },
  { name: "Aceite Vegetal 1L", sku: "ABR-0002", sold: 1600, revenue: 4000 },
  { name: "Gaseosa Cola 3L", sku: "BEB-0010", sold: 1900, revenue: 3420 },
  { name: "Galleta Soda x6", sku: "SNK-0030", sold: 3800, revenue: 2850 },
];
