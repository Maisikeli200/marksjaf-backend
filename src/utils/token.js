const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const generateAuthToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };
  
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = {
  generateVerificationToken,
  generateAuthToken
};