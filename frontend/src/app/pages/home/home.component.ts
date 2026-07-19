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
        <p class="hero__eyebrow">A touch of love and a whisper of wish</p>
        <h1 class="hero__title">Gifts that <em>feel</em> like a hug</h1>
        <p class="hero__sub">Thoughtfully crafted, beautifully wrapped — for every special someone.</p>
        <div class="hero__cta">
          <a routerLink="/products" class="btn btn-primary hero__btn">Shop Now</a>
          <a routerLink="/track-order" class="btn btn-outline hero__btn">Track Order</a>
        </div>
      </div>
      <div class="hero__visual">
        <div class="hero__medallion">
          <img src="assets/images/lovewishsticker.png" alt="Love & Wish — a touch of love and a whisper of wish" class="hero__logo" />
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
      letter-spacing: 0.26em;
      color: var(--color-gold-dk);
      font-weight: 600;
      margin-bottom: 1.1rem;
      display: flex;
      align-items: center;
      gap: 0.7rem;
    }
    .hero__eyebrow::before {
      content: '';
      display: block;
      width: 34px;
      height: 2px;
      border-radius: 2px;
      background: var(--gradient-gold);
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
    .hero__visual {
      position: relative;
      flex-shrink: 0;
      display: grid;
      place-items: center;
    }
    /* Soft radial gold glow behind the medallion */
    .hero__visual::before {
      content: '';
      position: absolute;
      width: 118%;
      height: 118%;
      border-radius: 50%;
      background: radial-gradient(circle at 50% 45%, rgba(226,205,147,0.45) 0%, rgba(207,158,145,0.18) 45%, transparent 70%);
      filter: blur(6px);
      z-index: 0;
    }
    .hero__medallion {
      position: relative;
      z-index: 1;
      width: 360px;
      height: 360px;
      border-radius: 50%;
      overflow: hidden;
      display: grid;
      place-items: center;
    }
    .hero__logo {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      display: block;
    }
    @media (max-width: 760px) {
      .hero { flex-direction: column-reverse; text-align: center; gap: 2rem; min-height: auto; }
      .hero__eyebrow { justify-content: center; }
      .hero__cta { justify-content: center; }
      .hero__sub { margin-inline: auto; }
      .hero__medallion { width: 230px; height: 230px; margin-inline: auto; }
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
      position: relative;
      font-family: var(--font-heading);
      font-size: clamp(1.55rem, 3vw, 2.1rem);
      font-weight: 500;
      color: var(--color-text);
      padding-top: 1rem;
    }
    /* Gold hairline above each section title */
    .section-title::before {
      content: '';
      position: absolute;
      top: 0; left: 0;
      width: 46px;
      height: 2px;
      border-radius: 2px;
      background: var(--gradient-gold);
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
      gap: 0.85rem;
      padding: 1.75rem 0.5rem 1.4rem;
      text-align: center;
      cursor: pointer;
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
      text-decoration: none;
    }
    .cat-card:hover {
      border-color: var(--color-gold-lt);
      transform: translateY(-4px);
      box-shadow: var(--shadow);
    }
    .cat-card__icon {
      font-size: 1.65rem;
      line-height: 1;
      width: 62px;
      height: 62px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: radial-gradient(circle at 50% 40%, var(--color-gold-tint), var(--color-primary-tint));
      border: 1px solid var(--color-border);
      transition: border-color var(--transition), box-shadow var(--transition), transform var(--transition);
    }
    .cat-card:hover .cat-card__icon {
      border-color: var(--color-gold);
      box-shadow: var(--shadow-gold);
      transform: scale(1.06);
    }
    .cat-card__label {
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-text-2);
      transition: color var(--transition);
    }
    .cat-card:hover .cat-card__label { color: var(--color-primary-dk); }

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
      font-size: 3.2rem;
      font-weight: 600;
      background: var(--gradient-gold);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
      line-height: 1;
      margin-bottom: 1rem;
    }
    .step-card {
      transition: background var(--transition);
    }
    .step-card:hover { background: var(--color-primary-tint); }
    .step-card h3 {
      font-family: var(--font-heading);
      font-size: 1.05rem;
      font-weight: 500;
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
