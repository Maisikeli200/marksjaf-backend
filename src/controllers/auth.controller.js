const authService = require('../services/auth.service');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phoneNumber, password } = req.body;
    
    const result = await authService.registerUser({
      firstName,
      lastName,
      email,
      phoneNumber,
      password
    });
    
    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.'
    });
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(409).json({
        success: false,
        message: 'Email already in use'
      });
    } else if (error.message === 'Email already in use') {
      return res.status(409).json({
        success: false,
        message: 'Email already in use'
      });
    } else if (error.message.includes('Failed to send verification email')) {
      return res.status(500).json({
        success: false,
        message: 'Registration failed due to email delivery issues. Please try again later.'
      });
    }
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    const result = await authService.verifyEmail(token);
    
    return res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    if (error.message === 'Token expired') {
      return res.status(400).json({
        success: false,
        message: 'Verification link has expired',
        reason: 'expired'
      });
    } else if (error.message === 'Invalid token') {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification link',
        reason: 'invalid'
      });
    }
    next(error);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    await authService.resendVerificationEmail(email);
    
    return res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    } else if (error.message === 'Email already verified') {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }
    next(error);
  }
};

const changeEmail = async (req, res, next) => {
  try {
    const { oldEmail, newEmail } = req.body;
    
    if (!oldEmail || !newEmail) {
      return res.status(400).json({
        success: false,
        message: 'Both old and new email addresses are required'
      });
    }
    
    await authService.changeEmail(oldEmail, newEmail);
    
    return res.status(200).json({
      success: true,
      message: 'Email changed successfully. Please verify your new email.'
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    } else if (error.message === 'Email already in use') {
      return res.status(409).json({
        success: false,
        message: 'This email is already in use by another account'
      });
    }
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    const result = await authService.loginUser(email, password);
    
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    if (error.message === 'Invalid email or password') {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    } else if (error.message === 'Account is disabled. Please contact support.') {
      return res.status(403).json({
        success: false,
        message: 'Account is disabled. Please contact support.'
      });
    } else if (error.message.includes('Please verify your email')) {
      return res.status(403).json({
        success: false,
        message: error.message,
        requiresVerification: true
      });
    }
    next(error);
  }
};

const requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    await authService.requestPasswordReset(email);
    
    // Always return success even if email doesn't exist (for security)
    return res.status(200).json({
      success: true,
      message: 'If your email exists in our system, you will receive a password reset link shortly'
    });
  } catch (error) {
    // Log the error but don't expose it to the client
    console.error('Password reset request error:', error);
    
    // Still return success to prevent user enumeration
    return res.status(200).json({
      success: true,
      message: 'If your email exists in our system, you will receive a password reset link shortly'
    });
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    
    await authService.resetPassword(token, newPassword);
    
    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    if (error.message === 'Invalid or expired token') {
      return res.status(400).json({
        success: false,
        message: 'The password reset link is invalid or has expired'
      });
    } else if (error.message === 'Token expired') {
      return res.status(400).json({
        success: false,
        message: 'The password reset link has expired'
      });
    }
    next(error);
  }
};

// New method to validate token and return user data
const validateToken = async (req, res, next) => {
  try {
    // User data is already available from auth middleware
    return res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          firstName: req.user.first_name,
          lastName: req.user.last_name,
          role: req.user.role,
          isEmailVerified: req.user.is_email_verified
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get current user with additional data
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        role: true,
        is_email_verified: true,
        created_at: true,
        delivery_addresses: {
          select: {
            id: true,
            address: true,  // Changed from street_address
            city: true,
            state: true,
            postal_code: true,  // Changed from zip_code
            is_primary: true    // Changed from is_default
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,  // Convert to camelCase
          lastName: user.last_name,    // Convert to camelCase
          phoneNumber: user.phone_number, // Convert to camelCase
          role: user.role,
          isEmailVerified: user.is_email_verified, // Convert to camelCase
          createdAt: user.created_at,  // Convert to camelCase
          addresses: user.delivery_addresses.map(addr => ({
            id: addr.id,
            street_address: addr.address,  // ✅ Maps database 'address' to frontend 'street_address'
            city: addr.city,               // ✅ City included
            state: addr.state,             // ✅ State included
            zip_code: addr.postal_code,    // ✅ Postal code included
            is_default: addr.is_primary
          }))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Add this method to the auth controller
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber } = req.body
    const userId = req.user.id
    
    const updatedUser = await prisma.users.update({
      where: { id: userId },
      data: {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber
      }
    })
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        email: updatedUser.email,
        phoneNumber: updatedUser.phone_number
      }
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    })
  }
}

// Add this new function before the module.exports
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find the user
    const user = await prisma.users.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      token: newAccessToken
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  changeEmail,
  login,
  requestPasswordReset,
  resetPassword,
  validateToken,
  getCurrentUser,
  updateProfile,
  refreshToken // Add this to exports
};