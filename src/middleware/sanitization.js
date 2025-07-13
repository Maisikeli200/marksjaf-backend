const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Comprehensive input sanitization middleware for PostgreSQL
const sanitizeInput = (req, res, next) => {
  // Recursively sanitize all string values in request body
  const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
      // Remove HTML tags and potential XSS
      let sanitized = purify.sanitize(obj, { ALLOWED_TAGS: [] });
      sanitized = sanitized.replace(/[';"\\]/g, '');
      
      return sanitized.trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize the key as well - only allow alphanumeric and underscore
        const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '');
        if (sanitizedKey) { // Only add if key is not empty after sanitization
          sanitized[sanitizedKey] = sanitizeObject(value);
        }
      }
      return sanitized;
    }
    
    return obj;
  };
  
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};

// Specific sanitization for different data types
const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return email;
  return email.toLowerCase().trim().replace(/[^a-zA-Z0-9@._-]/g, '');
};

const sanitizeName = (name) => {
  if (typeof name !== 'string') return name;
  // Allow only letters, spaces, hyphens, and apostrophes
  return name.replace(/[^a-zA-Z\s\-']/g, '').trim();
};

const sanitizePhoneNumber = (phone) => {
  if (typeof phone !== 'string') return phone;
  // Remove all non-digit characters except + at the beginning
  return phone.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
};

// PostgreSQL-specific input validation
const validateSQLInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // List of dangerous SQL keywords to check for
  const dangerousPatterns = [
    /\b(DROP|DELETE|TRUNCATE|ALTER|CREATE|INSERT|UPDATE)\b/gi,
    /\b(UNION|SELECT|FROM|WHERE|OR|AND)\b.*\b(SELECT|FROM|WHERE)\b/gi,
    /[';"]/g,
    /--/g,
    /\/\*/g,
    /\*\//g
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(input)) {
      throw new Error('Invalid input detected');
    }
  }
  
  return input;
};

module.exports = {
  sanitizeInput,
  sanitizeEmail,
  sanitizeName,
  sanitizePhoneNumber,
  validateSQLInput
};