const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// Strict rate limiting for auth endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: true,
  // Custom key generator to include user agent
  keyGenerator: (req) => {
    return req.ip + ':' + (req.get('User-Agent') || '');
  }
});

// More lenient rate limiting for general auth operations
const generalAuthRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Progressive delay for repeated requests - FIXED
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 2, // Allow 2 requests per windowMs without delay
  delayMs: () => 500, // Fixed: Use function syntax for express-slow-down v2
  maxDelayMs: 20000, // Maximum delay of 20 seconds
});

// Specific rate limit for password reset
const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 password reset attempts per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again in an hour.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Add this rate limiter to your existing rate-limit.js file
const rateLimitContact = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 contact form submissions per windowMs
  message: {
    success: false,
    message: 'Too many contact form submissions. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  authRateLimit,
  generalAuthRateLimit,
  speedLimiter,
  passwordResetRateLimit,
  rateLimitContact
};