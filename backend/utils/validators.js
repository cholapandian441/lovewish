// Shared input-validation helpers. Defence-in-depth: even though the DB uses
// parameterized queries (no SQL injection) and the SPA sanitizes output, we
// reject malformed / oversized / dangerous input at the edge.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-\s()]{7,20}$/;
const PINCODE_RE = /^[A-Za-z0-9\s-]{3,12}$/;

/** Coerce to a trimmed string; non-strings become ''. */
function str(v) {
  return typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim();
}

/** True if `v` is a string within [1, max] chars after trimming. */
function isNonEmptyString(v, max) {
  const s = str(v);
  return s.length >= 1 && s.length <= max;
}

function isValidEmail(v) {
  const s = str(v);
  return s.length <= 254 && EMAIL_RE.test(s);
}

function isValidPhone(v) {
  return PHONE_RE.test(str(v));
}

function isValidPincode(v) {
  return PINCODE_RE.test(str(v));
}

/**
 * Accept only http(s) URLs or site-relative paths for stored image URLs.
 * Blocks javascript:, data:, vbscript:, etc. that could become stored XSS.
 */
function isSafeImageUrl(v) {
  const s = str(v);
  if (s === '') return true; // optional
  if (s.length > 2048) return false;
  if (s.startsWith('/uploads/') || s.startsWith('/')) return true;
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

module.exports = {
  str,
  isNonEmptyString,
  isValidEmail,
  isValidPhone,
  isValidPincode,
  isSafeImageUrl,
};
