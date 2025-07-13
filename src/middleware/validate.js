const { sanitizeEmail, sanitizeName, sanitizePhoneNumber } = require('./sanitization');

const validateRegistration = (req, res, next) => {
  let { firstName, lastName, email, phoneNumber, password } = req.body;
  
  // Sanitize inputs
  firstName = sanitizeName(firstName);
  lastName = sanitizeName(lastName);
  email = sanitizeEmail(email);
  phoneNumber = sanitizePhoneNumber(phoneNumber);
  
  // Update request body with sanitized values
  req.body = { firstName, lastName, email, phoneNumber, password };
  
  // Check if all required fields are present
  if (!firstName || !lastName || !email || !phoneNumber || !password) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }
  
  // Validate phone number format
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone number format'
    });
  }
  
  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long'
    });
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must contain at least one number'
    });
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must contain at least one uppercase letter'
    });
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must contain at least one special character'
    });
  }
  
  next();
};

const validateLogin = (req, res, next) => {
  let { email, password } = req.body;
  
  // Sanitize email
  email = sanitizeEmail(email);
  req.body.email = email;
  
  // Check if all required fields are present
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }
  
  next();
};

const validatePasswordReset = (req, res, next) => {
  const { token, newPassword } = req.body;
  
  // Check if all required fields are present
  if (!token || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Token and new password are required'
    });
  }
  
  // Validate password strength
  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long'
    });
  }
  
  // Check for at least one number
  if (!/\d/.test(newPassword)) {
    return res.status(400).json({
      success: false,
      message: 'Password must contain at least one number'
    });
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(newPassword)) {
    return res.status(400).json({
      success: false,
      message: 'Password must contain at least one uppercase letter'
    });
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
    return res.status(400).json({
      success: false,
      message: 'Password must contain at least one special character'
    });
  }
  
  next();
};

// Add this validation function to your existing validate.js file
const validateContactForm = (req, res, next) => {
  const { name, email, message } = req.body;
  const errors = [];

  // Validate name
  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  if (name && name.length > 100) {
    errors.push('Name must be less than 100 characters');
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Please provide a valid email address');
  }

  // Validate message
  if (!message || message.trim().length < 10) {
    errors.push('Message must be at least 10 characters long');
  }
  if (message && message.length > 1000) {
    errors.push('Message must be less than 1000 characters');
  }

  // Validate phone (optional)
  if (req.body.phone) {
    const phoneRegex = /^[+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(req.body.phone)) {
      errors.push('Please provide a valid phone number');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validatePasswordReset,
  validateContactForm
};