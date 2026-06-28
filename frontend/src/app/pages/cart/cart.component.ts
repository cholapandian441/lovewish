import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/models';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <div class="container">
        <h1 class="page-title">Your Cart
          @if (!cart.isEmpty()) {
            <span class="cart-count-badge">{{ cart.count() }}</span>
          }
        </h1>

        @if (cart.isEmpty()) {
          <!-- Empty State -->
          <div class="empty-cart">
            <div class="empty-cart__icon">🛍️</div>
            <h2>Your cart is empty</h2>
            <p>You haven't added anything yet. Discover something beautiful.</p>
            <a routerLink="/products" class="btn btn-primary" style="margin-top:1.5rem">Browse Products</a>
          </div>

        } @else {
          <div class="cart-layout">

            <!-- Items -->
            <div class="cart-items">
              @for (item of cart.items(); track item.product.id) {
                <div class="cart-row card">
                  <a [routerLink]="['/products', item.product.id]" class="cart-row__img-wrap">
                    <img
                      [src]="item.product.image_url || 'assets/placeholder.png'"
                      [alt]="item.product.name"
                      class="cart-row__img"
                    />
                  </a>

                  <div class="cart-row__info">
                    <span class="cart-row__cat">{{ item.product.category }}</span>
                    <a [routerLink]="['/products', item.product.id]" class="cart-row__name">{{ item.product.name }}</a>
                    <span class="cart-row__unit-price">₹{{ item.product.price }} each</span>
                  </div>

                  <div class="cart-row__qty">
                    <button class="qty-btn" (click)="updateQty(item, item.quantity - 1)">−</button>
                    <span class="qty-val">{{ item.quantity }}</span>
                    <button class="qty-btn" (click)="updateQty(item, item.quantity + 1)">+</button>
                  </div>

                  <div class="cart-row__right">
                    <strong class="cart-row__subtotal">₹{{ item.product.price * item.quantity }}</strong>
                    <button class="remove-btn" (click)="remove(item)" title="Remove">
                      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </div>
              }

              <button class="clear-btn" (click)="cart.clear()">Clear cart</button>
            </div>

            <!-- Summary -->
            <div class="summary-box card">
              <h2 class="summary-title">Order Summary</h2>

              <div class="summary-lines">
                @for (item of cart.items(); track item.product.id) {
                  <div class="summary-line">
                    <span>{{ item.product.name }} × {{ item.quantity }}</span>
                    <span>₹{{ item.product.price * item.quantity }}</span>
                  </div>
                }
              </div>

              <div class="summary-divider"></div>

              <div class="summary-row">
                <span>Subtotal</span>
                <span>₹{{ cart.total() }}</span>
              </div>
              <div class="summary-row">
                <span>Delivery</span>
                <span class="free-tag">Free</span>
              </div>

              <div class="summary-divider"></div>

              <div class="summary-row summary-total">
                <strong>Total</strong>
                <strong>₹{{ cart.total() }}</strong>
              </div>

              <a routerLink="/checkout" class="btn btn-primary checkout-btn">
                Proceed to Checkout →
              </a>

              <a routerLink="/products" class="continue-link">← Continue Shopping</a>
            </div>

          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-title {
      font-family: var(--font-display);
      font-size: clamp(1.8rem, 4vw, 2.5rem);
      font-weight: 500;
      margin-bottom: 2rem;
      display: flex; align-items: center; gap: 0.75rem;
    }
    .cart-count-badge {
      font-family: var(--font-body); font-size: 0.85rem;
      background: var(--color-primary-tint);
      color: var(--color-primary-dk);
      padding: 0.15rem 0.65rem; border-radius: var(--radius-pill);
      border: 1px solid rgba(181,118,106,0.25);
    }

    /* Empty */
    .empty-cart { display: flex; flex-direction: column; align-items: center; text-align: center; padding: clamp(3rem, 8vw, 5rem) 1rem; }
    .empty-cart__icon { font-size: 3.5rem; margin-bottom: 1.25rem; opacity: 0.7; }
    .empty-cart h2 { font-family: var(--font-heading); font-size: 1.5rem; font-weight: 400; margin-bottom: 0.5rem; }
    .empty-cart p { color: var(--color-muted); font-size: 0.93rem; }

    /* Layout */
    .cart-layout { display: grid; grid-template-columns: 1fr 320px; gap: 2rem; align-items: start; }
    @media (max-width: 760px) { .cart-layout { grid-template-columns: 1fr; } }

    /* Items */
    .cart-items { display: flex; flex-direction: column; gap: 0.75rem; }

    .cart-row {
      display: grid;
      grid-template-columns: 88px 1fr auto auto;
      align-items: center;
      gap: 1rem;
      padding: 0.9rem 1.1rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      transition: border-color var(--transition);
    }
    .cart-row:hover { border-color: var(--color-border-dk); }
    @media (max-width: 500px) { .cart-row { grid-template-columns: 72px 1fr; } }

    .cart-row__img-wrap { display: block; border-radius: var(--radius); overflow: hidden; }
    .cart-row__img { width: 88px; height: 88px; object-fit: cover; }

    .cart-row__info { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
    .cart-row__cat { font-size: 0.67rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--color-muted); }
    .cart-row__name { font-family: var(--font-heading); font-size: 0.95rem; font-weight: 400; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cart-row__name:hover { color: var(--color-primary); }
    .cart-row__unit-price { font-size: 0.78rem; color: var(--color-muted); }

    .cart-row__qty { display: flex; align-items: center; gap: 0.5rem; border: 1px solid var(--color-border); border-radius: var(--radius-pill); padding: 0.3rem 0.65rem; }
    .qty-btn { background: none; border: none; cursor: pointer; font-size: 1rem; color: var(--color-text-2); padding: 0 0.1rem; transition: color var(--transition); }
    .qty-btn:hover { color: var(--color-primary); }
    .qty-val { font-size: 0.88rem; font-weight: 500; min-width: 16px; text-align: center; }

    .cart-row__right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; }
    .cart-row__subtotal { font-size: 0.95rem; font-weight: 500; }
    .remove-btn { background: none; border: none; cursor: pointer; color: var(--color-muted); padding: 0.25rem; transition: color var(--transition); }
    .remove-btn:hover { color: var(--color-danger); }

    .clear-btn { align-self: flex-start; background: none; border: none; color: var(--color-muted); font-size: 0.75rem; cursor: pointer; margin-top: 0.5rem; letter-spacing: 0.04em; transition: color var(--transition); }
    .clear-btn:hover { color: var(--color-danger); }

    /* Summary box */
    .summary-box {
      padding: 1.5rem;
      display: flex; flex-direction: column; gap: 0.85rem;
      border-radius: var(--radius-lg); border: 1px solid var(--color-border);
      background: var(--color-surface);
      position: sticky; top: calc(var(--nav-height) + 1rem);
    }
    .summary-title { font-family: var(--font-heading); font-size: 1.1rem; font-weight: 400; }

    .summary-lines { display: flex; flex-direction: column; gap: 0.4rem; }
    .summary-line { display: flex; justify-content: space-between; font-size: 0.82rem; color: var(--color-muted); }

    .summary-divider { height: 1px; background: var(--color-border); }

    .summary-row { display: flex; justify-content: space-between; font-size: 0.88rem; }
    .summary-total { font-size: 1rem; }
    .free-tag { color: var(--color-accent); font-weight: 500; }

    .checkout-btn { width: 100%; justify-content: center; padding: 0.85rem; }
    .continue-link { text-align: center; font-size: 0.75rem; color: var(--color-muted); letter-spacing: 0.04em; }
    .continue-link:hover { color: var(--color-primary); }
  `],
})
export class CartComponent {
  readonly cart = inject(CartService);

  updateQty(item: CartItem, qty: number): void {
    this.cart.updateQuantity(item.product.id, qty);
  }

  remove(item: CartItem): void {
    this.cart.remove(item.product.id);
  }
}
