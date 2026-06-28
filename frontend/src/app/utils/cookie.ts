/** Read a non-httpOnly cookie value by name, or null if absent. */
export function getCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)')
  );
  return match ? decodeURIComponent(match[1]) : null;
}

/** The readable CSRF companion cookie set by the backend on login. */
export const CSRF_COOKIE = 'lw_csrf';
