import nodemailer from "nodemailer";
import crypto from "crypto";

// Email configuration
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@voztra.com";
const EMAIL_HOST = process.env.EMAIL_HOST || "smtp.gmail.com";
const EMAIL_PORT = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

// Create reusable transporter
const createTransporter = () => {
  // In development, use console logging if credentials not set
  if (!EMAIL_USER || !EMAIL_PASSWORD) {
    console.warn("⚠️  Email credentials not configured. Verification emails will be logged to console.");
    return nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      buffer: true,
    });
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
  });
};

// Generate secure verification token
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Generate token expiry (24 hours from now)
export function generateTokenExpiry(): Date {
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

// Send verification email
export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<boolean> {
  const transporter = createTransporter();
  
  // Get the base URL from environment or use default
  const baseUrl = process.env.REPL_SLUG 
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    : process.env.BASE_URL || "http://localhost:5000";
  
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"Voztra" <${EMAIL_FROM}>`,
    to: email,
    subject: "Verify Your Email - Voztra",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Welcome to Voztra! 🎉</h1>
            </div>
            <div class="content">
              <p>Hello!</p>
              <p>Thank you for creating an account with Voztra. To activate your free 60 minutes of real-time translation, please verify your email address.</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">
                ${verificationUrl}
              </p>
              
              <div class="warning">
                <strong>⏰ This link expires in 24 hours</strong>
                <p style="margin: 5px 0 0 0; font-size: 14px;">If you didn't create an account with Voztra, you can safely ignore this email.</p>
              </div>
              
              <p>After verification, you'll be able to:</p>
              <ul>
                <li>Create translation rooms in 47 languages</li>
                <li>Enjoy 60 minutes of free translation time</li>
                <li>Experience real-time voice translation with natural accent preservation</li>
              </ul>
              
              <p>Need help? Reply to this email and our support team will assist you.</p>
              
              <p>Happy translating!<br>The Voztra Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Voztra. All rights reserved.</p>
              <p>Real-time voice translation for everyone.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Welcome to Voztra!

Thank you for creating an account. To activate your free 60 minutes of real-time translation, please verify your email address.

Verification Link: ${verificationUrl}

This link expires in 24 hours.

After verification, you'll be able to:
- Create translation rooms in 47 languages
- Enjoy 60 minutes of free translation time
- Experience real-time voice translation with natural accent preservation

If you didn't create an account with Voztra, you can safely ignore this email.

Need help? Reply to this email and our support team will assist you.

Happy translating!
The Voztra Team

© ${new Date().getFullYear()} Voztra. All rights reserved.
Real-time voice translation for everyone.
    `.trim(),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    // In development mode, log the email content
    if (!EMAIL_USER || !EMAIL_PASSWORD) {
      console.log("\n📧 Verification Email (Development Mode):");
      console.log("To:", email);
      console.log("Verification URL:", verificationUrl);
      console.log("Token:", token);
      console.log("Expires:", generateTokenExpiry().toISOString());
      console.log("\n");
      return true; // Development mode always succeeds
    }
    
    // Check if email was actually sent
    if (!info || !info.messageId) {
      console.error("❌ Email failed: No message ID returned");
      return false;
    }
    
    console.log("✅ Verification email sent to:", email, "- Message ID:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Failed to send verification email:", error);
    return false;
  }
}

// Send password reset email (for future use)
export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<boolean> {
  const transporter = createTransporter();
  
  const baseUrl = process.env.REPL_SLUG 
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    : process.env.BASE_URL || "http://localhost:5000";
  
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Voztra" <${EMAIL_FROM}>`,
    to: email,
    subject: "Reset Your Password - Voztra",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello!</p>
              <p>We received a request to reset your Voztra account password. Click the button below to reset it:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">
                ${resetUrl}
              </p>
              
              <div class="warning">
                <strong>⏰ This link expires in 1 hour</strong>
                <p style="margin: 5px 0 0 0; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              </div>
              
              <p>For security reasons, this link will expire in 1 hour.</p>
              
              <p>Need help? Reply to this email and our support team will assist you.</p>
              
              <p>Best regards,<br>The Voztra Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Voztra. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Password Reset Request

We received a request to reset your Voztra account password.

Reset Link: ${resetUrl}

This link expires in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

Need help? Reply to this email and our support team will assist you.

Best regards,
The Voztra Team

© ${new Date().getFullYear()} Voztra. All rights reserved.
    `.trim(),
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    if (!EMAIL_USER || !EMAIL_PASSWORD) {
      console.log("\n📧 Password Reset Email (Development Mode):");
      console.log("To:", email);
      console.log("Reset URL:", resetUrl);
      console.log("\n");
      return true; // Development mode always succeeds
    }
    
    // Check if email was actually sent
    if (!info || !info.messageId) {
      console.error("❌ Email failed: No message ID returned");
      return false;
    }
    
    console.log("✅ Password reset email sent to:", email, "- Message ID:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Failed to send password reset email:", error);
    return false;
  }
}
