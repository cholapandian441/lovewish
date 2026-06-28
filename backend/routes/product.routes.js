const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/product.controller');

// ─── Public ──────────────────────────────────────────────────
router.get('/',                      getAllProducts);
router.get('/category/:category',    getProductsByCategory); // must be before /:id
router.get('/:id',                   getProductById);

// ─── Admin (JWT protected) ───────────────────────────────────
router.post('/',       auth, createProduct);
router.put('/:id',     auth, updateProduct);
router.delete('/:id',  auth, deleteProduct);

module.exports = router;
