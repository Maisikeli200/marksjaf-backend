const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');

const transporter = nodemailer.createTransport(emailConfig);

const sendVerificationEmail = async ({ to, firstName, token }) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verificationLink = `${frontendUrl}/verify-email?token=${token}&email=${encodeURIComponent(to)}`;
  
  const mailOptions = {
    from: `"Marksjaf" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Marksjaf!</h2>
        <p>Hello ${firstName},</p>
        <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p>${verificationLink}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <p>Best regards,<br>The Marksjaf Team</p>
      </div>
    `
  };
  
  return transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async ({ to, firstName, token }) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: `"Marksjaf" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>Hello ${firstName},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p>If you didn't request a password reset, you can ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <p>If the button doesn't work, you can also click on this link or copy it to your browser:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
      </div>
    `
  };
  
  return transporter.sendMail(mailOptions);
};

// New function for contact form emails
const sendContactEmail = async ({ from, name, phone, subject, message }) => {
  const businessEmail = process.env.SMTP_USER; // marksjaf@universalkart.com.ng
  
  const mailOptions = {
    from: `"Marksjaf Contact Form" <${process.env.SMTP_USER}>`,
    to: businessEmail,
    replyTo: from,
    subject: `Contact Form: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #9ACD32; margin-bottom: 20px;">New Contact Form Submission</h2>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #333;">Contact Details:</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${from}</p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
          <p><strong>Subject:</strong> ${subject}</p>
        </div>
        
        <div style="background-color: #fff; padding: 15px; border-left: 4px solid #9ACD32; margin-bottom: 20px;">
          <h3 style="margin-top: 0; color: #333;">Message:</h3>
          <p style="line-height: 1.6; color: #555;">${message.replace(/\n/g, '<br>')}</p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #888; font-size: 12px;">This email was sent from the Marksjaf contact form</p>
        </div>
      </div>
    `
  };
  
  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendContactEmail
};