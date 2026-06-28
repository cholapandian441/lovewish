const express = require('express');
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'LoveWish API is running.' });
});

router.use('/products',     require('./product.routes'));
router.use('/upload',       require('./upload.routes'));
router.use('/orders',       require('./order.routes'));
router.use('/admin',        require('./auth.routes'));   // POST /api/admin/login (public)
router.use('/admin',        require('./admin.routes'));  // All other /api/admin/* (JWT protected)

module.exports = router;
