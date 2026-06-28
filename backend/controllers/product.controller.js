const { getDb } = require('../db/database');
const { isSafeImageUrl } = require('../utils/validators');

// Maximum accepted lengths for free-text product fields.
const LIMITS = { name: 200, description: 5000, category: 100 };

// ─── Helpers ────────────────────────────────────────────────

function validate(body, requiredFields) {
  const errors = [];
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      errors.push(`${field} is required.`);
    }
  }
  return errors;
}

/** Validate field lengths and image URL. Returns an array of error strings. */
function validateProductFields({ name, description, category, image_url }) {
  const errors = [];
  if (name !== undefined && String(name).trim().length > LIMITS.name) {
    errors.push(`name must be at most ${LIMITS.name} characters.`);
  }
  if (description != null && String(description).length > LIMITS.description) {
    errors.push(`description must be at most ${LIMITS.description} characters.`);
  }
  if (category !== undefined && String(category).trim().length > LIMITS.category) {
    errors.push(`category must be at most ${LIMITS.category} characters.`);
  }
  if (image_url != null && image_url !== '' && !isSafeImageUrl(image_url)) {
    errors.push('image_url must be a valid http(s) URL or an /uploads path.');
  }
  return errors;
}

// ─── Public Controllers ──────────────────────────────────────

/**
 * GET /api/products
 * Optional query: ?category=Bouquets
 */
function getAllProducts(req, res, next) {
  try {
    const db = getDb();
    const { category } = req.query;

    let products;
    if (category) {
      products = db
        .prepare('SELECT * FROM products WHERE LOWER(category) = LOWER(?) ORDER BY created_at DESC')
        .all(category);
    } else {
      products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
    }

    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/:id
 */
function getProductById(req, res, next) {
  try {
    const db = getDb();
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/category/:category
 */
function getProductsByCategory(req, res, next) {
  try {
    const db = getDb();
    const products = db
      .prepare('SELECT * FROM products WHERE LOWER(category) = LOWER(?) ORDER BY created_at DESC')
      .all(req.params.category);

    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
}

// ─── Admin Controllers ───────────────────────────────────────

/**
 * POST /api/products
 * Body: { name, description, price, category, image_url, is_best_seller }
 */
function createProduct(req, res, next) {
  try {
    const { name, description, price, category, image_url, is_best_seller } = req.body;

    const errors = validate(req.body, ['name', 'price', 'category']);
    errors.push(...validateProductFields(req.body));
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }

    if (isNaN(price) || Number(price) < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a non-negative number.' });
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO products (name, description, price, category, image_url, is_best_seller)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(),
      description?.trim() || null,
      Number(price),
      category.trim(),
      image_url?.trim() || null,
      is_best_seller ? 1 : 0
    );

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/products/:id
 * Body: any subset of product fields
 */
function updateProduct(req, res, next) {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const { name, description, price, category, image_url, is_best_seller } = req.body;

    if (price !== undefined && (isNaN(price) || Number(price) < 0)) {
      return res.status(400).json({ success: false, message: 'Price must be a non-negative number.' });
    }

    const fieldErrors = validateProductFields(req.body);
    if (fieldErrors.length) {
      return res.status(400).json({ success: false, message: fieldErrors.join(' ') });
    }

    // Merge with existing values so partial updates are safe
    const updated = {
      name:           name?.trim()         ?? existing.name,
      description:    description?.trim()  ?? existing.description,
      price:          price !== undefined  ? Number(price) : existing.price,
      category:       category?.trim()     ?? existing.category,
      image_url:      image_url?.trim()    ?? existing.image_url,
      is_best_seller: is_best_seller !== undefined ? (is_best_seller ? 1 : 0) : existing.is_best_seller,
    };

    db.prepare(`
      UPDATE products
      SET name = ?, description = ?, price = ?, category = ?, image_url = ?, is_best_seller = ?
      WHERE id = ?
    `).run(
      updated.name,
      updated.description,
      updated.price,
      updated.category,
      updated.image_url,
      updated.is_best_seller,
      req.params.id
    );

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/products/:id
 */
function deleteProduct(req, res, next) {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
};
