export interface Category {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  price: number;
  cost: number;
  stock: number;
  unit: string;
  active: boolean;
}

export interface WholesaleCustomer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  company?: string;
  country: string;
  region?: string;
  active: boolean;
  ordersCount: number;
  totalSpent: number;
  createdAt: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  code: string;
  customerId: string;
  customerName: string;
  sellerName: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
}

export interface Seller {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  region: string;
  active: boolean;
  ordersCount: number;
  salesTotal: number;
}

export interface DirectoryEntry {
  id: string;
  name: string;
  country: string;
  category: string;
  plan: string;
  verified: boolean;
}

export type PublicationType = "offer" | "demand" | "news";

export interface Publication {
  id: string;
  title: string;
  body: string;
  author: string;
  type: PublicationType;
  date: string;
  likes: number;
  comments: number;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  date: string;
  read: boolean;
  type: "order" | "stock" | "system" | "directory";
}

export interface MonthlySales {
  month: string;
  sales: number;
  orders: number;
}
