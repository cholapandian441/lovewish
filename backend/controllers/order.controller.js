const { getDb } = require('../db/database');
const { generateUniqueOrderNumber } = require('../utils/orderNumber');
const { isValidEmail, isValidPhone, isValidPincode } = require('../utils/validators');

const VALID_STATUSES = ['Placed', 'Confirmed', 'Packaging', 'Shipped', 'Delivered'];

// Max accepted lengths for customer-supplied order text fields.
const FIELD_MAX = {
  customer_name: 120,
  address: 500,
  city: 120,
  state: 120,
};
const MAX_ITEMS = 100;
const MAX_QTY = 1000;

// ─── Public Controllers ──────────────────────────────────────

/**
 * POST /api/orders
 * Body: { customer_name, phone, email, address, city, state, pincode, items: [{ product_id, quantity }] }
 *
 * - Prices are fetched server-side (never trusted from client)
 * - Entire operation runs in a transaction
 */
function createOrder(req, res, next) {
  try {
    const { customer_name, phone, email, address, city, state, pincode, items } = req.body;

    // ── Validate required fields ─────────────────────────────
    const required = { customer_name, phone, email, address, city, state, pincode };
    const missing = Object.entries(required)
      .filter(([, v]) => !v || String(v).trim() === '')
      .map(([k]) => k);

    if (missing.length) {
      return res.status(400).json({ success: false, message: `Missing required fields: ${missing.join(', ')}.` });
    }

    // ── Validate field formats and lengths ──────────────────
    const fieldErrors = [];
    for (const [field, max] of Object.entries(FIELD_MAX)) {
      if (String(required[field]).trim().length > max) {
        fieldErrors.push(`${field} must be at most ${max} characters.`);
      }
    }
    if (!isValidEmail(email)) fieldErrors.push('A valid email is required.');
    if (!isValidPhone(phone)) fieldErrors.push('A valid phone number is required.');
    if (!isValidPincode(pincode)) fieldErrors.push('A valid pincode is required.');
    if (fieldErrors.length) {
      return res.status(400).json({ success: false, message: fieldErrors.join(' ') });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item.' });
    }

    if (items.length > MAX_ITEMS) {
      return res.status(400).json({ success: false, message: `An order cannot contain more than ${MAX_ITEMS} line items.` });
    }

    for (const item of items) {
      if (
        !Number.isInteger(item.product_id) ||
        item.product_id < 1 ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > MAX_QTY
      ) {
        return res.status(400).json({
          success: false,
          message: `Each item must have an integer product_id and quantity between 1 and ${MAX_QTY}.`,
        });
      }
    }

    const db = getDb();

    // ── Run everything in a transaction ─────────────────────
    const insertOrder = db.transaction(() => {
      // Fetch product prices server-side and validate all products exist
      const resolvedItems = items.map((item) => {
        const product = db.prepare('SELECT id, name, price FROM products WHERE id = ?').get(item.product_id);
        if (!product) throw Object.assign(new Error(`Product with id ${item.product_id} not found.`), { status: 404 });
        return { ...item, price: product.price };
      });

      const total_amount = resolvedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      // Allocate an unguessable public reference (retries on the rare UNIQUE clash).
      const orderNumberExists = db.prepare('SELECT 1 FROM orders WHERE order_number = ?');
      const order_number = generateUniqueOrderNumber((num) => !!orderNumberExists.get(num));

      // Insert order
      const orderResult = db.prepare(`
        INSERT INTO orders (order_number, customer_name, phone, email, address, city, state, pincode, total_amount, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Placed')
      `).run(
        order_number,
        customer_name.trim(),
        phone.trim(),
        email.trim(),
        address.trim(),
        city.trim(),
        state.trim(),
        pincode.trim(),
        total_amount
      );

      const orderId = orderResult.lastInsertRowid;

      // Insert order items
      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, quantity, price)
        VALUES (?, ?, ?, ?)
      `);

      for (const item of resolvedItems) {
        insertItem.run(orderId, item.product_id, item.quantity, item.price);
      }

      return orderId;
    });

    const orderId = insertOrder();

    // Return the full order with items
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const orderItems = db.prepare(`
      SELECT oi.*, p.name AS product_name
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
    `).all(orderId);

    res.status(201).json({ success: true, data: { ...order, items: orderItems } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders/:orderNumber
 * Public order tracking — resolves by the unguessable order_number (never the
 * sequential primary key), so order references cannot be enumerated.
 */
function trackOrder(req, res, next) {
  try {
    const db = getDb();

    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(req.params.orderNumber);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const items = db.prepare(`
      SELECT oi.id, oi.quantity, oi.price, p.id AS product_id, p.name AS product_name, p.image_url
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ?
    `).all(order.id);

    res.json({ success: true, data: { ...order, items } });
  } catch (err) {
    next(err);
  }
}

// ─── Admin Controllers ───────────────────────────────────────

/**
 * GET /api/admin/orders
 * Optional query: ?status=Placed
 */
function getAllOrders(req, res, next) {
  try {
    const db = getDb();
    const { status } = req.query;

    let orders;
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}.` });
      }
      orders = db.prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC').all(status);
    } else {
      orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
    }

    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/orders/:id/status
 * Body: { status }
 */
function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'status is required.' });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}.`,
      });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id, status FROM orders WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder,
  trackOrder,
  getAllOrders,
  updateOrderStatus,
};
