import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/models';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { SpinnerComponent } from '../../components/spinner/spinner.component';

const CATEGORIES = ['All', 'Bouquets', 'Candles', 'Gift Hampers', 'Accessories', 'Ephemera - Keepsake Letters', 'Art & Craft', 'Home Decor'];

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [FormsModule, ProductCardComponent, SpinnerComponent],
  template: `
    <div class="page">
      <div class="container">

        <!-- Page Header -->
        <div class="page-header">
          <div>
            <h1 class="page-title">Our Collection</h1>
            @if (!loading()) {
              <p class="result-count">{{ filtered().length }} products</p>
            }
          </div>
          <!-- Search -->
          <div class="search-wrap">
            <svg class="search-icon" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              class="search-input"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Search products…"
            />
          </div>
        </div>

        <!-- Category Filters -->
        <div class="filters">
          @for (cat of categories; track cat) {
            <button
              class="filter-pill"
              [class.active]="activeCategory() === cat"
              (click)="setCategory(cat)"
            >{{ cat }}</button>
          }
        </div>

        <!-- Content -->
        @if (loading()) {
          <app-spinner />
        } @else if (filtered().length === 0) {
          <div class="empty-state">
            <p style="font-size:2.5rem">🔍</p>
            <h3>No products found</h3>
            <p>Try adjusting your search or category.</p>
          </div>
        } @else {
          <div class="product-grid">
            @for (product of filtered(); track product.id) {
              <app-product-card
                [product]="product"
                (addToCart)="addToCart($event)"
              />
            }
          </div>
        }
      </div>
    </div>

    @if (toastVisible()) {
      <div class="toast">✓ Added to cart</div>
    }
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .page-title {
      font-family: var(--font-display);
      font-size: clamp(2rem, 5vw, 2.8rem);
      font-weight: 500;
      line-height: 1.1;
    }
    .result-count {
      color: var(--color-muted);
      font-size: 0.8rem;
      margin-top: 0.3rem;
      letter-spacing: 0.04em;
    }

    .search-wrap { position: relative; }
    .search-icon {
      position: absolute; left: 0.9rem; top: 50%;
      transform: translateY(-50%); color: var(--color-muted);
      pointer-events: none;
    }
    .search-input { padding-left: 2.6rem; width: 280px; }

    .filters { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 2rem; }
    .filter-pill {
      padding: 0.38rem 1rem;
      border-radius: var(--radius-pill);
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      cursor: pointer;
      font-size: 0.72rem;
      font-family: var(--font-body);
      letter-spacing: 0.07em;
      text-transform: uppercase;
      transition: all var(--transition);
      color: var(--color-text-2);
    }
    .filter-pill.active,
    .filter-pill:hover {
      background: var(--color-primary);
      color: #fff;
      border-color: var(--color-primary);
    }

    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: 1.25rem;
    }

    .toast {
      position: fixed;
      bottom: 2rem; left: 50%;
      transform: translateX(-50%);
      background: var(--color-accent); color: #fff;
      padding: 0.6rem 1.4rem;
      border-radius: var(--radius-pill);
      font-size: 0.8rem; font-weight: 500; letter-spacing: 0.04em;
      box-shadow: var(--shadow);
      animation: fadein 0.2s ease; z-index: 999; white-space: nowrap;
    }
    @keyframes fadein { from { opacity: 0; transform: translateX(-50%) translateY(10px); } }

    @media (max-width: 560px) {
      .page-header { flex-direction: column; align-items: flex-start; }
      .search-input { width: 100%; }
    }
  `],
})
export class ProductListComponent implements OnInit {
  private api     = inject(ApiService);
  private cartSvc = inject(CartService);
  private route   = inject(ActivatedRoute);

  categories    = CATEGORIES;
  searchQuery   = signal('');
  activeCategory = signal('All');
  loading       = signal(false);
  toastVisible  = signal(false);
  private allProducts = signal<Product[]>([]);

  filtered = computed(() => {
    let list = this.allProducts();
    const cat = this.activeCategory();
    const q   = this.searchQuery().toLowerCase().trim();
    if (cat !== 'All') list = list.filter((p) => p.category === cat);
    if (q)             list = list.filter((p) => p.name.toLowerCase().includes(q));
    return list;
  });

  ngOnInit(): void {
    // Respect ?category= query param from home page links
    const cat = this.route.snapshot.queryParamMap.get('category');
    if (cat) this.activeCategory.set(cat);

    this.loading.set(true);
    this.api.getProducts().subscribe({
      next: (res) => { this.allProducts.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  setCategory(cat: string): void { this.activeCategory.set(cat); }

  addToCart(product: Product): void {
    this.cartSvc.add(product, 1);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 2000);
  }
}
