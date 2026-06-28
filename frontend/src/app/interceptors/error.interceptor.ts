import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { getCookie, CSRF_COOKIE } from '../utils/cookie';

/**
 * Global HTTP error handler:
 * - 401 / 403  → clear token, redirect to admin login
 * - 0          → network / CORS error
 * - 5xx        → server error
 * All errors are re-thrown so individual components can still react.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toast  = inject(ToastService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      switch (true) {
        case err.status === 401:
        case err.status === 403:
          // Any auth/CSRF failure on an authenticated call (admin orders,
          // product create/update/delete, image upload) means the session is
          // invalid. The login call is excluded so bad credentials don't
          // trigger a redirect loop. The httpOnly cookie is cleared by the
          // backend; we only handle client-side navigation here.
          if (!req.url.includes('/admin/login') && getCookie(CSRF_COOKIE)) {
            router.navigate(['/admin/login']);
            toast.error('Session expired. Please log in again.');
          }
          break;

        case err.status === 0:
          toast.error('Cannot reach the server. Check your connection.');
          break;

        case err.status >= 500:
          toast.error('Server error. Please try again later.');
          break;

        case err.status === 404:
          // 404s are expected (e.g. order not found) — let components handle silently
          break;
      }

      return throwError(() => err);
    })
  );
};
