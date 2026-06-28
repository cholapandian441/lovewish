-- ============================================================
-- LoveWish — SQLite Schema
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------
-- Products
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT    NOT NULL,
  description    TEXT,
  price          REAL    NOT NULL CHECK(price >= 0),
  category       TEXT    NOT NULL,
  image_url      TEXT,
  is_best_seller INTEGER NOT NULL DEFAULT 0 CHECK(is_best_seller IN (0, 1)),
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Orders
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number  TEXT    NOT NULL UNIQUE,   -- unguessable public reference (e.g. LW-7F3KQ9XP2M)
  customer_name TEXT    NOT NULL,
  phone         TEXT    NOT NULL,
  email         TEXT    NOT NULL,
  address       TEXT    NOT NULL,
  city          TEXT    NOT NULL,
  state         TEXT    NOT NULL,
  pincode       TEXT    NOT NULL,
  total_amount  REAL    NOT NULL CHECK(total_amount >= 0),
  status        TEXT    NOT NULL DEFAULT 'Placed'
                        CHECK(status IN ('Placed', 'Confirmed', 'Packaging', 'Shipped', 'Delivered')),
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Order Items
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER NOT NULL,
  product_id  INTEGER NOT NULL,
  quantity    INTEGER NOT NULL CHECK(quantity > 0),
  price       REAL    NOT NULL CHECK(price >= 0),
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- Admin Users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_users (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  username  TEXT NOT NULL UNIQUE,
  password  TEXT NOT NULL          -- bcrypt hashed
);
