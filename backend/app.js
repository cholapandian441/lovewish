require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const config = require('./config/config');
const { initDb } = require('./db/database');
const routes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Required so express-rate-limit and req.protocol work correctly behind a
// reverse proxy (nginx, load balancer). Trust only the first hop.
app.set('trust proxy', 1);

// Never advertise the framework/version to attackers.
app.disable('x-powered-by');

// --- Security headers (CSP, HSTS, nosniff, frameguard, etc.) ---
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);

// --- CORS: only the explicitly allow-listed origins ---
// credentials:true is required so the browser sends the auth cookie. This is
// only safe because the origin is a strict allow-list (never '*').
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
    maxAge: 600,
  })
);

// --- Body & cookie parsing (explicit, conservative body size limit) ---
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// --- Rate limiting ---
// Global limiter: blunt protection against scraping / DoS on every endpoint.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api', globalLimiter);

// Strict limiter for the admin login endpoint to throttle brute-force attempts.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only failed attempts count toward the cap
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
});
app.use('/api/admin/login', loginLimiter);

// --- Static: uploaded product images ---
// dotfiles denied; no directory index; long cache for immutable hashed names.
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    dotfiles: 'deny',
    index: false,
    maxAge: '7d',
    setHeaders: (res) => {
      // Force download semantics rather than inline rendering, and block sniffing,
      // so a crafted upload can never execute as script in the browser.
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'");
    },
  })
);

// --- Database ---
initDb();

// --- Routes ---
app.use('/api', routes);

// --- Frontend (production) ---
// Serve the Angular build. express.static handles hashed assets (JS/CSS) with
// a 1-year cache; the catch-all below serves index.html for SPA deep-links.
// In dev this folder won't exist and express.static is a no-op.
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist', 'lovewish', 'browser');
app.use(express.static(frontendDist, { maxAge: '1y', index: false, dotfiles: 'deny' }));

// SPA catch-all: skip /api/* so unmatched API paths still reach the JSON 404 below.
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// --- 404 Handler (API routes only at this point) ---
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// --- Global Error Handler ---
app.use(errorHandler);

// --- Start Server ---
app.listen(config.port, () => {
  console.log(`LoveWish API running on http://localhost:${config.port}`);
});

module.exports = app;
