const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getAllOrders, updateOrderStatus } = require('../controllers/order.controller');

// All admin routes are JWT protected
router.use(auth);

router.get('/orders',              getAllOrders);       // List all orders (optional ?status=)
router.put('/orders/:id/status',   updateOrderStatus); // Update order status

module.exports = router;
