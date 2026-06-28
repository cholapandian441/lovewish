import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Order, OrderStatus, Product } from '../../models/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="dash">
      <h1 class="page-title">Dashboard</h1>

      @if (loading()) {
        <p class="loading-text">Loading…</p>
      } @else {

        <!-- Stat cards -->
        <div class="stats-grid">
          <div class="stat-card card">
            <span class="stat-card__icon">📦</span>
            <div>
              <p class="stat-card__label">Total Orders</p>
              <p class="stat-card__value">{{ totalOrders() }}</p>
            </div>
          </div>
          <div class="stat-card card">
            <span class="stat-card__icon">⏳</span>
            <div>
              <p class="stat-card__label">Pending Orders</p>
              <p class="stat-card__value">{{ pendingOrders() }}</p>
            </div>
          </div>
          <div class="stat-card card">
            <span class="stat-card__icon">🎁</span>
            <div>
              <p class="stat-card__label">Products</p>
              <p class="stat-card__value">{{ totalProducts() }}</p>
            </div>
          </div>
          <div class="stat-card card stat-card--accent">
            <span class="stat-card__icon">💰</span>
            <div>
              <p class="stat-card__label">Total Revenue</p>
              <p class="stat-card__value">₹{{ totalRevenue() }}</p>
            </div>
          </div>
        </div>

        <!-- Order status breakdown -->
        <div class="section-row">
          <div class="breakdown card">
            <h2 class="section-title">Orders by Status</h2>
            @for (entry of statusBreakdown(); track entry.status) {
              <div class="breakdown-row">
                <span [class]="'badge ' + statusBadge(entry.status)">{{ entry.status }}</span>
                <div class="breakdown-bar-wrap">
                  <div
                    class="breakdown-bar"
                    [style.width.%]="totalOrders() > 0 ? (entry.count / totalOrders()) * 100 : 0"
                  ></div>
                </div>
                <span class="breakdown-count">{{ entry.count }}</span>
              </div>
            }
          </div>

          <!-- Quick links -->
          <div class="quick-links card">
            <h2 class="section-title">Quick Actions</h2>
            <a routerLink="/admin/products" class="quick-link">
              <span>🎁</span>
              <div>
                <strong>Manage Products</strong>
                <p>Add, edit or remove products</p>
              </div>
              <span class="quick-link__arrow">→</span>
            </a>
            <a routerLink="/admin/orders" class="quick-link">
              <span>📋</span>
              <div>
                <strong>View Orders</strong>
                <p>Update delivery status</p>
              </div>
              <span class="quick-link__arrow">→</span>
            </a>
          </div>
        </div>

        <!-- Recent orders -->
        <div class="card recent-orders">
          <div class="recent-orders__header">
            <h2 class="section-title">Recent Orders</h2>
            <a routerLink="/admin/orders" class="see-all">View all →</a>
          </div>
          <table class="orders-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              @for (order of recentOrders(); track order.id) {
                <tr>
                  <td><strong>#{{ order.id }}</strong></td>
                  <td>{{ order.customer_name }}</td>
                  <td>₹{{ order.total_amount }}</td>
                  <td><span [class]="'badge ' + statusBadge(order.status)">{{ order.status }}</span></td>
                  <td class="muted">{{ order.created_at | date:'dd MMM yy' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty-row">No orders yet.</td></tr>
              }
            </tbody>
          </table>
        </div>

      }
    </div>
  `,
  styles: [`
    .page-title { font-family: var(--font-heading); font-size: 1.8rem; margin-bottom: 1.75rem; }
    .loading-text { color: var(--color-muted); }

    /* Stats */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    @media (max-width: 900px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr; } }

    .stat-card {
      display: flex; align-items: center; gap: 1rem;
      padding: 1.25rem 1.5rem;
    }
    .stat-card--accent { border-left: 4px solid var(--color-primary); }
    .stat-card__icon { font-size: 1.8rem; }
    .stat-card__label { font-size: 0.78rem; color: var(--color-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-card__value { font-size: 1.6rem; font-weight: 700; color: var(--color-text); line-height: 1.1; margin-top: 0.2rem; }

    /* Row section */
    .section-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    @media (max-width: 700px) { .section-row { grid-template-columns: 1fr; } }

    .section-title { font-family: var(--font-heading); font-size: 1rem; margin-bottom: 1rem; }

    /* Breakdown */
    .breakdown { padding: 1.25rem 1.5rem; }
    .breakdown-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .breakdown-bar-wrap { flex: 1; height: 6px; background: #eee; border-radius: 3px; overflow: hidden; }
    .breakdown-bar { height: 100%; background: var(--color-primary); border-radius: 3px; transition: width 0.5s ease; }
    .breakdown-count { font-size: 0.85rem; font-weight: 600; min-width: 20px; text-align: right; }

    /* Quick links */
    .quick-links { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .quick-link {
      display: flex; align-items: center; gap: 1rem;
      padding: 0.75rem; border-radius: var(--radius);
      transition: background 0.15s; font-size: 0.875rem;
    }
    .quick-link:hover { background: #f8f4ee; }
    .quick-link > span:first-child { font-size: 1.4rem; }
    .quick-link strong { display: block; }
    .quick-link p { color: var(--color-muted); font-size: 0.8rem; margin-top: 0.1rem; }
    .quick-link__arrow { margin-left: auto; color: var(--color-muted); }

    /* Recent orders table */
    .recent-orders { overflow: hidden; margin-bottom: 1.5rem; }
    .recent-orders__header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--color-border);
    }
    .recent-orders__header .section-title { margin-bottom: 0; }
    .see-all { font-size: 0.82rem; color: var(--color-primary); }

    .orders-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .orders-table th {
      text-align: left; padding: 0.7rem 1.5rem;
      font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--color-muted); background: #fafafa;
      border-bottom: 1px solid var(--color-border);
    }
    .orders-table td { padding: 0.85rem 1.5rem; border-bottom: 1px solid #f0f0f0; }
    .orders-table tr:last-child td { border-bottom: none; }
    .muted { color: var(--color-muted); }
    .empty-row { text-align: center; color: var(--color-muted); padding: 2rem !important; }
  `],
})
export class AdminDashboardComponent implements OnInit {
  private api = inject(ApiService);

  loading  = signal(true);
  private orders   = signal<Order[]>([]);
  private products = signal<Product[]>([]);

  totalOrders   = computed(() => this.orders().length);
  pendingOrders = computed(() => this.orders().filter((o) => o.status === 'Placed').length);
  totalProducts = computed(() => this.products().length);
  totalRevenue  = computed(() =>
    this.orders().reduce((sum, o) => sum + o.total_amount, 0).toFixed(2)
  );
  recentOrders  = computed(() => [...this.orders()].slice(0, 5));

  statusBreakdown = computed(() => {
    const statuses: OrderStatus[] = ['Placed', 'Confirmed', 'Packaging', 'Shipped', 'Delivered'];
    return statuses.map((status) => ({
      status,
      count: this.orders().filter((o) => o.status === status).length,
    }));
  });

  ngOnInit(): void {
    // Load orders and products in parallel
    let ordersLoaded = false;
    let productsLoaded = false;
    const done = () => { if (ordersLoaded && productsLoaded) this.loading.set(false); };

    this.api.getOrders().subscribe({
      next: (res) => { this.orders.set(res.data); ordersLoaded = true; done(); },
      error: () => { ordersLoaded = true; done(); },
    });

    this.api.getProducts().subscribe({
      next: (res) => { this.products.set(res.data); productsLoaded = true; done(); },
      error: () => { productsLoaded = true; done(); },
    });
  }

  statusBadge(status: OrderStatus): string {
    const map: Record<OrderStatus, string> = {
      Placed:    'badge-gray',
      Confirmed: 'badge-blue',
      Packaging: 'badge-gold',
      Shipped:   'badge-blue',
      Delivered: 'badge-green',
    };
    return map[status] ?? '';
  }
}
