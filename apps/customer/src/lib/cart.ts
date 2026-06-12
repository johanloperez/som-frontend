"use client";

import { useEffect, useState } from "react";
import type { CartItem, StoreProduct } from "./types";

const KEY = "cart_items";

class CartStore {
  private items: CartItem[] = [];
  private listeners = new Set<() => void>();
  private hydrated = false;

  private hydrate() {
    if (this.hydrated || typeof window === "undefined") return;
    this.hydrated = true;
    try {
      const raw = window.sessionStorage.getItem(KEY);
      if (raw) this.items = JSON.parse(raw) as CartItem[];
    } catch {
      this.items = [];
    }
  }

  getAll(): CartItem[] {
    this.hydrate();
    return this.items;
  }

  add(product: StoreProduct, qty: number) {
    this.hydrate();
    const existing = this.items.find((i) => i.productId === product.id);
    if (existing) {
      this.items = this.items.map((i) =>
        i.productId === product.id ? { ...i, qty: i.qty + qty } : i,
      );
    } else {
      this.items = [
        ...this.items,
        { productId: product.id, name: product.name, supplier: product.supplier, price: product.price, unit: product.unit, qty },
      ];
    }
    this.persist();
  }

  setQty(productId: string, qty: number) {
    this.hydrate();
    if (qty <= 0) return this.remove(productId);
    this.items = this.items.map((i) => (i.productId === productId ? { ...i, qty } : i));
    this.persist();
  }

  remove(productId: string) {
    this.hydrate();
    this.items = this.items.filter((i) => i.productId !== productId);
    this.persist();
  }

  clear() {
    this.items = [];
    this.persist();
  }

  count(): number {
    return this.getAll().reduce((s, i) => s + i.qty, 0);
  }

  subtotal(): number {
    return this.getAll().reduce((s, i) => s + i.qty * i.price, 0);
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private persist() {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(KEY, JSON.stringify(this.items));
    }
    this.listeners.forEach((l) => l());
  }
}

export const cart = new CartStore();

export function useCart() {
  const [, force] = useState(0);
  useEffect(() => cart.subscribe(() => force((n) => n + 1)), []);
  return {
    items: cart.getAll(),
    count: cart.count(),
    subtotal: cart.subtotal(),
    add: (p: StoreProduct, qty: number) => cart.add(p, qty),
    setQty: (id: string, qty: number) => cart.setQty(id, qty),
    remove: (id: string) => cart.remove(id),
    clear: () => cart.clear(),
  };
}
