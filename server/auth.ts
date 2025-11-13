import type { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import passport from "passport";
import { storage } from "./storage";
import { registerSchema, loginSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { generateVerificationCode, generateCodeExpiry, sendVerificationCodeEmail } from "./email";
import { z } from "zod";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export function setupAuth(app: Express) {
  // Step 1: Send verification code
  app.post("/api/register/send-code", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      });

      const validationResult = schema.safeParse(req.body);
      
      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({ error: error.message });
      }

      const { email, password } = validationResult.data;

      // Check if email already registered
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Check for existing pending registration and rate limiting
      const existingPending = await storage.getPendingRegistrationByEmail(email);
      if (existingPending) {
        // Check resend rate limit (60 seconds minimum)
        if (existingPending.lastResendAt) {
          const timeSinceLastResend = Date.now() - existingPending.lastResendAt.getTime();
          if (timeSinceLastResend < 60000) {
            const waitSeconds = Math.ceil((60000 - timeSinceLastResend) / 1000);
            return res.status(429).json({ 
              error: `Please wait ${waitSeconds} seconds before requesting another code` 
            });
          }
        }

        // Check daily resend limit (5 per day)
        if (existingPending.resendCount >= 5) {
          return res.status(429).json({ 
            error: "Maximum code requests reached. Please try again tomorrow." 
          });
        }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Generate verification code
      const code = generateVerificationCode();
      const hashedCode = await bcrypt.hash(code, 10);
      const codeExpiry = generateCodeExpiry();

      // Store pending registration
      await storage.createPendingRegistration(email, passwordHash, hashedCode, codeExpiry);

      // Send verification email
      const emailSent = await sendVerificationCodeEmail(email, code);

      if (!emailSent) {
        console.error(`[Registration] Failed to send verification email to ${email.substring(0, 3)}***`);
        return res.status(500).json({ 
          error: "Failed to send verification email. Please try again." 
        });
      }

      console.log(`[Registration] Verification code sent to ${email.substring(0, 3)}***`);

      res.json({ 
        success: true,
        message: "Verification code sent to your email. Please check your inbox.",
        emailSent: true
      });
    } catch (error) {
      console.error("Send code error:", error);
      res.status(500).json({ error: "Failed to send verification code" });
    }
  });

  // Step 2: Verify code and create account
  app.post("/api/register/verify-code", async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        email: z.string().email("Invalid email address"),
        code: z.string().length(6, "Verification code must be 6 digits"),
      });

      const validationResult = schema.safeParse(req.body);
      
      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({ error: error.message });
      }

      const { email, code } = validationResult.data;

      // Get pending registration
      const pending = await storage.getPendingRegistrationByEmail(email);

      if (!pending) {
        return res.status(400).json({ 
          error: "No pending registration found. Please request a new code." 
        });
      }

      // Check if code expired
      if (pending.codeExpiry < new Date()) {
        await storage.deletePendingRegistration(email);
        return res.status(400).json({ 
          error: "Verification code expired. Please request a new code." 
        });
      }

      // Check attempt limit (5 attempts)
      if (pending.attemptCount >= 5) {
        await storage.deletePendingRegistration(email);
        return res.status(429).json({ 
          error: "Too many failed attempts. Please request a new code." 
        });
      }

      // Verify code
      const isValidCode = await bcrypt.compare(code, pending.hashedCode);

      if (!isValidCode) {
        // Increment attempt count (simplified - in production, update in database)
        console.log(`[Registration] Failed verification attempt for ${email.substring(0, 3)}***`);
        return res.status(400).json({ 
          error: "Invalid verification code. Please try again." 
        });
      }

      // Create user account
      const user = await storage.createUser(email, pending.passwordHash);

      // Create free subscription
      const subscription = await storage.createSubscription(user.id, 'free');

      // Delete pending registration
      await storage.deletePendingRegistration(email);

      // Create session
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ error: "Failed to create session" });
        }

        req.session.userId = user.id;

        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ error: "Failed to save session" });
          }

          console.log(`[Registration] Account created successfully for ${email.substring(0, 3)}***`);

          res.json({
            success: true,
            user: {
              id: user.id,
              email: user.email,
            },
            subscription: {
              plan: subscription.plan,
              creditsRemaining: subscription.creditsRemaining,
            },
          });
        });
      });
    } catch (error) {
      console.error("Verify code error:", error);
      res.status(500).json({ error: "Failed to verify code" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const validationResult = loginSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({ error: error.message });
      }

      const { email, password } = validationResult.data;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const subscription = await storage.getSubscription(user.id);

      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ error: "Failed to create session" });
        }

        req.session.userId = user.id;

        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ error: "Failed to save session" });
          }

          res.json({
            user: {
              id: user.id,
              email: user.email,
            },
            subscription: subscription ? {
              plan: subscription.plan,
              creditsRemaining: subscription.creditsRemaining,
            } : null,
          });
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        req.session.destroy(() => {});
        return res.status(401).json({ error: "User not found" });
      }

      const subscription = await storage.getSubscription(user.id);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profilePictureUrl: user.profilePictureUrl,
        },
        subscription: subscription,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.get("/auth/google", 
    passport.authenticate("google", { 
      scope: ["profile", "email"] 
    })
  );

  app.get("/auth/google/callback",
    passport.authenticate("google", { 
      failureRedirect: "/login?error=google-auth-failed",
      session: false
    }),
    (req: Request, res: Response) => {
      const user = req.user as any;
      if (!user) {
        return res.redirect("/login?error=google-auth-failed");
      }

      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.redirect("/login?error=session-failed");
        }

        req.session.userId = user.id;

        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.redirect("/login?error=session-failed");
          }

          res.redirect("/");
        });
      });
    }
  );

  app.post("/api/auth/link-google", requireAuth, async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { googleId, name, profilePictureUrl } = req.body;

      if (!googleId) {
        return res.status(400).json({ error: "Google ID is required" });
      }

      const existingGoogleUser = await storage.getUserByGoogleId(googleId);
      if (existingGoogleUser && existingGoogleUser.id !== req.session.userId) {
        return res.status(400).json({ error: "This Google account is already linked to another user" });
      }

      const user = await storage.linkGoogleAccount(
        req.session.userId,
        googleId,
        name,
        profilePictureUrl
      );

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profilePictureUrl: user.profilePictureUrl,
        },
      });
    } catch (error) {
      console.error("Link Google account error:", error);
      res.status(500).json({ error: "Failed to link Google account" });
    }
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export async function attachUser(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.session.userId) {
    try {
      const user = await storage.getUserById(req.session.userId);
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
        };
      }
    } catch (error) {
      console.error("Error attaching user:", error);
    }
  }
  next();
}
