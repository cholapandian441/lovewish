const Database = require('better-sqlite3');
const path = require('path');
const config = require('../config/config');
const { generateOrderNumber } = require('../utils/orderNumber');

const dbPath = path.resolve(__dirname, '../', config.dbPath);

let db;

function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL'); // Better concurrent read performance
    db.pragma('foreign_keys = ON');  // Enforce referential integrity
  }
  return db;
}

function initDb() {
  const db = getDb();

  db.exec(`
    -- Products
    CREATE TABLE IF NOT EXISTS products (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      description   TEXT,
      price         REAL    NOT NULL CHECK(price >= 0),
      category      TEXT    NOT NULL,
      image_url     TEXT,
      is_best_seller INTEGER NOT NULL DEFAULT 0 CHECK(is_best_seller IN (0, 1)),
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Orders
    CREATE TABLE IF NOT EXISTS orders (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number  TEXT    UNIQUE,
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

    -- Order Items
    CREATE TABLE IF NOT EXISTS order_items (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id    INTEGER NOT NULL,
      product_id  INTEGER NOT NULL,
      quantity    INTEGER NOT NULL CHECK(quantity > 0),
      price       REAL    NOT NULL CHECK(price >= 0),
      FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    );

    -- Admin Users
    CREATE TABLE IF NOT EXISTS admin_users (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      username  TEXT NOT NULL UNIQUE,
      password  TEXT NOT NULL
    );
  `);

  runMigrations(db);

  console.log('Database initialized successfully.');
}

/**
 * Idempotent schema migrations for databases created before a column existed.
 * Each block guards itself with a check, so it is safe to run on every startup.
 */
function runMigrations(db) {
  const orderCols = db.prepare('PRAGMA table_info(orders)').all();
  const hasOrderNumber = orderCols.some((c) => c.name === 'order_number');

  if (!hasOrderNumber) {
    // SQLite can't add a UNIQUE column inline, so add the column then index it.
    db.exec('ALTER TABLE orders ADD COLUMN order_number TEXT');

    // Backfill existing rows with unguessable references.
    const rows = db.prepare('SELECT id FROM orders WHERE order_number IS NULL').all();
    const setNumber = db.prepare('UPDATE orders SET order_number = ? WHERE id = ?');
    const used = new Set();
    const backfill = db.transaction(() => {
      for (const { id } of rows) {
        let num = generateOrderNumber();
        while (used.has(num)) num = generateOrderNumber();
        used.add(num);
        setNumber.run(num, id);
      }
    });
    backfill();

    console.log(`Migration: added orders.order_number and backfilled ${rows.length} order(s).`);
  }

  // Enforce uniqueness (no-op if it already exists).
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number)');
}

module.exports = { getDb, initDb };
