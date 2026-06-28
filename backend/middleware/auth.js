const jwt = require('jsonwebtoken');
const config = require('../config/config');

const TOKEN_COOKIE = 'lw_token';

// State-changing methods must carry a valid CSRF token. GET/HEAD/OPTIONS are
// safe and exempt.
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Authenticates admin requests using the httpOnly JWT cookie and enforces
 * CSRF protection (signed double-submit) on mutating requests.
 */
function authMiddleware(req, res, next) {
  const token = req.cookies && req.cookies[TOKEN_COOKIE];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. Please log in.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
  }

  // CSRF: the X-CSRF-Token header must match the value bound inside the JWT.
  // An attacker forging a cross-site request can ride the cookie but cannot
  // read the CSRF value to set the custom header, and the header forces a
  // CORS preflight that our allow-list blocks.
  if (!SAFE_METHODS.has(req.method)) {
    const headerToken = req.headers['x-csrf-token'];
    if (!headerToken || headerToken !== decoded.csrf) {
      return res.status(403).json({ success: false, message: 'Invalid or missing CSRF token.' });
    }
  }

  req.admin = decoded;
  next();
}

module.exports = authMiddleware;
