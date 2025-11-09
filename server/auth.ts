import type { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { registerSchema, loginSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

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
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validationResult = registerSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const error = fromZodError(validationResult.error);
        return res.status(400).json({ error: error.message });
      }

      const { email, password, plan } = validationResult.data;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await storage.createUser(email, passwordHash);

      const subscription = await storage.createSubscription(user.id, plan);

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
            subscription: {
              plan: subscription.plan,
              creditsRemaining: subscription.creditsRemaining,
            },
          });
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Failed to register user" });
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
        },
        subscription: subscription ? {
          plan: subscription.plan,
          creditsRemaining: subscription.creditsRemaining,
          billingCycleEnd: subscription.billingCycleEnd,
        } : null,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
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
