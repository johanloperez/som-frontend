"use client";

import { useEffect, useState } from "react";

export interface Entity {
  id: string;
}

/**
 * In-memory reactive store used as the demo data seam.
 * In a real deployment these methods would proxy to @repo/api;
 * here they keep the storefront fully interactive without a backend.
 */
export class Store<T extends Entity> {
  private items: T[];
  private listeners = new Set<() => void>();

  constructor(seed: T[]) {
    this.items = seed;
  }

  getAll(): T[] {
    return this.items;
  }

  get(id: string): T | undefined {
    return this.items.find((i) => i.id === id);
  }

  create(item: Omit<T, "id">): T {
    const created = { ...item, id: crypto.randomUUID() } as T;
    this.items = [created, ...this.items];
    this.emit();
    return created;
  }

  update(id: string, patch: Partial<T>): void {
    this.items = this.items.map((i) => (i.id === id ? { ...i, ...patch } : i));
    this.emit();
  }

  remove(id: string): void {
    this.items = this.items.filter((i) => i.id !== id);
    this.emit();
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    this.listeners.forEach((l) => l());
  }
}

/** React hook: subscribe to a store and re-render on change. */
export function useStore<T extends Entity>(store: Store<T>): T[] {
  const [, force] = useState(0);
  useEffect(() => store.subscribe(() => force((n) => n + 1)), [store]);
  return store.getAll();
}
