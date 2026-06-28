import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="container">

        @if (orderNumber()) {
          <!-- ── Success Screen ──────────────────────────── -->
          <div class="success-wrap">
            <div class="success-card card">
              <div class="success-icon">🎀</div>
              <h1 class="success-title">Order Placed!</h1>
              <p class="success-sub">Thank you! Your order has been received and is being prepared with love.</p>

              <div class="order-id-box">
                <span class="order-id-label">Your Order ID</span>
                <strong class="order-id-value">{{ orderNumber() }}</strong>
              </div>

              <p class="success-note">Save this ID to track your order at any time.</p>

              <div class="success-actions">
                <a routerLink="/track-order" class="btn btn-primary">Track Order</a>
                <a routerLink="/products" class="btn btn-outline">Continue Shopping</a>
              </div>
            </div>
          </div>

        } @else {
          <!-- ── Checkout Form ───────────────────────────── -->
          <a routerLink="/cart" class="back-link">← Back to Cart</a>
          <h1 class="page-title">Checkout</h1>

          @if (cart.isEmpty()) {
            <div class="empty-state">
              <h3>Your cart is empty</h3>
              <a routerLink="/products" class="btn btn-outline" style="margin-top:1rem">Browse Products</a>
            </div>
          } @else {
            <div class="checkout-layout">

              <!-- Order Summary -->
              <aside class="order-summary card">
                <h2 class="summary-title">Order Summary</h2>

                <div class="summary-items">
                  @for (item of cart.items(); track item.product.id) {
                    <div class="summary-item">
                      <img
                        [src]="item.product.image_url || 'assets/placeholder.png'"
                        [alt]="item.product.name"
                        class="summary-item__img"
                      />
                      <div class="summary-item__info">
                        <span class="summary-item__name">{{ item.product.name }}</span>
                        <span class="summary-item__qty">× {{ item.quantity }}</span>
                      </div>
                      <span class="summary-item__price">₹{{ item.product.price * item.quantity }}</span>
                    </div>
                  }
                </div>

                <div class="summary-divider"></div>

                <div class="summary-row">
                  <span>Subtotal</span><span>₹{{ cart.total() }}</span>
                </div>
                <div class="summary-row">
                  <span>Delivery</span><span class="free-tag">Free</span>
                </div>

                <div class="summary-divider"></div>

                <div class="summary-row summary-total">
                  <strong>Total</strong>
                  <strong>₹{{ cart.total() }}</strong>
                </div>
              </aside>

              <!-- Form -->
              <form [formGroup]="form" (ngSubmit)="submit()" class="checkout-form card">
                <h2 class="form-section-title">Contact Details</h2>
                <div class="form-grid-2">
                  <div class="form-group">
                    <label>Full Name *</label>
                    <input formControlName="customer_name" placeholder="Priya Sharma" />
                    @if (isInvalid('customer_name')) { <span class="error-msg">Required.</span> }
                  </div>
                  <div class="form-group">
                    <label>Phone *</label>
                    <input formControlName="phone" placeholder="10-digit number" />
                    @if (isInvalid('phone')) { <span class="error-msg">Enter a valid 10-digit number.</span> }
                  </div>
                </div>
                <div class="form-group">
                  <label>Email *</label>
                  <input formControlName="email" type="email" placeholder="you@example.com" />
                  @if (isInvalid('email')) { <span class="error-msg">Enter a valid email.</span> }
                </div>

                <div class="form-section-divider"></div>
                <h2 class="form-section-title">Delivery Address</h2>

                <div class="form-group">
                  <label>Address *</label>
                  <textarea formControlName="address" rows="2" placeholder="House / Flat / Street / Area"></textarea>
                  @if (isInvalid('address')) { <span class="error-msg">Required.</span> }
                </div>
                <div class="form-grid-3">
                  <div class="form-group">
                    <label>City *</label>
                    <input formControlName="city" placeholder="Mumbai" />
                    @if (isInvalid('city')) { <span class="error-msg">Required.</span> }
                  </div>
                  <div class="form-group">
                    <label>State *</label>
                    <input formControlName="state" placeholder="Maharashtra" />
                    @if (isInvalid('state')) { <span class="error-msg">Required.</span> }
                  </div>
                  <div class="form-group">
                    <label>Pincode *</label>
                    <input formControlName="pincode" placeholder="400001" />
                    @if (isInvalid('pincode')) { <span class="error-msg">Required.</span> }
                  </div>
                </div>

                @if (errorMsg()) {
                  <div class="api-error">{{ errorMsg() }}</div>
                }

                <button type="submit" class="btn btn-primary submit-btn" [disabled]="submitting()">
                  @if (submitting()) { Placing Order… } @else { Place Order →  }
                </button>
              </form>

            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .back-link { display: inline-flex; align-items: center; gap: 0.4rem; color: var(--color-muted); font-size: 0.78rem; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 1rem; transition: color var(--transition); }
    .back-link:hover { color: var(--color-primary); }
    .page-title { font-family: var(--font-display); font-size: clamp(1.8rem, 4vw, 2.5rem); font-weight: 500; margin-bottom: 2rem; }

    /* Layout */
    .checkout-layout { display: grid; grid-template-columns: 320px 1fr; gap: 2rem; align-items: start; }
    @media (max-width: 760px) { .checkout-layout { grid-template-columns: 1fr; } }

    /* Summary */
    .order-summary {
      padding: 1.5rem; display: flex; flex-direction: column; gap: 0.85rem;
      border-radius: var(--radius-lg); border: 1px solid var(--color-border);
      background: var(--color-bg-alt);
      position: sticky; top: calc(var(--nav-height) + 1rem);
    }
    .summary-title { font-family: var(--font-heading); font-size: 1rem; font-weight: 400; letter-spacing: 0.03em; }
    .summary-items { display: flex; flex-direction: column; gap: 0.75rem; }
    .summary-item { display: flex; align-items: center; gap: 0.75rem; }
    .summary-item__img { width: 46px; height: 46px; object-fit: cover; border-radius: var(--radius); flex-shrink: 0; border: 1px solid var(--color-border); }
    .summary-item__info { flex: 1; min-width: 0; }
    .summary-item__name { font-size: 0.83rem; font-weight: 400; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .summary-item__qty { font-size: 0.75rem; color: var(--color-muted); }
    .summary-item__price { font-size: 0.85rem; font-weight: 500; flex-shrink: 0; }
    .summary-divider { height: 1px; background: var(--color-border); }
    .summary-row { display: flex; justify-content: space-between; font-size: 0.85rem; }
    .summary-total { font-size: 0.95rem; }
    .free-tag { color: var(--color-accent); font-weight: 500; }

    /* Form */
    .checkout-form { padding: 2rem; display: flex; flex-direction: column; border-radius: var(--radius-lg); border: 1px solid var(--color-border); background: var(--color-surface); }
    .form-section-title { font-family: var(--font-heading); font-size: 1rem; font-weight: 400; margin-bottom: 1rem; letter-spacing: 0.02em; }
    .form-section-divider { height: 1px; background: var(--color-border); margin: 1.25rem 0; }
    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
    .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0 1rem; }
    @media (max-width: 500px) { .form-grid-2, .form-grid-3 { grid-template-columns: 1fr; } }

    .api-error { background: #fdf0ef; border: 1px solid rgba(181,55,42,0.2); color: var(--color-danger); border-radius: var(--radius); padding: 0.75rem 1rem; font-size: 0.82rem; margin-bottom: 0.5rem; }
    .submit-btn { width: 100%; justify-content: center; padding: 0.9rem; margin-top: 0.5rem; }

    /* Success */
    .success-wrap { display: flex; justify-content: center; padding: clamp(2rem, 6vw, 4rem) 0; }
    .success-card { max-width: 440px; width: 100%; padding: clamp(2rem, 5vw, 3rem); text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; border-radius: var(--radius-lg); border: 1px solid var(--color-border); }
    .success-icon { font-size: 3rem; }
    .success-title { font-family: var(--font-display); font-size: 2.2rem; font-weight: 500; }
    .success-sub { color: var(--color-text-2); font-size: 0.93rem; max-width: 320px; font-weight: 300; line-height: 1.7; }
    .order-id-box {
      display: flex; flex-direction: column; align-items: center; gap: 0.3rem;
      background: var(--color-primary-tint); border: 1px dashed var(--color-primary-lt);
      border-radius: var(--radius-lg); padding: 1.1rem 2.5rem; margin: 0.5rem 0;
    }
    .order-id-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.16em; color: var(--color-muted); }
    .order-id-value { font-family: var(--font-display); font-size: 1.9rem; font-weight: 500; color: var(--color-primary-dk); line-height: 1.1; letter-spacing: 0.04em; word-break: break-all; }
    .success-note { font-size: 0.78rem; color: var(--color-muted); }
    .success-actions { display: flex; gap: 0.85rem; flex-wrap: wrap; justify-content: center; margin-top: 0.5rem; }
  `],
})
export class CheckoutComponent {
  private fb   = inject(FormBuilder);
  private api  = inject(ApiService);
  readonly cart = inject(CartService);

  form = this.fb.group({
    customer_name: ['', Validators.required],
    phone:         ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    email:         ['', [Validators.required, Validators.email]],
    address:       ['', Validators.required],
    city:          ['', Validators.required],
    state:         ['', Validators.required],
    pincode:       ['', Validators.required],
  });

  submitting  = signal(false);
  errorMsg    = signal('');
  orderNumber = signal<string | null>(null);

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.cart.isEmpty()) return;

    this.submitting.set(true);
    this.errorMsg.set('');

    const payload = {
      ...(this.form.getRawValue() as any),
      items: this.cart.items().map((i) => ({
        product_id: i.product.id,
        quantity:   i.quantity,
      })),
    };

    this.api.createOrder(payload).subscribe({
      next: (res) => {
        this.cart.clear();
        this.orderNumber.set(res.data.order_number);
        this.submitting.set(false);
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.message || 'Failed to place order. Please try again.');
        this.submitting.set(false);
      },
    });
  }
}
