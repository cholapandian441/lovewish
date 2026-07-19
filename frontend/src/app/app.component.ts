import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CartService } from './services/cart.service';
import { ToastComponent } from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastComponent],
  template: `
    <!-- ── Navbar ──────────────────────────────────────────── -->
    <header class="navbar">
      <div class="container navbar__inner">

        <!-- Brand -->
        <a routerLink="/" class="navbar__brand" (click)="closeMenu()">
          <span class="brand-name">LoveWish</span>
          <span class="brand-tagline">handmade gifts</span>
        </a>

        <!-- Desktop nav -->
        <nav class="navbar__links">
          <a routerLink="/"           routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a>
          <a routerLink="/products"   routerLinkActive="active">Shop</a>
          <a routerLink="/track-order" routerLinkActive="active">Track Order</a>
        </nav>

        <!-- Actions -->
        <div class="navbar__actions">
          <a routerLink="/cart" class="cart-btn" aria-label="Cart">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            @if (cartCount() > 0) {
              <span class="cart-badge">{{ cartCount() }}</span>
            }
          </a>

          <!-- Hamburger — mobile only -->
          <button class="hamburger" (click)="menuOpen.set(!menuOpen())" [attr.aria-expanded]="menuOpen()" aria-label="Menu">
            <span class="hamburger__line" [class.open]="menuOpen()"></span>
            <span class="hamburger__line" [class.open]="menuOpen()"></span>
            <span class="hamburger__line" [class.open]="menuOpen()"></span>
          </button>
        </div>
      </div>
    </header>

    <!-- ── Mobile drawer ───────────────────────────────────── -->
    @if (menuOpen()) {
      <div class="mobile-overlay" (click)="closeMenu()"></div>
      <nav class="mobile-drawer">
        <a routerLink="/"            (click)="closeMenu()">Home</a>
        <a routerLink="/products"    (click)="closeMenu()">Shop</a>
        <a routerLink="/track-order" (click)="closeMenu()">Track Order</a>
        <a routerLink="/cart"        (click)="closeMenu()" class="mobile-cart-link">
          Cart
          @if (cartCount() > 0) { <span class="cart-badge">{{ cartCount() }}</span> }
        </a>
      </nav>
    }

    <!-- ── Main ────────────────────────────────────────────── -->
    <main>
      <router-outlet />
    </main>

    <!-- ── Footer ──────────────────────────────────────────── -->
    <footer class="footer">
      <div class="container footer__inner">
        <div class="footer__brand">
          <span class="brand-name">LoveWish</span>
          <p>Handmade with care, delivered with love.</p>
        </div>
        <div class="footer__links">
          <a routerLink="/products">Shop</a>
          <a routerLink="/track-order">Track Order</a>
          <a routerLink="/cart">Cart</a>
        </div>
        <div class="footer__contact">
          <h4 class="footer__contact-title">Get in Touch</h4>
          <a
            href="https://www.instagram.com/lovewishgifts_"
            target="_blank"
            rel="noopener noreferrer"
            class="footer__contact-item"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <line x1="17.5" y1="6.5" x2="17.5" y2="6.5"/>
            </svg>
            <span>&#64;lovewishgifts_</span>
          </a>
          <a href="tel:9535423219" class="footer__contact-item">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span>9535423219</span>
          </a>
          <a href="mailto:lovewis03052025@gmail.com" class="footer__contact-item">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-10 6L2 7"/>
            </svg>
            <span>lovewis03052025&#64;gmail.com</span>
          </a>
        </div>
      </div>
      <div class="container footer__bottom">
        <p>© {{ year }} LoveWish. All rights reserved.</p>
      </div>
    </footer>

    <app-toast />
  `,
  styles: [`
    /* ── Navbar ───────────────────────────────────── */
    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(250, 247, 243, 0.82);
      backdrop-filter: blur(16px) saturate(1.4);
      -webkit-backdrop-filter: blur(16px) saturate(1.4);
      border-bottom: 1px solid var(--color-border);
    }
    /* Gold hairline accent beneath the nav */
    .navbar::after {
      content: '';
      position: absolute;
      left: 0; right: 0; bottom: -1px;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--color-gold-lt) 20%, var(--color-gold) 50%, var(--color-gold-lt) 80%, transparent);
      opacity: 0.55;
    }

    .navbar__inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: var(--nav-height);
    }

    /* Brand */
    .navbar__brand {
      display: flex;
      flex-direction: column;
      gap: 0.05rem;
      line-height: 1;
    }
    .brand-name {
      font-family: var(--font-display);
      font-size: 1.7rem;
      font-weight: 600;
      color: var(--color-primary-dk);
      letter-spacing: 0.015em;
    }
    .brand-tagline {
      font-size: 0.56rem;
      letter-spacing: 0.34em;
      text-transform: uppercase;
      color: var(--color-gold-dk);
      font-weight: 500;
      padding-left: 0.1em;
    }

    /* Desktop nav links */
    .navbar__links {
      display: flex;
      gap: 2.5rem;
      font-size: 0.8rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .navbar__links a {
      color: var(--color-text-2);
      position: relative;
      padding-bottom: 2px;
      transition: color var(--transition);
    }
    .navbar__links a::after {
      content: '';
      position: absolute;
      bottom: -2px; left: 0;
      width: 0; height: 1.5px;
      background: var(--gradient-gold);
      transition: width var(--transition);
    }
    .navbar__links a:hover,
    .navbar__links a.active { color: var(--color-primary); }
    .navbar__links a.active::after,
    .navbar__links a:hover::after { width: 100%; }

    /* Actions */
    .navbar__actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .cart-btn {
      position: relative;
      color: var(--color-text-2);
      transition: color var(--transition);
      display: flex;
      align-items: center;
      padding: 0.3rem;
    }
    .cart-btn:hover { color: var(--color-primary); }

    .cart-badge {
      position: absolute;
      top: -4px; right: -6px;
      background: var(--color-primary);
      color: #fff;
      font-size: 0.6rem;
      font-weight: 600;
      min-width: 17px;
      height: 17px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--color-bg);
    }

    /* Hamburger */
    .hamburger {
      display: none;
      flex-direction: column;
      gap: 5px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px 4px;
    }
    .hamburger__line {
      display: block;
      width: 22px;
      height: 1.5px;
      background: var(--color-text);
      border-radius: 2px;
      transition: all var(--transition);
    }

    /* Mobile overlay */
    .mobile-overlay {
      position: fixed; inset: 0;
      background: rgba(40,32,26,0.35);
      z-index: 199;
      backdrop-filter: blur(2px);
      animation: fadein 0.18s ease;
    }

    /* Mobile drawer */
    .mobile-drawer {
      position: fixed;
      top: var(--nav-height);
      left: 0; right: 0;
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      z-index: 200;
      display: flex;
      flex-direction: column;
      padding: 0.5rem 0;
      box-shadow: var(--shadow-lg);
      animation: slidedown 0.2s ease;
    }
    .mobile-drawer a {
      padding: 1rem clamp(1rem, 5vw, 2rem);
      font-size: 0.85rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-text-2);
      border-bottom: 1px solid var(--color-border);
      transition: all var(--transition);
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .mobile-drawer a:last-child { border-bottom: none; }
    .mobile-drawer a:hover { color: var(--color-primary); background: var(--color-primary-tint); }
    .mobile-cart-link { position: relative; }

    @keyframes fadein  { from { opacity: 0; } }
    @keyframes slidedown { from { opacity: 0; transform: translateY(-8px); } }

    /* ── Footer — dark espresso luxe ──────────────── */
    .footer {
      position: relative;
      background: var(--color-ink);
      color: #e8ded2;
      margin-top: auto;
    }
    /* Gold top hairline */
    .footer::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--color-gold) 30%, var(--color-gold-lt) 50%, var(--color-gold) 70%, transparent);
      opacity: 0.7;
    }
    .footer__inner {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-top: 3.5rem;
      padding-bottom: 2rem;
      gap: 2.5rem;
      flex-wrap: wrap;
    }
    .footer__brand .brand-name {
      font-family: var(--font-display);
      font-size: 1.7rem;
      font-weight: 600;
      background: var(--gradient-gold);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
      display: block;
      margin-bottom: 0.55rem;
    }
    .footer__brand p {
      font-size: 0.85rem;
      color: #b3a698;
      max-width: 240px;
      line-height: 1.7;
    }
    .footer__links {
      display: flex;
      gap: 1.75rem;
      font-size: 0.74rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #cbbfb1;
    }
    .footer__links a {
      position: relative;
      transition: color var(--transition);
    }
    .footer__links a:hover { color: var(--color-gold-lt); }

    /* Footer contact */
    .footer__contact {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      align-items: flex-start;
    }
    .footer__contact-title {
      font-size: 0.68rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: var(--color-gold-lt);
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    .footer__contact-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 0.85rem;
      color: #c3b6a8;
      transition: color var(--transition);
    }
    .footer__contact-item svg {
      flex-shrink: 0;
      color: var(--color-gold);
      transition: color var(--transition), transform var(--transition);
    }
    .footer__contact-item:hover { color: #fff; }
    .footer__contact-item:hover svg { color: var(--color-gold-lt); transform: scale(1.1); }

    .footer__bottom {
      padding-bottom: 1.75rem;
      font-size: 0.74rem;
      letter-spacing: 0.04em;
      color: #8c7f71;
      border-top: 1px solid var(--color-ink-line);
      padding-top: 1.25rem;
    }

    /* ── Responsive ───────────────────────────────── */
    /* Tablet — keep brand wide, let links + contact share the row */
    @media (max-width: 860px) {
      .footer__inner { gap: 2rem 3rem; }
      .footer__brand { flex: 1 1 100%; }
    }

    @media (max-width: 680px) {
      .navbar__links { display: none; }
      .hamburger { display: flex; }

      /* Stack footer columns */
      .footer__inner {
        flex-direction: column;
        gap: 1.75rem;
      }
      .footer__links { flex-wrap: wrap; gap: 1rem 1.75rem; }
    }
  `],
})
export class AppComponent {
  private cartService = inject(CartService);
  readonly cartCount = this.cartService.count;
  menuOpen = signal(false);
  year = new Date().getFullYear();

  closeMenu(): void { this.menuOpen.set(false); }
}
