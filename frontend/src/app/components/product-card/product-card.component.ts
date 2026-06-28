import { Component, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../../models/models';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="product-card">
      <a [routerLink]="['/products', product.id]" class="product-card__media">
        <img
          [src]="product.image_url || 'assets/placeholder.png'"
          [alt]="product.name"
          class="product-card__img"
          loading="lazy"
        />
        @if (product.is_best_seller) {
          <span class="product-card__flag">Bestseller</span>
        }
        @if (inCart()) {
          <span class="product-card__in-cart">✓ In Cart</span>
        }
        <div class="product-card__overlay"></div>
      </a>

      <div class="product-card__body">
        <span class="product-card__cat">{{ product.category }}</span>
        <a [routerLink]="['/products', product.id]" class="product-card__name">{{ product.name }}</a>

        <div class="product-card__foot">
          <span class="product-card__price">₹{{ product.price }}</span>

          @if (inCart()) {
            <div class="qty-control">
              <button class="qty-btn" (click)="decrement($event)">−</button>
              <span class="qty-val">{{ cartQty() }}</span>
              <button class="qty-btn" (click)="increment($event)">+</button>
            </div>
          } @else {
            <button class="add-btn" (click)="onAdd($event)">Add</button>
          }
        </div>
      </div>
    </article>
  `,
  styles: [`
    .product-card {
      display: flex;
      flex-direction: column;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: border-color var(--transition), box-shadow var(--transition), transform var(--transition);
    }
    .product-card:hover {
      border-color: var(--color-primary-lt);
      box-shadow: var(--shadow);
      transform: translateY(-3px);
    }

    /* Image */
    .product-card__media {
      position: relative;
      aspect-ratio: 1;
      overflow: hidden;
      display: block;
      background: var(--color-bg-alt);
    }
    .product-card__img {
      width: 100%; height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }
    .product-card:hover .product-card__img { transform: scale(1.06); }

    .product-card__overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(40,32,26,0.18) 0%, transparent 55%);
      opacity: 0;
      transition: opacity var(--transition);
    }
    .product-card:hover .product-card__overlay { opacity: 1; }

    /* Flags */
    .product-card__flag {
      position: absolute;
      top: 0.75rem; left: 0.75rem;
      background: var(--color-surface);
      color: var(--color-primary-dk);
      font-size: 0.65rem;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 0.25rem 0.6rem;
      border-radius: var(--radius-pill);
      border: 1px solid var(--color-border);
    }
    .product-card__in-cart {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      background: var(--color-accent);
      color: #fff;
      font-size: 0.7rem;
      font-weight: 500;
      letter-spacing: 0.06em;
      text-align: center;
      padding: 0.35rem;
    }

    /* Body */
    .product-card__body {
      padding: 1rem 1.1rem 1.1rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
    }

    .product-card__cat {
      font-size: 0.67rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--color-muted);
    }

    .product-card__name {
      font-family: var(--font-heading);
      font-size: 1rem;
      font-weight: 400;
      color: var(--color-text);
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-top: 0.1rem;
    }
    .product-card__name:hover { color: var(--color-primary); }

    /* Footer */
    .product-card__foot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 0.75rem;
    }

    .product-card__price {
      font-size: 1rem;
      font-weight: 500;
      color: var(--color-text);
    }

    /* Add button */
    .add-btn {
      font-family: var(--font-body);
      font-size: 0.72rem;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 0.4rem 1rem;
      border-radius: var(--radius-pill);
      border: 1.5px solid var(--color-primary);
      background: transparent;
      color: var(--color-primary);
      cursor: pointer;
      transition: all var(--transition);
    }
    .add-btn:hover {
      background: var(--color-primary);
      color: #fff;
    }

    /* Qty control */
    .qty-control {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: 1.5px solid var(--color-primary);
      border-radius: var(--radius-pill);
      padding: 0.25rem 0.6rem;
    }
    .qty-btn {
      background: none; border: none;
      cursor: pointer; font-size: 1rem;
      color: var(--color-primary);
      width: 18px; text-align: center;
      line-height: 1; transition: color var(--transition);
    }
    .qty-btn:hover { color: var(--color-primary-dk); }
    .qty-val {
      font-size: 0.85rem; font-weight: 500;
      min-width: 14px; text-align: center;
    }
  `],
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Output() addToCart = new EventEmitter<Product>();

  private cartSvc = inject(CartService);

  inCart  = computed(() => this.cartSvc.isInCart(this.product.id));
  cartQty = computed(() => this.cartSvc.getItemQuantity(this.product.id));

  onAdd(e: Event): void {
    e.preventDefault();
    // Parent (product-list / home) owns the cart mutation via the addToCart handler.
    // Adding here too would double-count the item on a single click.
    this.addToCart.emit(this.product);
  }

  increment(e: Event): void {
    e.preventDefault();
    this.cartSvc.updateQuantity(this.product.id, this.cartQty() + 1);
  }

  decrement(e: Event): void {
    e.preventDefault();
    this.cartSvc.updateQuantity(this.product.id, this.cartQty() - 1);
  }
}
