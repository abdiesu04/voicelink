const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = "noreply@getvoztra.com";

export function generateVerificationCode(): string {
  // Generate a 6-digit random code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateCodeExpiry(): Date {
  // Verification codes expire in 15 minutes
  return new Date(Date.now() + 15 * 60 * 1000);
}

async function sendResendEmail(payload: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn("⚠️  RESEND_API_KEY not configured. Email will be logged to console.");
    console.log("\n📧 Email (Development Mode):");
    console.log("From:", payload.from);
    console.log("To:", payload.to);
    console.log("Subject:", payload.subject);
    console.log("\n");
    return true;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Resend API error:", response.status, error);
      return false;
    }

    const data = await response.json();
    
    if (!data.id) {
      console.error("❌ Email failed: No ID returned");
      return false;
    }

    console.log("✅ Email sent successfully - ID:", data.id);
    return true;
  } catch (error) {
    console.error("❌ Failed to send email via Resend:", error);
    return false;
  }
}

export async function sendVerificationCodeEmail(
  email: string,
  code: string
): Promise<boolean> {
  const payload = {
    from: `Voztra <${EMAIL_FROM}>`,
    to: email,
    subject: "Your Voztra Verification Code",
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
            .code-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea; font-family: monospace; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Complete Your Registration 🎉</h1>
            </div>
            <div class="content">
              <p>Hello!</p>
              <p>Thank you for signing up for Voztra. Enter this verification code to complete your registration:</p>
              
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              
              <div class="warning">
                <strong>⏰ This code expires in 15 minutes</strong>
                <p style="margin: 5px 0 0 0; font-size: 14px;">If you didn't request this code, you can safely ignore this email.</p>
              </div>
              
              <p>After verification, you'll receive:</p>
              <ul>
                <li><strong>60 minutes of free translation time</strong></li>
                <li>Access to 47 languages</li>
                <li>Real-time voice translation with natural accents</li>
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
Complete Your Registration

Thank you for signing up for Voztra. Enter this verification code to complete your registration:

${code}

This code expires in 15 minutes.

After verification, you'll receive:
- 60 minutes of free translation time
- Access to 47 languages
- Real-time voice translation with natural accents

If you didn't request this code, you can safely ignore this email.

Need help? Reply to this email and our support team will assist you.

Happy translating!
The Voztra Team

© ${new Date().getFullYear()} Voztra. All rights reserved.
Real-time voice translation for everyone.
    `.trim(),
  };

  if (!RESEND_API_KEY) {
    console.log("✉️  Verification Code:", code);
    console.log("⏰  Expires:", generateCodeExpiry().toISOString());
  }

  return sendResendEmail(payload);
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<boolean> {
  const baseUrl = process.env.REPL_SLUG 
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    : process.env.BASE_URL || "http://localhost:5000";
  
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  const payload = {
    from: `Voztra <${EMAIL_FROM}>`,
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

  if (!RESEND_API_KEY) {
    console.log("Password Reset URL:", resetUrl);
  }

  return sendResendEmail(payload);
}
