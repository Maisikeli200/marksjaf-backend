const express = require('express');
const { 
  initializeConsultancy, 
  consultancyWebhook, 
  getUserBookings, 
  getBookingDetails,
  verifyPayment
} = require('../controllers/consultancy.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

// Initialize consultancy booking with payment
router.post('/initialize', authenticateToken, initializeConsultancy);

// Paystack webhook for consultancy payments
router.post('/webhook', consultancyWebhook);

// Verify payment manually
router.get('/verify-payment', authenticateToken, verifyPayment);

// Get user's bookings
router.get('/bookings', authenticateToken, getUserBookings);

// Get specific booking details
router.get('/bookings/:id', authenticateToken, getBookingDetails);

module.exports = router;
