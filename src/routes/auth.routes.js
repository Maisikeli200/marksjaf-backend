const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateRegistration, validateLogin, validatePasswordReset } = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth.middleware');
const { 
  authRateLimit, 
  generalAuthRateLimit, 
  speedLimiter, 
  passwordResetRateLimit 
} = require('../middleware/rate-limit');

// Apply speed limiter to all auth routes
router.use(speedLimiter);

// Auth routes with strict rate limiting
router.post('/register', authRateLimit, validateRegistration, authController.register);
router.post('/login', authRateLimit, validateLogin, authController.login);
router.post('/forgot-password', passwordResetRateLimit, authController.requestPasswordReset);
router.post('/reset-password', passwordResetRateLimit, validatePasswordReset, authController.resetPassword);

// General auth operations with moderate rate limiting
router.get('/verify-email/:token', generalAuthRateLimit, authController.verifyEmail);
router.post('/resend-verification', generalAuthRateLimit, authController.resendVerification);
router.post('/change-email', generalAuthRateLimit, authController.changeEmail);

// Token operations (less restrictive)
router.get('/validate-token', authenticateToken, authController.validateToken);
router.get('/me', authenticateToken, authController.getCurrentUser);
router.put('/profile', authenticateToken, authController.updateProfile);

// REMOVED: refresh token endpoint
// router.post('/refresh-token', generalAuthRateLimit, authController.refreshToken);

module.exports = router;