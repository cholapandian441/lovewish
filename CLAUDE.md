# LoveWish — Claude Code Guide

## Project

Full-stack e-commerce app for a handmade gift store.  
**Frontend**: Angular 21 (standalone, signals) · **Backend**: Express + SQLite · **Auth**: JWT + CSRF double-submit

---

## Dev Commands

```bash
# Backend (port 3000)
cd backend && npm run dev        # nodemon auto-restart
cd backend && npm run seed       # create initial admin user (run once)

# Frontend (port 4200)
cd frontend && npm start         # ng serve + proxy to :3000

# Production build
cd frontend && npm run build     # outputs to frontend/dist/lovewish
cd backend && npm start          # node app.js
```

Frontend dev proxy: `/api/*` and `/uploads/*` → `http://localhost:3000`

---

## Architecture

```
lovewish/
├── frontend/src/app/
│   ├── pages/          # Route-level components (home, product-list, product-detail,
│   │                   #   cart, checkout, order-tracking, admin-*)
│   ├── components/     # product-card, spinner, toast
│   ├── services/       # api.service.ts, cart.service.ts, toast.service.ts
│   ├── guards/         # auth.guard.ts (CSRF cookie presence check)
│   ├── interceptors/   # auth.interceptor.ts, error.interceptor.ts
│   ├── models/         # TypeScript interfaces
│   └── utils/          # cookie helpers
├── backend/
│   ├── app.js          # Express entry, middleware stack
│   ├── config/config.js
│   ├── db/database.js  # SQLite init, schema, migrations
│   ├── db/seed.js
│   ├── routes/         # index.js aggregator + *.routes.js per domain
│   ├── controllers/    # product, order, auth, upload
│   ├── middleware/     # auth.js (JWT+CSRF), errorHandler.js
│   └── utils/          # validators.js, orderNumber.js
```

---

## Database Schema (SQLite)

```sql
products(id, name, description, price REAL, category TEXT, image_url, is_best_seller INTEGER, created_at)
orders(id, order_number TEXT UNIQUE, customer_name, phone, email, address, city, state, pincode,
       total_amount REAL, status TEXT CHECK('Placed'|'Confirmed'|'Packaging'|'Shipped'|'Delivered'), created_at)
order_items(id, order_id→orders, product_id→products, quantity INTEGER, price REAL)
admin_users(id, username TEXT UNIQUE, password TEXT)
```

Pragmas: `journal_mode=WAL`, `foreign_keys=ON`  
Migrations in `database.js` are idempotent column additions — safe to re-run.

---

## API Routes

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | /api/products | — | `?category=` filter |
| GET | /api/products/:id | — | |
| GET | /api/products/category/:cat | — | |
| POST | /api/products | JWT | Admin |
| PUT | /api/products/:id | JWT | Partial update |
| DELETE | /api/products/:id | JWT | |
| POST | /api/orders | — | Prices resolved server-side |
| GET | /api/orders/:orderNumber | — | Track by unguessable ref |
| GET | /api/admin/orders | JWT | `?status=` filter |
| PUT | /api/admin/orders/:id/status | JWT | |
| POST | /api/admin/login | — | Rate-limited (10/15 min) |
| POST | /api/admin/logout | — | |
| GET | /api/admin/me | JWT | Session check |
| POST | /api/upload | JWT | Multipart image |
| GET | /api/health | — | |

All responses: `{ success: boolean, data?: T, message?: string }`

---

## State Management (Frontend)

- **Angular Signals only** — no Redux/Zustand/NgRx
- `CartService`: signals for items, count, total, isEmpty + localStorage persistence
- `ToastService`: notification queue with auto-dismiss
- Component-level signals for UI state (loading, modals, filters)
- Use `computed()` for derived state, never recalculate in templates

---

## Critical Security Patterns — Do Not Break

### 1. JWT + CSRF Double-Submit
- Login sets two cookies: `jwt` (httpOnly) + `csrf_token` (readable)
- Auth interceptor reads CSRF cookie → sends as `X-CSRF-Token` header
- `middleware/auth.js` validates JWT signature AND that embedded CSRF matches header
- **Do not** make CSRF cookie httpOnly — frontend must read it

### 2. Order Price Integrity
- `createOrder()` fetches prices from DB for each product_id — **never trust client prices**
- Full order insert runs in a single SQLite transaction
- Client cart items contain only `product_id` + `quantity`

### 3. Image Upload Safety
- Extension derived from validated MIME type, not client filename
- Whitelist: JPEG, PNG, WEBP, GIF only
- Filenames are crypto-random; stored under `/uploads/`
- `/uploads/` responses include `Content-Security-Policy: default-src 'none'`

### 4. Order Number Format
- `utils/orderNumber.js` — Crockford base32, crypto-random, ~5.9e14 combinations
- Format: `LW-XXXXXXXXXX` (10 chars, excludes 0/O/1/I/L ambiguity)
- Never expose sequential `orders.id` to customers

### 5. Auth Security
- bcryptjs, 12 rounds; `compareSync` for constant-time comparison
- Error messages always say "Invalid credentials" (no username enumeration)
- Rate limit: 10 login attempts per 15 min per IP

---

## Frontend Conventions

- **All components are standalone** — no NgModule, no module imports
- Use `inject()` for DI, not constructor parameters
- Template control flow: `@if`, `@for`, `@switch` (not `*ngIf`, `*ngFor`)
- Lifecycle: `implements OnInit` + `ngOnInit()` for async data fetch
- Services: `providedIn: 'root'` (no explicit provider arrays)

### TypeScript Config (strict)
```
strict: true, noImplicitOverride, noPropertyAccessFromIndexSignature,
noImplicitReturns, noFallthroughCasesInSwitch, noImplicitAny
```
Target: ES2022, moduleResolution: "bundler"

---

## Backend Conventions

- Controllers export named functions, imported in route files
- Route files import controller functions + middleware, no logic inside
- Input validation via `utils/validators.js` — always validate at controller entry
- Error responses always go through `errorHandler.js` middleware
- Use `better-sqlite3` synchronous API — no async/await for DB calls

### Validation Helpers (validators.js)
```js
isValidEmail(v)     // /^[^\s@]+@[^\s@]+\.[^\s@]+$/
isValidPhone(v)     // /^[0-9+\-\s()]{7,20}$/
isValidPincode(v)   // /^[A-Za-z0-9\s-]{3,12}$/
isValidImageUrl(v)  // http(s), /uploads/, or site-relative only
```

---

## Environment Variables (backend/.env)

```
PORT=3000
NODE_ENV=development|production
JWT_SECRET=<>=32 chars, required>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<>=12 chars in prod>
CORS_ORIGINS=http://localhost:4200
```

Config fails fast if `JWT_SECRET` is missing or < 32 chars.

---

## No Tests

No test suite exists. Type-check with `npx tsc --noEmit` in `frontend/`.

---

## Deployment Notes

- SQLite DB file + `/uploads/` folder must persist across deploys (not serverless-friendly)
- Run `npm run seed` once after first deploy to create admin account
- Set `NODE_ENV=production` — enforces strong password check and disables verbose errors
- CORS_ORIGINS must include the production frontend URL
- Serve `frontend/dist/lovewish/browser/` as static files from the Express server (already wired in `app.js`)
