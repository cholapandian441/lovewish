import { Component, OnInit, Input, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/models';
import { SpinnerComponent } from '../../components/spinner/spinner.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, SpinnerComponent],
  template: `
    <div class="page">
      <div class="container">

        <!-- Breadcrumb -->
        <nav class="breadcrumb">
          <a routerLink="/">Home</a>
          <span>/</span>
          <a routerLink="/products">Shop</a>
          @if (product()) {
            <span>/</span>
            <span>{{ product()!.name }}</span>
          }
        </nav>

        @if (loading()) {
          <app-spinner />
        } @else if (error()) {
          <div class="empty-state">
            <p style="font-size:3rem">😔</p>
            <h3>Product not found</h3>
            <a routerLink="/products" class="btn btn-outline" style="margin-top:1rem">Back to Shop</a>
          </div>
        } @else if (product(); as p) {
          <div class="detail-layout">

            <!-- Image -->
            <div class="detail-img-wrap card">
              <img
                [src]="p.image_url || 'assets/placeholder.png'"
                [alt]="p.name"
                class="detail-img"
              />
              @if (p.is_best_seller) {
                <span class="badge badge-gold overlay-badge">⭐ Best Seller</span>
              }
            </div>

            <!-- Info -->
            <div class="detail-info">
              <span class="category-tag">{{ p.category }}</span>
              <h1 class="product-name">{{ p.name }}</h1>
              <p class="product-price">₹{{ p.price }}</p>

              @if (p.description) {
                <p class="product-desc">{{ p.description }}</p>
              }

              <div class="divider"></div>

              <!-- Quantity Selector -->
              <div class="qty-section">
                <span class="qty-label">Quantity</span>
                <div class="qty-control">
                  <button class="qty-btn" (click)="decrement()" [disabled]="quantity() <= 1">−</button>
                  <span class="qty-val">{{ quantity() }}</span>
                  <button class="qty-btn" (click)="increment()">+</button>
                </div>
              </div>

              <!-- Actions -->
              <div class="detail-actions">
                <button class="btn btn-primary add-btn" (click)="addToCart(p)">
                  <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                  Add to Cart
                </button>
                <a routerLink="/cart" class="btn btn-outline">View Cart</a>
              </div>

              @if (added()) {
                <div class="added-msg">
                  <span>✓</span> Added to your cart!
                  <a routerLink="/cart">Go to cart →</a>
                </div>
              }

              <!-- Trust badges -->
              <div class="trust-badges">
                <span>🎀 Handmade with care</span>
                <span>📦 Carefully packaged</span>
                <span>🚚 Free delivery</span>
              </div>
            </div>

          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
      color: var(--color-muted);
      margin-bottom: 2.5rem;
    }
    .breadcrumb a:hover { color: var(--color-primary); }
    .breadcrumb span:last-child { color: var(--color-text-2); }

    .detail-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: clamp(2rem, 5vw, 4rem);
      align-items: start;
    }
    @media (max-width: 720px) {
      .detail-layout { grid-template-columns: 1fr; gap: 2rem; }
    }

    .detail-img-wrap {
      position: relative;
      border-radius: var(--radius-lg);
      overflow: hidden;
      border: 1px solid var(--color-border);
    }
    .detail-img { width: 100%; aspect-ratio: 1; object-fit: cover; }
    .overlay-badge { position: absolute; top: 1rem; left: 1rem; }

    .detail-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding-top: 0.5rem;
    }
    .category-tag {
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--color-primary);
      font-weight: 500;
    }
    .product-name {
      font-family: var(--font-display);
      font-size: clamp(1.8rem, 4vw, 2.4rem);
      font-weight: 500;
      line-height: 1.15;
      color: var(--color-text);
    }
    .product-price {
      font-size: 1.5rem;
      font-weight: 400;
      color: var(--color-text);
      font-family: var(--font-heading);
    }
    .product-desc {
      color: var(--color-text-2);
      font-size: 0.93rem;
      line-height: 1.8;
      font-weight: 300;
    }
    .divider { height: 1px; background: var(--color-border); }

    .qty-section { display: flex; align-items: center; gap: 1.5rem; }
    .qty-label { font-size: 0.75rem; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--color-text-2); }
    .qty-control {
      display: flex; align-items: center; gap: 0.85rem;
      border: 1px solid var(--color-border); border-radius: var(--radius-pill);
      padding: 0.35rem 1rem;
    }
    .qty-btn {
      background: none; border: none; cursor: pointer;
      font-size: 1.1rem; color: var(--color-text-2); width: 22px; text-align: center;
      transition: color var(--transition);
    }
    .qty-btn:hover:not(:disabled) { color: var(--color-primary); }
    .qty-btn:disabled { opacity: 0.25; cursor: not-allowed; }
    .qty-val { font-size: 0.95rem; font-weight: 500; min-width: 18px; text-align: center; }

    .detail-actions { display: flex; gap: 0.85rem; flex-wrap: wrap; }
    .add-btn { flex: 1; justify-content: center; padding: 0.85rem 1.5rem; min-width: 160px; }

    .added-msg {
      display: flex; align-items: center; gap: 0.6rem;
      background: var(--color-accent-tint);
      border: 1px solid rgba(107,143,113,0.3);
      border-radius: var(--radius); padding: 0.65rem 1rem;
      font-size: 0.82rem; color: var(--color-accent);
    }
    .added-msg a { color: var(--color-primary); font-weight: 500; margin-left: auto; font-size: 0.78rem; }

    .trust-badges {
      display: flex; flex-wrap: wrap; gap: 1.25rem;
      padding-top: 0.25rem;
    }
    .trust-badges span {
      font-size: 0.75rem;
      color: var(--color-muted);
      letter-spacing: 0.03em;
    }
  `],
})
export class ProductDetailComponent implements OnInit {
  @Input() id!: string;

  private api     = inject(ApiService);
  private cartSvc = inject(CartService);

  product  = signal<Product | null>(null);
  loading  = signal(false);
  error    = signal(false);
  quantity = signal(1);
  added    = signal(false);

  ngOnInit(): void {
    this.loading.set(true);
    this.api.getProduct(Number(this.id)).subscribe({
      next: (res) => { this.product.set(res.data); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }

  increment(): void { this.quantity.update((q) => q + 1); }
  decrement(): void { this.quantity.update((q) => Math.max(1, q - 1)); }

  addToCart(product: Product): void {
    this.cartSvc.add(product, this.quantity());
    this.added.set(true);
    setTimeout(() => this.added.set(false), 3000);
  }
}
