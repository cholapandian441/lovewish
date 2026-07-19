import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Product } from '../../models/models';
import { CommonModule, SlicePipe } from '@angular/common';

const CATEGORIES = ['Bouquets', 'Candles', 'Gift Hampers', 'Accessories', 'Ephemera - Keepsake Letters', 'Art & Craft', 'Home Decor'];

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule, SlicePipe],
  template: `
    <div class="admin-products">
      <div class="page-header">
        <h1 class="page-title">Products</h1>
        <button class="btn btn-primary" (click)="openAdd()">+ Add Product</button>
      </div>

      <!-- Search -->
      <div class="search-wrap">
        <input
          [value]="searchQuery()"
          (input)="searchQuery.set($any($event.target).value)"
          placeholder="Search products…"
          class="search-input"
        />
      </div>

      @if (loading()) {
        <p class="loading-text">Loading…</p>
      } @else if (filtered().length === 0) {
        <div class="empty-state">
          <p>No products found.</p>
          <button class="btn btn-primary" style="margin-top:1rem" (click)="openAdd()">Add First Product</button>
        </div>
      } @else {

        <!-- Products Table -->
        <div class="table-card card">
          <table class="products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Best Seller</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (p of filtered(); track p.id) {
                <tr>
                  <td class="product-cell">
                    <img
                      [src]="p.image_url || 'assets/placeholder.png'"
                      [alt]="p.name"
                      class="product-thumb"
                    />
                    <div>
                      <strong>{{ p.name }}</strong>
                      <p class="product-desc-preview">{{ p.description | slice:0:60 }}{{ p.description && p.description.length > 60 ? '…' : '' }}</p>
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-gold">{{ p.category }}</span>
                  </td>
                  <td><strong>₹{{ p.price }}</strong></td>
                  <td>
                    @if (p.is_best_seller) {
                      <span class="badge badge-green">⭐ Yes</span>
                    } @else {
                      <span class="muted">—</span>
                    }
                  </td>
                  <td class="actions-cell">
                    <button class="action-btn edit-btn" (click)="openEdit(p)">Edit</button>
                    <button class="action-btn delete-btn" (click)="confirmDelete(p)">Delete</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

    </div>

    <!-- ── Add / Edit Modal ──────────────────────────────── -->
    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal card" (click)="$event.stopPropagation()">
          <div class="modal__header">
            <h2>{{ editingProduct() ? 'Edit Product' : 'Add Product' }}</h2>
            <button class="modal__close" (click)="closeModal()">✕</button>
          </div>

          <form [formGroup]="form" (ngSubmit)="saveProduct()" class="modal__body">
            <div class="form-grid-2">
              <div class="form-group">
                <label>Name *</label>
                <input formControlName="name" placeholder="Product name" />
                @if (isInvalid('name')) { <span class="error-msg">Required.</span> }
              </div>
              <div class="form-group">
                <label>Category *</label>
                <select formControlName="category">
                  <option value="" disabled>Select category</option>
                  @for (cat of categories; track cat) {
                    <option [value]="cat">{{ cat }}</option>
                  }
                </select>
                @if (isInvalid('category')) { <span class="error-msg">Required.</span> }
              </div>
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea formControlName="description" rows="3" placeholder="Describe the product…"></textarea>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label>Price (₹) *</label>
                <input formControlName="price" type="number" min="0" step="0.01" placeholder="0.00" />
                @if (isInvalid('price')) { <span class="error-msg">Valid price required.</span> }
              </div>
              <div class="form-group">
                <label>Product Image</label>
                <div class="image-upload">
                  @if (form.value.image_url) {
                    <img [src]="form.value.image_url" alt="Preview" class="image-preview" />
                  } @else {
                    <div class="image-placeholder">No image</div>
                  }
                  <div class="image-upload__controls">
                    <input
                      #fileInput type="file" accept="image/*" hidden
                      (change)="onImageSelected($event); fileInput.value=''"
                    />
                    <button type="button" class="action-btn edit-btn" (click)="fileInput.click()" [disabled]="uploading()">
                      {{ uploading() ? 'Uploading…' : (form.value.image_url ? 'Change' : 'Upload') }}
                    </button>
                    @if (form.value.image_url && !uploading()) {
                      <button type="button" class="action-btn delete-btn" (click)="clearImage()">Remove</button>
                    }
                  </div>
                </div>
                @if (uploadError()) { <span class="error-msg">{{ uploadError() }}</span> }
              </div>
            </div>

            <label class="checkbox-label">
              <input type="checkbox" formControlName="is_best_seller" />
              <span>Mark as Best Seller</span>
            </label>

            @if (saveError()) {
              <p class="error-msg" style="margin-top:0.75rem">{{ saveError() }}</p>
            }

            <div class="modal__footer">
              <button type="button" class="btn btn-outline" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving() || uploading()">
                {{ saving() ? 'Saving…' : (editingProduct() ? 'Update Product' : 'Add Product') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- ── Delete Confirmation Modal ─────────────────────── -->
    @if (deletingProduct()) {
      <div class="modal-overlay" (click)="deletingProduct.set(null)">
        <div class="modal modal--sm card" (click)="$event.stopPropagation()">
          <div class="modal__header">
            <h2>Delete Product</h2>
            <button class="modal__close" (click)="deletingProduct.set(null)">✕</button>
          </div>
          <div class="modal__body">
            <p>Are you sure you want to delete <strong>{{ deletingProduct()!.name }}</strong>?</p>
            <p class="muted" style="margin-top:0.5rem;font-size:0.85rem">This action cannot be undone.</p>
          </div>
          <div class="modal__footer">
            <button class="btn btn-outline" (click)="deletingProduct.set(null)">Cancel</button>
            <button class="btn btn-danger" (click)="deleteProduct()" [disabled]="saving()">
              {{ saving() ? 'Deleting…' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .admin-products { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-title { font-family: var(--font-heading); font-size: 1.8rem; }
    .loading-text { color: var(--color-muted); }

    .search-wrap { max-width: 360px; }
    .search-input { width: 100%; }

    /* Table */
    .table-card { overflow-x: auto; }
    .products-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; white-space: nowrap; }
    .products-table th {
      text-align: left; padding: 0.75rem 1.25rem;
      font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--color-muted); background: #fafafa;
      border-bottom: 1px solid var(--color-border);
    }
    .products-table td { padding: 0.9rem 1.25rem; border-bottom: 1px solid #f0f0f0; vertical-align: middle; }
    .products-table tr:last-child td { border-bottom: none; }
    .products-table tr:hover td { background: #fdf8f3; }

    .product-cell { display: flex; align-items: center; gap: 1rem; white-space: normal; min-width: 260px; }
    .product-thumb { width: 52px; height: 52px; object-fit: cover; border-radius: 6px; flex-shrink: 0; border: 1px solid var(--color-border); }
    .product-desc-preview { font-size: 0.78rem; color: var(--color-muted); margin-top: 0.15rem; white-space: normal; max-width: 280px; }

    .actions-cell { display: flex; gap: 0.5rem; }
    .action-btn { padding: 0.35rem 0.8rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; border: 1.5px solid; font-family: var(--font-body); transition: all 0.15s; }
    .edit-btn   { border-color: var(--color-primary); color: var(--color-primary); background: none; }
    .edit-btn:hover { background: var(--color-primary); color: #fff; }
    .delete-btn { border-color: var(--color-danger); color: var(--color-danger); background: none; }
    .delete-btn:hover { background: var(--color-danger); color: #fff; }

    .muted { color: var(--color-muted); }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.45);
      display: flex; align-items: center; justify-content: center;
      z-index: 500; padding: 1rem;
      animation: fadein 0.15s ease;
    }
    @keyframes fadein { from { opacity: 0; } }

    .modal {
      width: 100%; max-width: 560px;
      max-height: 90vh; overflow-y: auto;
      display: flex; flex-direction: column;
    }
    .modal--sm { max-width: 400px; }

    .modal__header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--color-border);
    }
    .modal__header h2 { font-family: var(--font-heading); font-size: 1.2rem; }
    .modal__close { background: none; border: none; font-size: 1.1rem; cursor: pointer; color: var(--color-muted); }
    .modal__close:hover { color: var(--color-text); }

    .modal__body { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.25rem; }

    .modal__footer {
      display: flex; justify-content: flex-end; gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--color-border);
      background: #fafafa;
    }

    .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 1rem; }
    @media (max-width: 480px) { .form-grid-2 { grid-template-columns: 1fr; } }

    .checkbox-label {
      display: flex; align-items: center; gap: 0.6rem;
      cursor: pointer; font-size: 0.875rem; margin-top: 0.25rem;
    }
    .checkbox-label input { width: auto; cursor: pointer; accent-color: var(--color-primary); }

    /* Image upload */
    .image-upload { display: flex; align-items: center; gap: 0.75rem; }
    .image-preview,
    .image-placeholder {
      width: 56px; height: 56px; border-radius: 6px; flex-shrink: 0;
      border: 1px solid var(--color-border); object-fit: cover;
    }
    .image-placeholder {
      display: flex; align-items: center; justify-content: center;
      font-size: 0.65rem; color: var(--color-muted); background: #fafafa; text-align: center;
    }
    .image-upload__controls { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .action-btn:disabled { opacity: 0.6; cursor: default; }
  `],
})
export class AdminProductsComponent implements OnInit {
  private api = inject(ApiService);
  private fb  = inject(FormBuilder);

