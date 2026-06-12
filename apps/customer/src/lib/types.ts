export interface StoreProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  supplier: string;
  price: number;
  unit: string;
  minOrder: number;
  stock: number;
  accent: string;
  description: string;
}

export interface CartItem {
  productId: string;
  name: string;
  supplier: string;
  price: number;
  unit: string;
  qty: number;
}

export type RetailOrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface RetailOrderItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
}

export interface RetailOrder {
  id: string;
  code: string;
  supplier: string;
  date: string;
  status: RetailOrderStatus;
  items: RetailOrderItem[];
  total: number;
}

export interface Supplier {
  id: string;
  name: string;
  country: string;
  rating: number;
  productsCount: number;
}
