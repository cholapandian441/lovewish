import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { getCookie, CSRF_COOKIE } from '../utils/cookie';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * For calls to our own backend:
 *  - send credentials so the httpOnly auth cookie is included, and
 *  - attach the X-CSRF-Token header (from the readable CSRF cookie) on
 *    state-changing requests, satisfying the server's double-submit check.
 *
 * The auth token itself lives only in an httpOnly cookie, so it is never
 * accessible to JavaScript and cannot be stolen via XSS.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const setHeaders: Record<string, string> = {};
  if (!SAFE_METHODS.has(req.method.toUpperCase())) {
    const csrf = getCookie(CSRF_COOKIE);
    if (csrf) setHeaders['X-CSRF-Token'] = csrf;
  }

  return next(
    req.clone({
      withCredentials: true,
      setHeaders,
    })
  );
};
