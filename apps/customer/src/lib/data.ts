import { Store } from "./store";
import type { RetailOrder, StoreProduct, Supplier } from "./types";

export const productsStore = new Store<StoreProduct>([
  { id: "p-1", name: "Arroz Extra 1kg", sku: "ABR-0001", category: "Abarrotes", supplier: "Distribuidora Andina", price: 1.2, unit: "bolsa", minOrder: 50, stock: 1840, accent: "accent-1", description: "Arroz de grano extra largo, ideal para reventa. Empaque de 1kg." },
  { id: "p-2", name: "Aceite Vegetal 1L", sku: "ABR-0002", category: "Abarrotes", supplier: "Distribuidora Andina", price: 2.5, unit: "botella", minOrder: 24, stock: 920, accent: "accent-4", description: "Aceite vegetal puro de 1 litro. Caja de 12 unidades disponible." },
  { id: "p-3", name: "Gaseosa Cola 3L", sku: "BEB-0010", category: "Bebidas", supplier: "Mayorista Pacífico", price: 1.8, unit: "botella", minOrder: 12, stock: 640, accent: "accent-3", description: "Gaseosa sabor cola en presentación familiar de 3 litros." },
  { id: "p-4", name: "Agua Mineral 625ml x6", sku: "BEB-0011", category: "Bebidas", supplier: "Mayorista Pacífico", price: 2.1, unit: "pack", minOrder: 10, stock: 380, accent: "accent-2", description: "Pack de 6 botellas de agua mineral sin gas de 625ml." },
  { id: "p-5", name: "Detergente 5kg", sku: "LIM-0020", category: "Limpieza", supplier: "Surtidora Central", price: 6.4, unit: "bolsa", minOrder: 8, stock: 210, accent: "accent-2", description: "Detergente en polvo multiusos, bolsa de 5kg de alto rendimiento." },
  { id: "p-6", name: "Lejía 1L", sku: "LIM-0021", category: "Limpieza", supplier: "Surtidora Central", price: 0.9, unit: "botella", minOrder: 24, stock: 120, accent: "accent-3", description: "Lejía concentrada de 1 litro para desinfección y limpieza." },
  { id: "p-7", name: "Galleta Soda x6", sku: "SNK-0030", category: "Snacks", supplier: "Abastos del Norte", price: 0.75, unit: "paquete", minOrder: 50, stock: 1500, accent: "accent-1", description: "Paquete de 6 galletas de soda, presentación para reventa." },
  { id: "p-8", name: "Chocolate Barra x12", sku: "SNK-0031", category: "Snacks", supplier: "Abastos del Norte", price: 3.2, unit: "caja", minOrder: 6, stock: 240, accent: "accent-4", description: "Caja de 12 barras de chocolate con leche de 30g." },
  { id: "p-9", name: "Azúcar Rubia 1kg", sku: "ABR-0003", category: "Abarrotes", supplier: "Distribuidora Andina", price: 1.0, unit: "bolsa", minOrder: 50, stock: 980, accent: "accent-4", description: "Azúcar rubia de caña, bolsa de 1kg sellada al vacío." },
  { id: "p-10", name: "Jugo Néctar 1L x12", sku: "BEB-0012", category: "Bebidas", supplier: "Mayorista Pacífico", price: 9.6, unit: "caja", minOrder: 4, stock: 160, accent: "accent-3", description: "Caja de 12 cajas de jugo néctar de durazno de 1 litro." },
  { id: "p-11", name: "Jabón de Tocador x3", sku: "LIM-0022", category: "Limpieza", supplier: "Surtidora Central", price: 1.5, unit: "pack", minOrder: 20, stock: 560, accent: "accent-2", description: "Pack de 3 jabones de tocador aroma floral de 90g." },
  { id: "p-12", name: "Caramelos Surtidos 1kg", sku: "SNK-0032", category: "Snacks", supplier: "Abastos del Norte", price: 4.5, unit: "bolsa", minOrder: 10, stock: 320, accent: "accent-1", description: "Bolsa de 1kg de caramelos surtidos de frutas." },
]);

export const suppliersStore = new Store<Supplier>([
  { id: "sup-1", name: "Distribuidora Andina", country: "Perú", rating: 4.8, productsCount: 3 },
  { id: "sup-2", name: "Mayorista Pacífico", country: "Chile", rating: 4.6, productsCount: 3 },
  { id: "sup-3", name: "Surtidora Central", country: "Argentina", rating: 4.4, productsCount: 3 },
  { id: "sup-4", name: "Abastos del Norte", country: "México", rating: 4.7, productsCount: 3 },
]);

export const ordersStore = new Store<RetailOrder>([
  {
    id: "ro-1", code: "ORD-2051", supplier: "Distribuidora Andina", date: "2026-06-08", status: "pending", total: 144.0,
    items: [
      { productId: "p-1", name: "Arroz Extra 1kg", qty: 80, price: 1.2 },
      { productId: "p-9", name: "Azúcar Rubia 1kg", qty: 48, price: 1.0 },
    ],
  },
  {
    id: "ro-2", code: "ORD-2050", supplier: "Mayorista Pacífico", date: "2026-06-05", status: "shipped", total: 96.0,
    items: [{ productId: "p-10", name: "Jugo Néctar 1L x12", qty: 10, price: 9.6 }],
  },
  {
    id: "ro-3", code: "ORD-2049", supplier: "Surtidora Central", date: "2026-06-01", status: "delivered", total: 51.2,
    items: [{ productId: "p-5", name: "Detergente 5kg", qty: 8, price: 6.4 }],
  },
  {
    id: "ro-4", code: "ORD-2048", supplier: "Abastos del Norte", date: "2026-05-26", status: "delivered", total: 37.5,
    items: [{ productId: "p-7", name: "Galleta Soda x6", qty: 50, price: 0.75 }],
  },
]);
