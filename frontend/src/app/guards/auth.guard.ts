import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getCookie, CSRF_COOKIE } from '../utils/cookie';

/**
 * Client-side routing guard. The httpOnly auth cookie is invisible to JS, so we
 * use the readable CSRF companion cookie as a "logged-in" hint for navigation.
 * This is NOT a security boundary — every admin API call is independently
 * verified by the backend — it only avoids flashing protected screens.
 */
export const authGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (!getCookie(CSRF_COOKIE)) {
    router.navigate(['/admin/login']);
    return false;
  }
  return true;
};
