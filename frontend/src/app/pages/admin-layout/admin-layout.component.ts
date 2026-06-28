import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-shell">

      <!-- Sidebar -->
      <aside class="sidebar" [class.open]="sidebarOpen()">
        <div class="sidebar__header">
          <div class="sidebar__brand">
            <span class="brand-name">LoveWish</span>
            <span class="brand-tag">Admin</span>
          </div>
          <button class="sidebar__close" (click)="sidebarOpen.set(false)">✕</button>
        </div>

        <nav class="sidebar__nav">
          <a routerLink="/admin/dashboard"
             routerLinkActive="active"
             (click)="sidebarOpen.set(false)"
             class="nav-link">
            <span class="nav-link__icon">📊</span>
            <span>Dashboard</span>
          </a>
          <a routerLink="/admin/products"
             routerLinkActive="active"
             (click)="sidebarOpen.set(false)"
             class="nav-link">
            <span class="nav-link__icon">🎁</span>
            <span>Products</span>
          </a>
          <a routerLink="/admin/orders"
             routerLinkActive="active"
             (click)="sidebarOpen.set(false)"
             class="nav-link">
            <span class="nav-link__icon">📋</span>
            <span>Orders</span>
          </a>
        </nav>

        <button class="sidebar__logout" (click)="logout()">
          <span>⬅</span> Logout
        </button>
      </aside>

      <!-- Overlay for mobile -->
      @if (sidebarOpen()) {
        <div class="sidebar-overlay" (click)="sidebarOpen.set(false)"></div>
      }

      <!-- Main content area -->
      <div class="admin-main">
        <!-- Mobile topbar -->
        <header class="topbar">
          <button class="topbar__menu" (click)="sidebarOpen.set(true)">☰</button>
          <span class="topbar__title">LoveWish Admin</span>
        </header>

        <div class="admin-content">
          <router-outlet />
        </div>
      </div>

    </div>
  `,
  styles: [`
    .admin-shell {
      display: flex;
      min-height: 100vh;
      background: #f4f6f9;
    }

    /* ── Sidebar ─────────────────────────────── */
    .sidebar {
      width: 230px;
      flex-shrink: 0;
      background: #1a1a2e;
      display: flex;
      flex-direction: column;
      padding: 1.5rem 0;
      position: sticky;
      top: 0;
      height: 100vh;
    }

    .sidebar__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .sidebar__brand { display: flex; flex-direction: column; }
    .brand-name { font-family: var(--font-heading); font-size: 1.3rem; color: var(--color-primary); }
    .brand-tag  { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(255,255,255,0.4); margin-top: 0.1rem; }

    .sidebar__close { display: none; background: none; border: none; color: rgba(255,255,255,0.5); font-size: 1rem; cursor: pointer; }

    .sidebar__nav {
      flex: 1;
      padding: 1.25rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.7rem 0.9rem;
      border-radius: 8px;
      color: rgba(255,255,255,0.6);
      font-size: 0.9rem;
      transition: all 0.18s;
      text-decoration: none;
    }
    .nav-link:hover { background: rgba(255,255,255,0.07); color: #fff; }
    .nav-link.active { background: var(--color-primary); color: #fff; }
    .nav-link__icon { font-size: 1rem; width: 20px; text-align: center; }

    .sidebar__logout {
      margin: 0 0.75rem;
      padding: 0.65rem 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: none;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 8px;
      color: rgba(255,255,255,0.5);
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.18s;
      font-family: var(--font-body);
    }
    .sidebar__logout:hover { background: rgba(255,255,255,0.07); color: #fff; }

    /* ── Main ────────────────────────────────── */
    .admin-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

    .topbar {
      display: none;
      align-items: center;
      gap: 1rem;
      padding: 0.9rem 1.25rem;
      background: #fff;
      border-bottom: 1px solid var(--color-border);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .topbar__menu { background: none; border: none; font-size: 1.3rem; cursor: pointer; }
    .topbar__title { font-family: var(--font-heading); font-size: 1.1rem; color: var(--color-primary); }

    .admin-content { padding: 2rem; flex: 1; }

    /* ── Mobile ──────────────────────────────── */
    @media (max-width: 768px) {
      .sidebar {
        position: fixed;
        left: -230px;
        top: 0; bottom: 0;
        z-index: 200;
        transition: left 0.25s ease;
      }
      .sidebar.open { left: 0; }
      .sidebar__close { display: block; }
      .sidebar-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.4);
        z-index: 199;
      }
      .topbar { display: flex; }
      .admin-content { padding: 1.25rem; }
    }
  `],
})
export class AdminLayoutComponent {
  private router = inject(Router);
  private api = inject(ApiService);
  sidebarOpen = signal(false);

  logout(): void {
    // Clear the httpOnly cookies server-side, then navigate regardless of result.
    this.api.adminLogout().subscribe({
      next: () => this.router.navigate(['/admin/login']),
      error: () => this.router.navigate(['/admin/login']),
    });
  }
}
