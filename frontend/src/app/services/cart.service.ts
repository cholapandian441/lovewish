import { Injectable, computed, effect, signal } from '@angular/core';
import { CartItem, Product } from '../models/models';

const STORAGE_KEY = 'lw_cart';
const MAX_QTY = 99;

@Injectable({ providedIn: 'root' })
export class CartService {
  // ─── Private state ────────────────────────────────────────
  private _items = signal<CartItem[]>(this.loadFromStorage());

  // ─── Public readonly signals ──────────────────────────────
  readonly items = this._items.asReadonly();

  readonly count = computed(() =>
    this._items().reduce((sum, i) => sum + i.quantity, 0)
  );

  readonly total = computed(() =>
    this._items().reduce((sum, i) => sum + i.product.price * i.quantity, 0)
  );

  readonly isEmpty = computed(() => this._items().length === 0);

  constructor() {
    // Auto-persist whenever _items changes — no manual persist() calls needed
    effect(() => {
      const items = this._items();
      if (items.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      }
    });
  }

  // ─── Queries ──────────────────────────────────────────────

  isInCart(productId: number): boolean {
    return this._items().some((i) => i.product.id === productId);
  }

  getItemQuantity(productId: number): number {
    return this._items().find((i) => i.product.id === productId)?.quantity ?? 0;
  }

  // ─── Actions ──────────────────────────────────────────────

  add(product: Product, quantity = 1): void {
    this._items.update((items) => {
      const existing = items.find((i) => i.product.id === product.id);
      if (existing) {
        return items.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + quantity, MAX_QTY) }
            : i
        );
      }
      return [...items, { product, quantity: Math.min(quantity, MAX_QTY) }];
    });
  }

  remove(productId: number): void {
    this._items.update((items) => items.filter((i) => i.product.id !== productId));
  }

  updateQuantity(productId: number, quantity: number): void {
    if (quantity < 1) { this.remove(productId); return; }
    this._items.update((items) =>
      items.map((i) =>
        i.product.id === productId
          ? { ...i, quantity: Math.min(quantity, MAX_QTY) }
          : i
      )
    );
  }

  clear(): void {
    this._items.set([]);
  }

  // ─── Persistence ──────────────────────────────────────────

  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  }
}
