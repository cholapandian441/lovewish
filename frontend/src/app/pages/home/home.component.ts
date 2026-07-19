import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/models';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { SpinnerComponent } from '../../components/spinner/spinner.component';

const CATEGORIES = [
  { label: 'Bouquets',   icon: '💐', route: '/products?category=Bouquets'  },
  { label: 'Candles',    icon: '🕯️', route: '/products?category=Candles'   },
  { label: 'Gift Hampers', icon: '🎁', route: '/products?category=Gift Hampers' },
  { label: 'Accessories',  icon: '💎', route: '/products?category=Accessories'  },
  { label: 'Ephemera - Keepsake Letters', icon: '✉️', route: '/products?category=Ephemera - Keepsake Letters' },
  { label: 'Art & Craft',  icon: '🎨', route: '/products?category=Art & Craft' },
  { label: 'Home Decor',   icon: '🏠', route: '/products?category=Home Decor'  },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, ProductCardComponent, SpinnerComponent],
  template: `
    <!-- ── Hero ───────────────────────────────────────────── -->
    <section class="hero">
      <div class="hero__content">
        <p class="hero__eyebrow">Handmade with love</p>
        <h1 class="hero__title">Gifts that <em>feel</em> like a hug</h1>
        <p class="hero__sub">Thoughtfully crafted, beautifully wrapped — for every special someone.</p>
        <div class="hero__cta">
          <a routerLink="/products" class="btn btn-primary hero__btn">Shop Now</a>
          <a routerLink="/track-order" class="btn btn-outline hero__btn">Track Order</a>
        </div>
      </div>
      <div class="hero__visual">
        <div class="hero__medallion">
          <img src="assets/images/lovewishlogo.jpg" alt="Love & Wish — a touch of love and a whisper of wish" class="hero__logo" />
        </div>
      </div>
    </section>

    <!-- ── Categories ─────────────────────────────────────── -->
    <section class="section">
      <div class="container">
        <h2 class="section-title">Shop by Category</h2>
        <div class="categories-grid">
          @for (cat of categories; track cat.label) {
            <a routerLink="/products" [queryParams]="{ category: cat.label }" class="cat-card card">
              <span class="cat-card__icon">{{ cat.icon }}</span>
              <span class="cat-card__label">{{ cat.label }}</span>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- ── Best Sellers ───────────────────────────────────── -->
    <section class="section section--tinted">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Best Sellers</h2>
          <a routerLink="/products" class="see-all">View all →</a>
        </div>

        @if (loading()) {
          <app-spinner />
        } @else if (bestSellers().length === 0) {
          <div class="empty-state">
            <p>No products available yet. Check back soon!</p>
          </div>
        } @else {
          <div class="product-grid">
            @for (product of bestSellers(); track product.id) {
              <app-product-card
                [product]="product"
                (addToCart)="addToCart($event)"
              />
            }
          </div>
        }
      </div>
    </section>

    <!-- ── How It Works ───────────────────────────────────── -->
    <section class="section">
      <div class="container">
        <h2 class="section-title">How It Works</h2>
        <div class="steps-grid">
          <div class="step-card">
            <div class="step-card__num">01</div>
            <h3>Browse & Choose</h3>
            <p>Explore our handmade collection and pick your perfect gift.</p>
          </div>
          <div class="step-card">
            <div class="step-card__num">02</div>
            <h3>Place Your Order</h3>
            <p>Fill in your details — no account needed, no payment online.</p>
          </div>
          <div class="step-card">
            <div class="step-card__num">03</div>
            <h3>We Deliver</h3>
            <p>Your gift is packaged with care and delivered to your door.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Added toast ─────────────────────────────────────── -->
    @if (toastVisible()) {
      <div class="toast">✓ Added to cart</div>
    }
  `,
  styles: [`
    /* ── Hero ──────────────────────────── */
    .hero {
      min-height: 540px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 3rem;
      padding: clamp(3rem, 7vw, 5rem) clamp(1rem, 5vw, 2rem);
      max-width: var(--max-width);
      margin: 0 auto;
    }
    .hero__content { max-width: 520px; }
    .hero__eyebrow {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: var(--color-primary);
      font-weight: 500;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .hero__eyebrow::before {
      content: '';
      display: block;
      width: 28px;
      height: 1px;
      background: var(--color-primary-lt);
    }
    .hero__title {
      font-family: var(--font-display);
      font-size: clamp(2.8rem, 6vw, 4.2rem);
      font-weight: 500;
      line-height: 1.1;
      margin-bottom: 1.25rem;
      color: var(--color-text);
    }
    .hero__title em {
      color: var(--color-primary);
      font-style: italic;
    }
    .hero__sub {
      color: var(--color-text-2);
      font-size: 1rem;
      line-height: 1.75;
      max-width: 400px;
      margin-bottom: 2.25rem;
      font-weight: 300;
    }
    .hero__cta { display: flex; gap: 0.85rem; flex-wrap: wrap; }
    .hero__visual { flex-shrink: 0; }
    .hero__medallion {
      position: relative;
      width: 360px;
      height: 360px;
      border-radius: 50%;
      padding: 18px;
      display: grid;
      place-items: center;
      background: radial-gradient(circle at 32% 26%, #ffffff, var(--color-primary-tint) 52%, #efe3df 100%);
      box-shadow:
        0 30px 60px -24px rgba(140,84,73,0.50),
        inset 0 1px 1px rgba(255,255,255,0.7);
      animation: float 5s ease-in-out infinite;
    }
    .hero__medallion::after {
      content: '';
      position: absolute;
      width: 360px;
      height: 360px;
      border-radius: 50%;
      border: 1px solid rgba(181,118,106,0.18);
      pointer-events: none;
    }
    .hero__logo {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      display: block;
      border: 1px solid rgba(181,118,106,0.25);
      box-shadow: 0 12px 32px -12px rgba(0,0,0,0.55);
    }
    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(-1deg); }
      50%       { transform: translateY(-14px) rotate(1deg); }
    }
    @media (max-width: 760px) {
      .hero { flex-direction: column-reverse; text-align: center; gap: 2rem; min-height: auto; }
      .hero__eyebrow { justify-content: center; }
      .hero__cta { justify-content: center; }
      .hero__sub { margin-inline: auto; }
      .hero__medallion { width: 230px; height: 230px; padding: 12px; margin-inline: auto; }
      .hero__medallion::after { width: 230px; height: 230px; }
    }

    /* ── Sections ───────────────────────── */
    .section { padding: clamp(2.5rem, 6vw, 4rem) 0; }
    .section--tinted { background: var(--color-bg-alt); }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2rem;
      gap: 1rem;
    }
    .section-eyebrow {
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: var(--color-primary);
      font-weight: 500;
      margin-bottom: 0.4rem;
    }
    .section-title {
      font-family: var(--font-heading);
      font-size: clamp(1.4rem, 3vw, 1.85rem);
      font-weight: 400;
      color: var(--color-text);
    }
    .see-all {
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-primary);
      font-weight: 500;
      padding-bottom: 1px;
      border-bottom: 1px solid var(--color-primary-lt);
      transition: color var(--transition), border-color var(--transition);
    }
    .see-all:hover { color: var(--color-primary-dk); border-color: var(--color-primary-dk); }

    /* ── Categories ─────────────────────── */
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0.85rem;
      margin-top: 1.5rem;
    }
    @media (max-width: 640px) { .categories-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 380px) { .categories-grid { grid-template-columns: repeat(2, 1fr); } }

    .cat-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.65rem;
      padding: 1.5rem 0.5rem 1.25rem;
      text-align: center;
      cursor: pointer;
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      transition: all var(--transition);
      text-decoration: none;
    }
    .cat-card:hover {
      border-color: var(--color-primary-lt);
      background: var(--color-primary-tint);
      transform: translateY(-2px);
      box-shadow: var(--shadow-sm);
    }
    .cat-card__icon { font-size: 1.8rem; line-height: 1; }
    .cat-card__label {
      font-size: 0.72rem;
      font-weight: 500;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--color-text-2);
    }

    /* ── Product Grid ───────────────────── */
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 1.25rem;
    }

    /* ── Steps ──────────────────────────── */
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1px;
      margin-top: 1.75rem;
      background: var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      border: 1px solid var(--color-border);
    }
    @media (max-width: 600px) { .steps-grid { grid-template-columns: 1fr; } }

    .step-card {
      background: var(--color-surface);
      text-align: center;
      padding: 2.25rem 1.5rem;
    }
    .step-card__num {
      font-family: var(--font-display);
      font-size: 3rem;
      font-weight: 400;
      color: var(--color-primary-lt);
      line-height: 1;
      margin-bottom: 1rem;
    }
    .step-card h3 {
      font-family: var(--font-heading);
      font-size: 1rem;
      font-weight: 400;
      margin-bottom: 0.5rem;
    }
    .step-card p { color: var(--color-muted); font-size: 0.875rem; line-height: 1.65; }

    /* ── Toast ──────────────────────────── */
    .toast {
      position: fixed;
      bottom: 2rem; left: 50%;
      transform: translateX(-50%);
      background: var(--color-accent);
      color: #fff;
      padding: 0.6rem 1.4rem;
      border-radius: var(--radius-pill);
      font-size: 0.8rem;
      font-weight: 500;
      letter-spacing: 0.04em;
      box-shadow: var(--shadow);
      animation: fadein 0.2s ease;
      z-index: 999;
      white-space: nowrap;
    }
    @keyframes fadein { from { opacity: 0; transform: translateX(-50%) translateY(10px); } }
  `],
})
export class HomeComponent implements OnInit {
  private api     = inject(ApiService);
  private cartSvc = inject(CartService);

  loading      = signal(false);
  bestSellers  = signal<Product[]>([]);
  toastVisible = signal(false);
  categories   = CATEGORIES;

  ngOnInit(): void {
    this.loading.set(true);
    this.api.getProducts().subscribe({
      next: (res) => {
        this.bestSellers.set(res.data.filter((p) => p.is_best_seller === 1).slice(0, 4));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  addToCart(product: Product): void {
    this.cartSvc.add(product, 1);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 2000);
  }
}
