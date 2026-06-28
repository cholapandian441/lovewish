const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getDb } = require('../db/database');
const config = require('../config/config');

const TOKEN_COOKIE = 'lw_token';
const CSRF_COOKIE = 'lw_csrf';
const SESSION_SECONDS = 8 * 60 * 60; // 8 hours

// httpOnly cookie holding the JWT — not readable by JavaScript, so an XSS bug
// cannot exfiltrate the session token.
function tokenCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd, // require HTTPS in production
    path: '/',
    maxAge: SESSION_SECONDS * 1000,
  };
}

// Readable companion cookie for the double-submit CSRF defence. The SPA reads
// this and echoes it back in the X-CSRF-Token header on state-changing calls.
function csrfCookieOptions() {
  return {
    httpOnly: false,
    sameSite: 'lax',
    secure: config.isProd,
    path: '/',
    maxAge: SESSION_SECONDS * 1000,
  };
}

/**
 * POST /api/admin/login
 * Body: { username, password }
 * On success sets the auth + CSRF cookies; the token is never returned in the body.
 */
function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const db = getDb();
    const admin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);

    // Generic message either way to avoid revealing whether the username exists.
    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // CSRF token is bound into the signed JWT, so the server's check does not
    // rely on the (client-settable) cookie alone.
    const csrfToken = crypto.randomBytes(32).toString('hex');

    const token = jwt.sign(
      { id: admin.id, username: admin.username, csrf: csrfToken },
      config.jwtSecret,
      { expiresIn: SESSION_SECONDS }
    );

    res.cookie(TOKEN_COOKIE, token, tokenCookieOptions());
    res.cookie(CSRF_COOKIE, csrfToken, csrfCookieOptions());

    res.json({
      success: true,
      admin: { id: admin.id, username: admin.username },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/logout
 * Clears the auth + CSRF cookies. Safe to call even without a valid session.
 */
function logout(req, res) {
  res.clearCookie(TOKEN_COOKIE, { ...tokenCookieOptions(), maxAge: undefined });
  res.clearCookie(CSRF_COOKIE, { ...csrfCookieOptions(), maxAge: undefined });
  res.json({ success: true });
}

/**
 * GET /api/admin/me  (protected)
 * Returns the current admin — used by the SPA to confirm an active session.
 */
function me(req, res) {
  res.json({ success: true, admin: { id: req.admin.id, username: req.admin.username } });
}

module.exports = { login, logout, me, TOKEN_COOKIE, CSRF_COOKIE };
