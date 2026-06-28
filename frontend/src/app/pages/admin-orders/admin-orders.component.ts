import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Order, OrderStatus } from '../../models/models';

const STATUSES: OrderStatus[] = ['Placed', 'Confirmed', 'Packaging', 'Shipped', 'Delivered'];

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="admin-orders">
      <div class="page-header">
        <h1 class="page-title">Orders</h1>
        <span class="order-count">{{ filtered().length }} orders</span>
      </div>

      <!-- Filters -->
      <div class="filters">
        <button class="filter-pill" [class.active]="activeStatus() === ''" (click)="setFilter('')">All</button>
        @for (s of statuses; track s) {
          <button class="filter-pill" [class.active]="activeStatus() === s" (click)="setFilter(s)">{{ s }}</button>
        }
      </div>

      @if (loading()) {
        <p class="loading-text">Loading orders…</p>
      } @else if (filtered().length === 0) {
        <div class="empty-state">
          <p>No orders found.</p>
        </div>
      } @else {

        <div class="orders-list">
          @for (order of filtered(); track order.id) {
            <div class="order-card card">

              <!-- Order Header Row -->
              <div class="order-header" (click)="toggleExpand(order.id)">
                <div class="order-meta">
                  <strong class="order-id">{{ order.order_number }}</strong>
                  <span class="order-date muted">{{ order.created_at | date:'dd MMM yyyy, hh:mm a' }}</span>
                </div>

                <div class="order-customer">
                  <strong>{{ order.customer_name }}</strong>
                  <span class="muted">{{ order.phone }}</span>
                </div>

                <div class="order-location muted">
                  {{ order.city }}, {{ order.state }}
                </div>

                <div class="order-amount">
                  <strong>₹{{ order.total_amount }}</strong>
                </div>

                <!-- Status Selector -->
                <div class="order-status" (click)="$event.stopPropagation()">
                  <select
                    [ngModel]="order.status"
                    (ngModelChange)="updateStatus(order, $event)"
                    [class]="'status-select status-' + order.status.toLowerCase()"
                    [disabled]="updatingId() === order.id"
                  >
                    @for (s of statuses; track s) {
                      <option [value]="s">{{ s }}</option>
                    }
                  </select>
                  @if (updatingId() === order.id) {
                    <span class="update-spinner"></span>
                  }
                </div>

                <button class="expand-btn" [class.open]="expandedId() === order.id">
                  ▾
                </button>
              </div>

              <!-- Expanded Detail -->
              @if (expandedId() === order.id) {
                <div class="order-detail">
                  <div class="detail-sections">

                    <!-- Delivery address -->
                    <div class="detail-section">
                      <h4>Delivery Address</h4>
                      <p>{{ order.address }}</p>
                      <p>{{ order.city }}, {{ order.state }} – {{ order.pincode }}</p>
                      <p class="muted">{{ order.email }}</p>
                    </div>

                    <!-- Items -->
                    <div class="detail-section">
                      <h4>Items</h4>
                      @if (order.items && order.items.length > 0) {
                        @for (item of order.items; track item.id) {
                          <div class="item-row">
                            <span class="item-name">{{ item.product_name }}</span>
                            <span class="item-qty muted">× {{ item.quantity }}</span>
                            <span class="item-price">₹{{ item.price * item.quantity }}</span>
                          </div>
                        }
                        <div class="item-row total-row">
                          <strong>Total</strong>
                          <span></span>
                          <strong>₹{{ order.total_amount }}</strong>
                        </div>
                      } @else {
                        <button class="load-items-btn" (click)="loadOrderItems(order)">Load items</button>
                      }
                    </div>

                  </div>
                </div>
              }

            </div>
          }
        </div>

      }
    </div>
  `,
  styles: [`
    .admin-orders { display: flex; flex-direction: column; gap: 1.25rem; }

    .page-header { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .page-title  { font-family: var(--font-heading); font-size: 1.8rem; }
    .order-count { color: var(--color-muted); font-size: 0.875rem; }
    .loading-text { color: var(--color-muted); }

    /* Filters */
    .filters { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .filter-pill {
      padding: 0.35rem 0.9rem; border-radius: 20px;
      border: 1.5px solid var(--color-border);
      background: #fff; cursor: pointer;
      font-size: 0.82rem; font-family: var(--font-body);
      transition: all 0.18s; color: var(--color-text);
    }
    .filter-pill.active, .filter-pill:hover {
      background: var(--color-primary); color: #fff; border-color: var(--color-primary);
    }

    /* Order cards */
    .orders-list { display: flex; flex-direction: column; gap: 0.75rem; }

    .order-card { overflow: hidden; }

    .order-header {
      display: grid;
      grid-template-columns: 120px 1fr 140px 100px 180px 36px;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      cursor: pointer;
      transition: background 0.15s;
    }
    .order-header:hover { background: #fdf8f3; }
    @media (max-width: 900px) {
      .order-header {
        grid-template-columns: 1fr 1fr;
        grid-template-rows: auto auto auto;
      }
      .order-location, .expand-btn { display: none; }
    }

    .order-meta  { display: flex; flex-direction: column; gap: 0.2rem; }
    .order-id    { font-size: 0.95rem; }
    .order-date  { font-size: 0.75rem; }
    .order-customer { display: flex; flex-direction: column; gap: 0.1rem; font-size: 0.875rem; }
    .order-location { font-size: 0.82rem; }
    .order-amount { font-size: 0.95rem; }

    .order-status { display: flex; align-items: center; gap: 0.5rem; position: relative; }

    .status-select {
      appearance: none;
      padding: 0.4rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-family: var(--font-body);
      cursor: pointer;
      border: 1.5px solid transparent;
      font-weight: 500;
      width: 140px;
    }
    .status-select.status-placed    { background: #f5f5f5; color: #555; }
    .status-select.status-confirmed { background: #e3f2fd; color: #1565c0; }
    .status-select.status-packaging { background: #fef3e2; color: #a6793c; }
    .status-select.status-shipped   { background: #e8eaf6; color: #283593; }
    .status-select.status-delivered { background: #e8f5e9; color: #2e7d32; }
    .status-select:focus { outline: none; border-color: var(--color-primary); }

    .update-spinner {
      width: 14px; height: 14px;
      border: 2px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .expand-btn {
      background: none; border: none; cursor: pointer;
      color: var(--color-muted); font-size: 1rem;
      transition: transform 0.2s;
      justify-self: center;
    }
    .expand-btn.open { transform: rotate(180deg); }

    .muted { color: var(--color-muted); }

    /* Expanded Detail */
    .order-detail {
      border-top: 1px solid var(--color-border);
      padding: 1.25rem;
      background: #fafafa;
      animation: slidedown 0.18s ease;
    }
    @keyframes slidedown { from { opacity: 0; transform: translateY(-6px); } }

    .detail-sections { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    @media (max-width: 600px) { .detail-sections { grid-template-columns: 1fr; } }

    .detail-section h4 {
      font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em;
      color: var(--color-muted); margin-bottom: 0.6rem;
    }
    .detail-section p { font-size: 0.875rem; margin-bottom: 0.2rem; }

    .item-row {
      display: grid; grid-template-columns: 1fr auto auto;
      gap: 0.75rem; align-items: center;
      padding: 0.45rem 0;
      border-bottom: 1px solid #ececec;
      font-size: 0.875rem;
    }
    .item-row:last-child { border-bottom: none; }
    .total-row { border-top: 1px solid var(--color-border); margin-top: 0.25rem; padding-top: 0.6rem; }
    .item-name  { }
    .item-qty   { text-align: center; }
    .item-price { text-align: right; font-weight: 500; }

    .load-items-btn {
      background: none; border: 1px solid var(--color-border);
      border-radius: var(--radius); padding: 0.35rem 0.75rem;
      cursor: pointer; font-size: 0.82rem; font-family: var(--font-body);
    }
    .load-items-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
  `],
})
export class AdminOrdersComponent implements OnInit {
  private api = inject(ApiService);

  statuses     = STATUSES;
  loading      = signal(false);
  activeStatus = signal<OrderStatus | ''>('');
  expandedId   = signal<number | null>(null);
  updatingId   = signal<number | null>(null);
  private orders = signal<Order[]>([]);

  filtered = () => {
    const s = this.activeStatus();
    return s ? this.orders().filter((o) => o.status === s) : this.orders();
  };

  ngOnInit(): void { this.loadOrders(); }

  loadOrders(): void {
    this.loading.set(true);
    this.api.getOrders().subscribe({
      next: (res) => { this.orders.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  setFilter(status: OrderStatus | ''): void {
    this.activeStatus.set(status);
    this.expandedId.set(null);
  }

  toggleExpand(id: number): void {
    this.expandedId.update((cur) => (cur === id ? null : id));
  }

  updateStatus(order: Order, status: OrderStatus): void {
    if (order.status === status) return;
    this.updatingId.set(order.id);
    this.api.updateOrderStatus(order.id, status).subscribe({
      next: (res) => {
        this.orders.update((list) =>
          list.map((o) => (o.id === order.id ? { ...o, status: res.data.status } : o))
        );
        this.updatingId.set(null);
      },
      error: () => this.updatingId.set(null),
    });
  }

  // Load items lazily when row is expanded and items not yet fetched
  loadOrderItems(order: Order): void {
    this.api.trackOrder(order.order_number).subscribe({
      next: (res) => {
        this.orders.update((list) =>
          list.map((o) => (o.id === order.id ? { ...o, items: res.data.items } : o))
        );
      },
    });
  }
}
