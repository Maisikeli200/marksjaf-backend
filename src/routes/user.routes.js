const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// All user routes require authentication
router.use(authenticateToken);

// Profile routes
router.put('/profile', userController.updateProfile);

// Address routes
router.post('/addresses', userController.createAddress);
router.put('/addresses/:id', userController.updateAddress);

module.exports = router;
