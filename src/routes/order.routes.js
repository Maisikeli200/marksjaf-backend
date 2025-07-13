const express = require('express');
const { initializeOrder, paystackWebhook, verifyPayment, getOrder, getUserOrders, cancelOrder } = require('../controllers/order.controller')
const { authenticateToken } = require('../middleware/auth.middleware');
const { generalAuthRateLimit } = require('../middleware/rate-limit')

const router = express.Router();

// Get all orders for authenticated user
router.get('/', authenticateToken, getUserOrders)

// Initialize order and Paystack payment
// Apply rate limiting to payment endpoints
router.post('/initialize', generalAuthRateLimit, authenticateToken, initializeOrder)
router.get('/verify/:reference', generalAuthRateLimit, authenticateToken, verifyPayment)

// Paystack webhook (no auth required)
router.post('/webhook/paystack', paystackWebhook);

// Verify payment manually
router.get('/verify/:reference', authenticateToken, verifyPayment);

// Get order details
router.get('/:id', authenticateToken, getOrder);

// Cancel order (only for pending orders)
router.put('/:id/cancel', authenticateToken, cancelOrder);

module.exports = router;