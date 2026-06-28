import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // ── Customer routes ───────────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./pages/product-list/product-list.component').then((m) => m.ProductListComponent),
  },
  {
    path: 'products/:id',
    loadComponent: () =>
      import('./pages/product-detail/product-detail.component').then((m) => m.ProductDetailComponent),
  },
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart.component').then((m) => m.CartComponent),
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./pages/checkout/checkout.component').then((m) => m.CheckoutComponent),
  },
  {
    path: 'track-order',
    loadComponent: () =>
      import('./pages/order-tracking/order-tracking.component').then((m) => m.OrderTrackingComponent),
  },

  // ── Admin — public ────────────────────────────────────────
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./pages/admin-login/admin-login.component').then((m) => m.AdminLoginComponent),
  },

  // ── Admin — protected (shared layout + child routes) ──────
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin-layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/admin-products/admin-products.component').then(
            (m) => m.AdminProductsComponent
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/admin-orders/admin-orders.component').then(
            (m) => m.AdminOrdersComponent
          ),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
