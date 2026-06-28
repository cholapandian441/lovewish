const express = require('express');
const router = express.Router();
const { createOrder, trackOrder } = require('../controllers/order.controller');

// ─── Public ──────────────────────────────────────────────────
router.post('/',                createOrder);  // Place a new order
router.get('/:orderNumber',     trackOrder);   // Track order by its unguessable reference

module.exports = router;
