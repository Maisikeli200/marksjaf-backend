const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const tokenUtils = require('../utils/token');
const emailUtils = require('../utils/email');
const { generateUUID } = require('../utils/uuid'); // Add this import if not already present

const prisma = new PrismaClient();

const registerUser = async (userData) => {
  const { firstName, lastName, email, phoneNumber, password } = userData;
  
  // Check if user already exists
  const existingUser = await prisma.users.findUnique({
    where: { email }
  });
  
  if (existingUser) {
    throw new Error('Email already in use');
  }
  
  // Hash password - do this OUTSIDE the transaction
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);
  
  // Generate verification token - do this OUTSIDE the transaction
  const verificationToken = tokenUtils.generateVerificationToken();
  
  // Generate UUIDs
  const userId = generateUUID();
  const tokenId = generateUUID();
  
  let user;
  
  try {
    // Only database operations in the transaction
    user = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.users.create({
        data: {
          id: userId,
          first_name: firstName,
          last_name: lastName,
          email,
          phone_number: phoneNumber,
          password_hash: passwordHash,
          is_email_verified: false,
          role: 'customer'
        }
      });
      
      // Store token in database
      await tx.email_verification_tokens.create({
        data: {
          id: tokenId,
          user_id: newUser.id,
          token: verificationToken,
          purpose: 'email_verification',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          is_used: false
        }
      });
      
      return newUser;
    });
    
    // Send verification email AFTER the transaction is complete
    await emailUtils.sendVerificationEmail({
      to: email,
      firstName,
      token: verificationToken
    });
    
    return user;
    
  } catch (emailError) {
    // If email sending fails, delete the created user and token
    console.error('Email sending failed:', emailError);
    
    try {
      await prisma.$transaction(async (tx) => {
        // Delete the verification token
        await tx.email_verification_tokens.deleteMany({
          where: { user_id: userId }
        });
        
        // Delete the user
        await tx.users.delete({
          where: { id: userId }
        });
      });
    } catch (cleanupError) {
      console.error('Cleanup failed:', cleanupError);
    }
    
    // Throw a user-friendly error
    throw new Error('Failed to send verification email. Please try again later.');
  }
};

