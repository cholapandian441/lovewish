import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Order, OrderStatus } from '../../models/models';

const STEPS: { status: OrderStatus; icon: string; label: string }[] = [
  { status: 'Placed',    icon: '📋', label: 'Order Placed'    },
  { status: 'Confirmed', icon: '✅', label: 'Confirmed'        },
  { status: 'Packaging', icon: '📦', label: 'Packaging'        },
  { status: 'Shipped',   icon: '🚚', label: 'Shipped'          },
  { status: 'Delivered', icon: '🎉', label: 'Delivered'        },
];

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="page">
      <div class="container narrow">

        <div class="track-header">
          <h1 class="page-title">Track Your Order</h1>
          <p class="page-sub">Enter your Order ID to see the current status of your delivery.</p>
        </div>

        <!-- Search Box -->
        <div class="search-card card">
          <div class="form-group" style="margin-bottom:0">
            <label>Order ID</label>
            <input
              [(ngModel)]="orderNumber"
              type="text"
              placeholder="e.g. LW-7F3KQ9XP2M"
              (keydown.enter)="search()"
              autocapitalize="characters"
              spellcheck="false"
            />
          </div>
          <button class="btn btn-primary track-btn" (click)="search()" [disabled]="loading()">
            {{ loading() ? 'Searching…' : 'Track Order' }}
          </button>
          @if (errorMsg()) {
            <p class="error-msg" style="margin-top:0">{{ errorMsg() }}</p>
          }
        </div>

        <!-- Result -->
        @if (order(); as o) {
          <div class="order-result card">

            <!-- Order Meta -->
            <div class="result-header">
              <div>
                <h2 class="result-order-id">Order {{ o.order_number }}</h2>
                <p class="result-date">Placed on {{ o.created_at | date:'dd MMM yyyy, h:mm a' }}</p>
              </div>
              <span [class]="statusClass(o.status)">{{ o.status }}</span>
            </div>

            <!-- Progress Stepper -->
            <div class="stepper">
              @for (step of steps; track step.status; let i = $index) {
                <div class="step" [class.done]="isDone(o.status, step.status)" [class.current]="o.status === step.status">
                  <div class="step__circle">
                    @if (isDone(o.status, step.status)) {
                      <span class="step__tick">✓</span>
                    } @else {
                      <span class="step__icon">{{ step.icon }}</span>
                    }
                  </div>
                  <span class="step__label">{{ step.label }}</span>
                </div>
                @if (i < steps.length - 1) {
                  <div class="step__connector" [class.done]="isDone(o.status, steps[i + 1].status)"></div>
                }
              }
            </div>

            <!-- Delivery Info -->
            <div class="result-section">
              <h3 class="result-section-title">Deliver To</h3>
              <p class="result-name">{{ o.customer_name }}</p>
              <p class="result-addr">{{ o.address }}, {{ o.city }}, {{ o.state }} – {{ o.pincode }}</p>
              <p class="result-contact">{{ o.phone }} &nbsp;·&nbsp; {{ o.email }}</p>
            </div>

            <!-- Items -->
            @if (o.items && o.items.length > 0) {
              <div class="result-section">
                <h3 class="result-section-title">Items ({{ o.items.length }})</h3>
                @for (item of o.items; track item.id) {
                  <div class="order-item-row">
                    <span class="order-item-name">{{ item.product_name }}</span>
                    <span class="order-item-qty">× {{ item.quantity }}</span>
                    <span class="order-item-price">₹{{ item.price * item.quantity }}</span>
                  </div>
                }
                <div class="order-total-row">
                  <strong>Total</strong>
                  <strong>₹{{ o.total_amount }}</strong>
                </div>
              </div>
            }

          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .narrow { max-width: 680px; }

    .track-header { text-align: center; margin-bottom: 2.5rem; }
    .page-title { font-family: var(--font-display); font-size: clamp(2rem, 5vw, 2.8rem); font-weight: 500; margin-bottom: 0.5rem; }
    .page-sub { color: var(--color-text-2); font-size: 0.93rem; font-weight: 300; }

    .search-card { padding: 1.75rem; display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; border-radius: var(--radius-lg); border: 1px solid var(--color-border); background: var(--color-surface); box-shadow: none; }
    .track-btn { align-self: flex-start; }

    /* Result card */
    .order-result { display: flex; flex-direction: column; gap: 1.75rem; padding: 1.75rem; border-radius: var(--radius-lg); border: 1px solid var(--color-border); background: var(--color-surface); box-shadow: none; }

    .result-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem; }
    .result-order-id { font-family: var(--font-heading); font-size: 1.4rem; font-weight: 400; }
    .result-date { color: var(--color-muted); font-size: 0.78rem; margin-top: 0.2rem; }

    /* Stepper */
    .stepper { display: flex; align-items: flex-start; overflow-x: auto; padding-bottom: 0.5rem; gap: 0; }
    .step { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; min-width: 78px; text-align: center; }
    .step__circle {
      width: 38px; height: 38px; border-radius: 50%;
      border: 1.5px solid var(--color-border);
      background: var(--color-surface);
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; transition: all 0.3s; flex-shrink: 0;
    }
    .step.done .step__circle { background: var(--color-primary); border-color: var(--color-primary); }
    .step.current .step__circle { border-color: var(--color-primary); box-shadow: 0 0 0 4px var(--color-primary-tint); }
    .step__tick { color: #fff; font-size: 0.9rem; font-weight: 600; }
    .step__label { font-size: 0.65rem; color: var(--color-muted); line-height: 1.3; letter-spacing: 0.04em; }
    .step.done .step__label, .step.current .step__label { color: var(--color-text); font-weight: 500; }

    .step__connector { flex: 1; height: 1.5px; background: var(--color-border); margin-top: 18px; min-width: 16px; transition: background 0.3s; }
    .step__connector.done { background: var(--color-primary); }

    /* Sections */
    .result-section { border-top: 1px solid var(--color-border); padding-top: 1.25rem; }
    .result-section-title { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-muted); margin-bottom: 0.75rem; }
    .result-name { font-weight: 500; margin-bottom: 0.25rem; }
    .result-addr, .result-contact { color: var(--color-text-2); font-size: 0.875rem; margin-bottom: 0.2rem; font-weight: 300; }

    /* Items */
    .order-item-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.55rem 0; border-bottom: 1px solid var(--color-border); font-size: 0.875rem; }
    .order-item-row:last-of-type { border-bottom: none; }
    .order-item-name { flex: 1; }
    .order-item-qty { color: var(--color-muted); }
    .order-item-price { font-weight: 500; }
    .order-total-row { display: flex; justify-content: space-between; padding-top: 0.75rem; font-size: 0.95rem; }

    /* Status badges */
    :host ::ng-deep .status-placed    { background:#f0ece8; color:#6b5e54; }
    :host ::ng-deep .status-confirmed { background:#eaf1fb; color:#3060a8; }
    :host ::ng-deep .status-packaging { background:#f9eee8; color:var(--color-primary-dk); }
    :host ::ng-deep .status-shipped   { background:#ebe8f0; color:#5040a0; }
    :host ::ng-deep .status-delivered { background:var(--color-accent-tint); color:var(--color-accent); }
  `],
})
export class OrderTrackingComponent {
  private api = inject(ApiService);

  steps       = STEPS;
  orderNumber = '';
  loading     = signal(false);
  errorMsg    = signal('');
  order       = signal<Order | null>(null);

  search(): void {
    const ref = this.orderNumber.trim().toUpperCase();
    if (!ref) { this.errorMsg.set('Please enter a valid Order ID.'); return; }

    this.loading.set(true);
    this.errorMsg.set('');
    this.order.set(null);

    this.api.trackOrder(ref).subscribe({
      next: (res) => { this.order.set(res.data); this.loading.set(false); },
      error: () => { this.errorMsg.set('No order found with that ID.'); this.loading.set(false); },
    });
  }

  isDone(current: OrderStatus, step: OrderStatus): boolean {
    const idx = (s: OrderStatus) => STEPS.findIndex((x) => x.status === s);
    return idx(current) >= idx(step);
  }

  statusClass(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      Placed:    'badge status-placed',
      Confirmed: 'badge status-confirmed',
      Packaging: 'badge status-packaging',
      Shipped:   'badge status-shipped',
      Delivered: 'badge status-delivered',
    };
    return map[status] ?? 'badge';
  }
}
