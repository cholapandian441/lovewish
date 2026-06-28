import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="login-page">
      <div class="login-card card">
        <div class="login-brand">
          <h1>LoveWish</h1>
          <p>Admin Portal</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-group">
            <label>Username</label>
            <input formControlName="username" placeholder="admin" />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input formControlName="password" type="password" placeholder="••••••••" />
          </div>

          @if (errorMsg()) {
            <p class="error-msg">{{ errorMsg() }}</p>
          }

          <button type="submit" class="btn btn-primary full-btn" [disabled]="loading()">
            {{ loading() ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: calc(100vh - 64px);
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #fdf6ec, #fce8d0);
      padding: 2rem;
    }
    .login-card { width: 100%; max-width: 380px; padding: 2.5rem; }
    .login-brand { text-align: center; margin-bottom: 2rem; }
    .login-brand h1 { font-family: var(--font-heading); font-size: 2rem; color: var(--color-primary); }
    .login-brand p { color: var(--color-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; }
    .full-btn { width: 100%; justify-content: center; padding: 0.75rem; font-size: 1rem; margin-top: 0.5rem; }
  `],
})
export class AdminLoginComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private router = inject(Router);

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  loading = signal(false);
  errorMsg = signal('');

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMsg.set('');

    const { username, password } = this.form.getRawValue();

    this.api.adminLogin(username!, password!).subscribe({
      next: () => {
        // Auth + CSRF cookies are set by the server; nothing to persist here.
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err) => {
        this.errorMsg.set(err?.error?.message || 'Invalid credentials.');
        this.loading.set(false);
      },
    });
  }
}
