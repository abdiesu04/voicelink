import type { Express, Response } from "express";
import type { AuthRequest } from "./auth";
import { storage } from "./storage";
import { SUBSCRIPTION_PLANS, PLAN_DETAILS } from "@shared/schema";
import type { SubscriptionPlan } from "@shared/schema";

export function setupSubscriptionRoutes(app: Express) {
  app.get("/api/subscription", async (req: AuthRequest, res: Response) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const subscription = await storage.getSubscription(req.session.userId);
      
      if (!subscription) {
        return res.status(404).json({ error: "No subscription found" });
      }

      await storage.handleBillingCycle(req.session.userId);

      const updatedSubscription = await storage.getSubscription(req.session.userId);

      res.json(updatedSubscription);
    } catch (error) {
      console.error("Get subscription error:", error);
      res.status(500).json({ error: "Failed to get subscription" });
    }
  });

  app.post("/api/subscription/upgrade", async (req: AuthRequest, res: Response) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { plan } = req.body;

      if (!plan || !SUBSCRIPTION_PLANS.includes(plan)) {
        return res.status(400).json({ error: "Invalid plan" });
      }

      const current = await storage.getSubscription(req.session.userId);
      if (!current) {
        return res.status(404).json({ error: "No subscription found" });
      }

      if (current.plan === plan) {
        return res.status(400).json({ error: "Already on this plan" });
      }

      const currentPlanIndex = SUBSCRIPTION_PLANS.indexOf(current.plan);
      const newPlanIndex = SUBSCRIPTION_PLANS.indexOf(plan);

      if (newPlanIndex < currentPlanIndex) {
        return res.status(400).json({ error: "Use downgrade endpoint to downgrade plans" });
      }

      const updated = await storage.upgradeSubscription(req.session.userId, plan as SubscriptionPlan);

      res.json(updated);
    } catch (error) {
      console.error("Upgrade subscription error:", error);
      res.status(500).json({ error: "Failed to upgrade subscription" });
    }
  });

  app.post("/api/subscription/downgrade", async (req: AuthRequest, res: Response) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const { plan } = req.body;

      if (!plan || !SUBSCRIPTION_PLANS.includes(plan)) {
        return res.status(400).json({ error: "Invalid plan" });
      }

      const current = await storage.getSubscription(req.session.userId);
      if (!current) {
        return res.status(404).json({ error: "No subscription found" });
      }

      if (current.plan === plan) {
        return res.status(400).json({ error: "Already on this plan" });
      }

      const currentPlanIndex = SUBSCRIPTION_PLANS.indexOf(current.plan);
      const newPlanIndex = SUBSCRIPTION_PLANS.indexOf(plan);

      if (newPlanIndex > currentPlanIndex) {
        return res.status(400).json({ error: "Use upgrade endpoint to upgrade plans" });
      }

      const updated = await storage.updateSubscription(req.session.userId, {
        plan: plan as SubscriptionPlan,
      });

      res.json(updated);
    } catch (error) {
      console.error("Downgrade subscription error:", error);
      res.status(500).json({ error: "Failed to downgrade subscription" });
    }
  });

  app.post("/api/subscription/cancel", async (req: AuthRequest, res: Response) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const canceled = await storage.cancelSubscription(req.session.userId);

      if (!canceled) {
        return res.status(404).json({ error: "No active subscription found" });
      }

      res.json(canceled);
    } catch (error) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  app.get("/api/subscription/usage", async (req: AuthRequest, res: Response) => {
    if (!req.session?.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      const usage = await storage.getUserCreditUsage(req.session.userId);

      res.json(usage);
    } catch (error) {
      console.error("Get usage history error:", error);
      res.status(500).json({ error: "Failed to get usage history" });
    }
  });

  app.get("/api/subscription/plans", (_req, res: Response) => {
    res.json(Object.entries(PLAN_DETAILS).map(([key, details]) => ({
      id: key,
      ...details,
    })));
  });
}
