import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ApiResponse,
  CreateOrderPayload,
  Order,
  OrderStatus,
  Product,
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // ─── Products (public) ────────────────────────────────────

  getProducts(category?: string): Observable<ApiResponse<Product[]>> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    return this.http.get<ApiResponse<Product[]>>(`${this.base}/products`, { params });
  }

  getProduct(id: number): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.base}/products/${id}`);
  }

  getProductsByCategory(category: string): Observable<ApiResponse<Product[]>> {
    return this.http.get<ApiResponse<Product[]>>(`${this.base}/products/category/${category}`);
  }

  // ─── Orders (public) ──────────────────────────────────────

  createOrder(payload: CreateOrderPayload): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(`${this.base}/orders`, payload);
  }

  trackOrder(orderNumber: string): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(`${this.base}/orders/${encodeURIComponent(orderNumber)}`);
  }

  // ─── Admin — Auth ─────────────────────────────────────────

  adminLogin(username: string, password: string): Observable<{
    success: boolean;
    admin: { id: number; username: string };
  }> {
    // The JWT is returned as an httpOnly cookie, not in the response body.
    return this.http.post<{ success: boolean; admin: { id: number; username: string } }>(
      `${this.base}/admin/login`,
      { username, password }
    );
  }

  adminLogout(): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.base}/admin/logout`, {});
  }

  // ─── Admin — Orders ───────────────────────────────────────
  // Auth header is injected automatically by authInterceptor

  getOrders(status?: OrderStatus): Observable<ApiResponse<Order[]>> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<Order[]>>(`${this.base}/admin/orders`, { params });
  }

  updateOrderStatus(id: number, status: OrderStatus): Observable<ApiResponse<Order>> {
    return this.http.put<ApiResponse<Order>>(
      `${this.base}/admin/orders/${id}/status`,
      { status }
    );
  }

  // ─── Admin — Products ─────────────────────────────────────

  uploadImage(file: File): Observable<{ success: boolean; url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http.post<{ success: boolean; url: string }>(`${this.base}/upload`, formData);
  }

  createProduct(data: Partial<Product>): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(`${this.base}/products`, data);
  }

  updateProduct(id: number, data: Partial<Product>): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${this.base}/products/${id}`, data);
  }

  deleteProduct(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.base}/products/${id}`);
  }
}