  categories = CATEGORIES;
  loading    = signal(false);
  saving     = signal(false);
  saveError  = signal('');
  uploading   = signal(false);
  uploadError = signal('');
  searchQuery    = signal('');
  showModal      = signal(false);
  editingProduct = signal<Product | null>(null);
  deletingProduct = signal<Product | null>(null);
  private allProducts = signal<Product[]>([]);

  filtered = () => {
    const q = this.searchQuery().toLowerCase().trim();
    return q
      ? this.allProducts().filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
      : this.allProducts();
  };

  form = this.fb.group({
    name:           ['', Validators.required],
    description:    [''],
    price:          [null as number | null, [Validators.required, Validators.min(0)]],
    category:       ['', Validators.required],
    image_url:      [''],
    is_best_seller: [false],
  });

  ngOnInit(): void { this.loadProducts(); }

  loadProducts(): void {
    this.loading.set(true);
    this.api.getProducts().subscribe({
      next: (res) => { this.allProducts.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openAdd(): void {
    this.editingProduct.set(null);
    this.form.reset({ is_best_seller: false });
    this.saveError.set('');
    this.uploadError.set('');
    this.showModal.set(true);
  }

  openEdit(product: Product): void {
    this.editingProduct.set(product);
    this.form.setValue({
      name:           product.name,
      description:    product.description ?? '',
      price:          product.price,
      category:       product.category,
      image_url:      product.image_url ?? '',
      is_best_seller: !!product.is_best_seller,
    });
    this.saveError.set('');
    this.uploadError.set('');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingProduct.set(null);
    this.uploading.set(false);
    this.uploadError.set('');
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.uploadError.set('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.uploadError.set('Image must be 5 MB or smaller.');
      return;
    }

    this.uploadError.set('');
    this.uploading.set(true);
    this.api.uploadImage(file).subscribe({
      next: (res) => {
        this.form.patchValue({ image_url: res.url });
        this.uploading.set(false);
      },
      error: (err) => {
        this.uploadError.set(err?.error?.message || 'Failed to upload image.');
        this.uploading.set(false);
      },
    });
  }

  clearImage(): void {
    this.form.patchValue({ image_url: '' });
    this.uploadError.set('');
  }

  saveProduct(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.saving.set(true);
    this.saveError.set('');

    const raw = this.form.getRawValue();
    const payload: Partial<Product> = {
      name:           raw.name           ?? undefined,
      description:    raw.description    ?? undefined,
      price:          raw.price          ?? undefined,
      category:       raw.category       ?? undefined,
      image_url:      raw.image_url      ?? undefined,
      is_best_seller: raw.is_best_seller ? 1 : 0,
    };

    const editing = this.editingProduct();
    const req = editing
      ? this.api.updateProduct(editing.id, payload)
      : this.api.createProduct(payload);

    req.subscribe({
      next: (res) => {
        if (editing) {
          this.allProducts.update((list) => list.map((p) => (p.id === editing.id ? res.data : p)));
        } else {
          this.allProducts.update((list) => [res.data, ...list]);
        }
        this.saving.set(false);
        this.closeModal();
      },
      error: (err) => {
        this.saveError.set(err?.error?.message || 'Failed to save product.');
        this.saving.set(false);
      },
    });
  }

  confirmDelete(product: Product): void {
    this.deletingProduct.set(product);
  }

  deleteProduct(): void {
    const p = this.deletingProduct();
    if (!p) return;
    this.saving.set(true);
    this.api.deleteProduct(p.id).subscribe({
      next: () => {
        this.allProducts.update((list) => list.filter((x) => x.id !== p.id));
        this.deletingProduct.set(null);
        this.saving.set(false);
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to delete product.');
        this.saving.set(false);
      },
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