const resendVerificationEmail = async (email) => {
  // Find user
  const user = await prisma.users.findUnique({
    where: { email }
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  if (user.is_email_verified) {
    throw new Error('Email already verified');
  }
  
  // Invalidate any existing tokens
  await prisma.email_verification_tokens.updateMany({
    where: {
      user_id: user.id,
      purpose: 'email_verification',
      is_used: false
    },
    data: {
      is_used: true
    }
  });
  
  // Generate new token and UUID
  const verificationToken = tokenUtils.generateVerificationToken();
  const tokenId = generateUUID();
  
  // Store new token
  await prisma.email_verification_tokens.create({
    data: {
      id: tokenId,
      user_id: user.id,
      token: verificationToken,
      purpose: 'email_verification',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      is_used: false
    }
  });
  
  // Send verification email
  await emailUtils.sendVerificationEmail({
    to: email,
    firstName: user.first_name,
    token: verificationToken
  });
  
  return true;
};

const verifyEmail = async (token) => {
  // Find token in database
  const verificationToken = await prisma.email_verification_tokens.findFirst({
    where: {
      token,
      is_used: false,
      purpose: 'email_verification'
    },
    include: {
      users: true
    }
  });
  
  if (!verificationToken) {
    throw new Error('Invalid token');
  }
  
  // Check if token is expired
  if (verificationToken.expires_at < new Date()) {
    throw new Error('Token expired');
  }
  
  // Update user and token in transaction with increased timeout
  await prisma.$transaction(
    async (tx) => {
      // Mark user as verified
      await tx.users.update({
        where: { id: verificationToken.user_id },
        data: { is_email_verified: true }
      });
      
      // Mark token as used
      await tx.email_verification_tokens.update({
        where: { id: verificationToken.id },
        data: { is_used: true }
      });
    },
    {
      timeout: 10000 // Increase timeout to 10 seconds
    }
  );
  
  return true;
};

const changeEmail = async (oldEmail, newEmail) => {
  // Find user with old email
  const user = await prisma.users.findUnique({
    where: { email: oldEmail }
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Check if new email is already in use
  const existingUser = await prisma.users.findUnique({
    where: { email: newEmail }
  });
  
  if (existingUser) {
    throw new Error('Email already in use');
  }
  
  // Update email and reset verification status in transaction
  await prisma.$transaction(async (tx) => {
    // Update user email and verification status
    await tx.users.update({
      where: { id: user.id },
      data: {
        email: newEmail,
        is_email_verified: false
      }
    });
    
    // Invalidate existing tokens
    await tx.email_verification_tokens.updateMany({
      where: {
        user_id: user.id,
        purpose: 'email_verification',
        is_used: false
      },
      data: {
        is_used: true
      }
    });
    
    // Generate new token
    const verificationToken = tokenUtils.generateVerificationToken();
    
    // Store new token
    await tx.email_verification_tokens.create({
      data: {
        id: generateUUID(), // Add manual UUID generation
        user_id: user.id,
        token: verificationToken,
        purpose: 'email_verification',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        is_used: false
      }
    });
    
    // Send verification email to new address
    await emailUtils.sendVerificationEmail({
      to: newEmail,
      firstName: user.first_name,
      token: verificationToken
    });
  });
  
  return true;
};

// Define all functions first
const loginUser = async (email, password) => {
  // Find user
  const user = await prisma.users.findUnique({
    where: { email }
  });
  
  // Generic error message that doesn't reveal if email exists
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check if user is active
  if (!user.is_active) {
    throw new Error('Account is disabled. Please contact support.');
  }

  // Check if email is verified
  if (!user.is_email_verified) {
    throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Generate JWT token
  const token = tokenUtils.generateAuthToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isEmailVerified: user.is_email_verified
    },
    token
  };
};

const requestPasswordReset = async (email) => {
  // Find user
  const user = await prisma.users.findUnique({
    where: { email }
  });
  
  // If user doesn't exist, still return success but don't send email
  if (!user) {
    // Return success even though we didn't do anything
    return true;
  }
  
  // Generate reset token
  const resetToken = tokenUtils.generateVerificationToken();
  
  // Store token in database
  await prisma.email_verification_tokens.create({
    data: {
      id: generateUUID(), // Add manual UUID generation
      user_id: user.id,
      token: resetToken,
      purpose: 'password_reset',
      expires_at: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour
      is_used: false
    }
  });
  
  // Send password reset email
  await emailUtils.sendPasswordResetEmail({
    to: email,
    firstName: user.first_name,
    token: resetToken
  });
  
  return true;
};

const resetPassword = async (token, newPassword) => {
  // Find token in database
  const resetToken = await prisma.email_verification_tokens.findFirst({
    where: {
      token,
      is_used: false,
      purpose: 'password_reset'
    },
    include: {
      users: true
    }
  });
  
  if (!resetToken) {
    throw new Error('Invalid or expired token');
  }
  
  // Check if token is expired
  if (resetToken.expires_at < new Date()) {
    throw new Error('Token expired');
  }
  
  // Hash new password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(newPassword, saltRounds);
  
  // Update password and mark token as used in transaction
  await prisma.$transaction(
    async (tx) => {
      // Update password
      await tx.users.update({
        where: { id: resetToken.user_id },
        data: { password_hash: passwordHash }
      });
      
      // Mark token as used
      await tx.email_verification_tokens.update({
        where: { id: resetToken.id },
        data: { is_used: true }
      });
    },
    {
      timeout: 10000 // Increase timeout to 10 seconds
    }
  );
  
  return true;
};

// Then export all functions at the end
module.exports = {
  registerUser,
  verifyEmail,
  resendVerificationEmail,
  changeEmail,
  loginUser,
  requestPasswordReset,
  resetPassword
};