import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast-container" aria-live="polite">
      @for (toast of toastSvc.toasts(); track toast.id) {
        <div class="toast" [class]="'toast--' + toast.type">
          <span class="toast__icon">
            @switch (toast.type) {
              @case ('success') { ✓ }
              @case ('error')   { ✕ }
              @default           { ℹ }
            }
          </span>
          <span class="toast__msg">{{ toast.message }}</span>
          <button class="toast__close" (click)="toastSvc.dismiss(toast.id)">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      max-width: 360px;
      width: calc(100vw - 3rem);
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.8rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      animation: slideup 0.22s ease;
      color: #fff;
    }
    @keyframes slideup {
      from { opacity: 0; transform: translateY(12px); }
    }

    .toast--success { background: #2e7d32; }
    .toast--error   { background: #c62828; }
    .toast--info    { background: #1565c0; }

    .toast__icon {
      font-size: 1rem;
      width: 20px;
      text-align: center;
      flex-shrink: 0;
      font-weight: 700;
    }

    .toast__msg { flex: 1; line-height: 1.4; }

    .toast__close {
      background: none;
      border: none;
      color: rgba(255,255,255,0.7);
      cursor: pointer;
      font-size: 0.8rem;
      padding: 0;
      flex-shrink: 0;
    }
    .toast__close:hover { color: #fff; }
  `],
})
export class ToastComponent {
  readonly toastSvc = inject(ToastService);
}
