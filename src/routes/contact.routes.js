const express = require('express');
const contactController = require('../controllers/contact.controller');
const { validateContactForm } = require('../middleware/validate');
const { rateLimitContact } = require('../middleware/rate-limit');

const router = express.Router();

// Send contact message
router.post('/send-message', 
  rateLimitContact,
  validateContactForm,
  contactController.sendContactMessage
);

// Get WhatsApp contact info
router.get('/whatsapp', contactController.getWhatsAppInfo);

// Generate WhatsApp link with custom message
router.post('/whatsapp/generate-link', contactController.generateWhatsAppLink);

module.exports = router;