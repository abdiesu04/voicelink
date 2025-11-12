import type { Express, Response } from "express";
import type { AuthRequest } from "./auth";
import { storage } from "./storage";
import { generateVerificationToken, generateTokenExpiry, sendVerificationEmail } from "./email";

export function setupEmailVerificationRoutes(app: Express) {
  // Verify email with token (GET request for email link clicks)
  app.get("/api/verify-email", async (req: AuthRequest, res: Response) => {
    try {
      const token = req.query.token as string;

      if (!token) {
        return res.status(400).json({ error: "Verification token is required" });
      }

      // Get user by token
      const user = await storage.getUserByVerificationToken(token);

      if (!user) {
        return res.status(400).json({ 
          error: "Invalid or expired verification token" 
        });
      }

      // Check if token is expired
      if (user.emailVerificationTokenExpiry && user.emailVerificationTokenExpiry < new Date()) {
        return res.status(400).json({ 
          error: "Verification token has expired. Please request a new verification email." 
        });
      }

      // Verify the email
      const verifiedUser = await storage.verifyEmail(user.id);

      res.json({ 
        success: true, 
        message: "Email verified successfully!",
        user: {
          id: verifiedUser.id,
          email: verifiedUser.email,
          isEmailVerified: verifiedUser.isEmailVerified,
        }
      });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ error: "Failed to verify email" });
    }
  });

  // Resend verification email
  app.post("/api/resend-verification", async (req: AuthRequest, res: Response) => {
    try {
      const isAuthenticated = !!req.session?.userId;
      let user;

      // Support both authenticated and unauthenticated resend requests
      if (isAuthenticated) {
        // Authenticated user - use session and provide detailed errors
        user = await storage.getUserById(req.session.userId);
        
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        // Check if already verified (only show for authenticated users)
        if (user.isEmailVerified) {
          return res.status(400).json({ 
            error: "Email is already verified" 
          });
        }
      } else {
        // Unauthenticated user - prevent user enumeration by always returning success
        const { email } = req.body;
        if (!email) {
          return res.status(400).json({ error: "Email is required" });
        }
        
        user = await storage.getUserByEmail(email);
        
        // Security: Always return success for unauthenticated requests to prevent enumeration
        // Log internally for security monitoring
        if (!user) {
          console.log(`[Security] Resend verification attempt for non-existent email: ${email.substring(0, 3)}***`);
          return res.json({ 
            success: true, 
            message: "If an account exists with this email, a verification link has been sent." 
          });
        }

        if (user.isEmailVerified) {
          console.log(`[Security] Resend verification attempt for already verified email: ${email.substring(0, 3)}***`);
          return res.json({ 
            success: true, 
            message: "If an account exists with this email, a verification link has been sent." 
          });
        }
      }

      // Generate new token and expiry
      const verificationToken = generateVerificationToken();
      const tokenExpiry = generateTokenExpiry();
      await storage.setEmailVerificationToken(user.id, verificationToken, tokenExpiry);

      // Send verification email
      const emailSent = await sendVerificationEmail(user.email, verificationToken);

      if (!emailSent) {
        // For unauthenticated users, still return success but log the failure
        if (!isAuthenticated) {
          console.error(`[Email] Failed to send verification email to ${user.email.substring(0, 3)}***`);
          return res.json({ 
            success: true, 
            message: "If an account exists with this email, a verification link has been sent." 
          });
        }
        
        return res.status(500).json({ 
          error: "Failed to send verification email. Please try again later." 
        });
      }

      res.json({ 
        success: true, 
        message: isAuthenticated 
          ? "Verification email sent successfully!" 
          : "If an account exists with this email, a verification link has been sent."
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ error: "Failed to resend verification email" });
    }
  });

  // Check verification status (useful for UI)
  app.get("/api/verification-status", async (req: AuthRequest, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await storage.getUserById(req.session.userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ 
        isEmailVerified: user.isEmailVerified,
        email: user.email,
      });
    } catch (error) {
      console.error("Verification status error:", error);
      res.status(500).json({ error: "Failed to get verification status" });
    }
  });
}
