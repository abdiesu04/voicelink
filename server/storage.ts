import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, and, desc } from "drizzle-orm";
import * as schema from "@shared/schema";
import type { User, Subscription, Room, CreditUsage, SubscriptionPlan } from "@shared/schema";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

export interface IStorage {
  // User methods
  createUser(email: string, passwordHash: string): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;

  // Subscription methods
  createSubscription(userId: number, plan: SubscriptionPlan): Promise<Subscription>;
  getSubscription(userId: number): Promise<Subscription | undefined>;
  updateSubscription(userId: number, data: Partial<Subscription>): Promise<Subscription | undefined>;
  upgradeSubscription(userId: number, newPlan: SubscriptionPlan): Promise<Subscription>;
  cancelSubscription(userId: number): Promise<Subscription | undefined>;
  deductCredits(userId: number, seconds: number): Promise<{ success: boolean; creditsRemaining: number; }>;
  consumeCredits(userId: number, seconds: number): Promise<{ success: boolean; creditsRemaining: number; exhausted: boolean; }>;
  handleBillingCycle(userId: number): Promise<Subscription | undefined>;

  // Room methods
  createRoom(userId: number, language: string, voiceGender: "male" | "female"): Promise<Room>;
  getRoom(id: string): Promise<Room | undefined>;
  updateRoom(id: string, data: Partial<Room>): Promise<Room | undefined>;
  deleteRoom(id: string): Promise<void>;
  startSession(roomId: string): Promise<void>;
  endSession(roomId: string): Promise<void>;

  // Credit usage methods
  recordCreditUsage(userId: number, roomId: string, secondsUsed: number, creditsDeducted: number): Promise<CreditUsage>;
  getUserCreditUsage(userId: number): Promise<CreditUsage[]>;
}

export class PgStorage implements IStorage {
  // User methods
  async createUser(email: string, passwordHash: string): Promise<User> {
    const [user] = await db.insert(schema.users).values({
      email,
      passwordHash,
    }).returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  // Subscription methods
  async createSubscription(userId: number, plan: SubscriptionPlan): Promise<Subscription> {
    const planDetails = schema.PLAN_DETAILS[plan];
    // Convert minutes to seconds (1 credit = 1 second)
    const creditsInSeconds = planDetails.credits * 60;
    const [subscription] = await db.insert(schema.subscriptions).values({
      userId,
      plan,
      creditsRemaining: creditsInSeconds,
      creditsRolledOver: 0,
      billingCycleStart: new Date(),
      billingCycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true,
    }).returning();
    return subscription;
  }

  async getSubscription(userId: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select()
      .from(schema.subscriptions)
      .where(and(
        eq(schema.subscriptions.userId, userId),
        eq(schema.subscriptions.isActive, true)
      ))
      .orderBy(desc(schema.subscriptions.updatedAt))
      .limit(1);
    return subscription;
  }

  async updateSubscription(userId: number, data: Partial<Subscription>): Promise<Subscription | undefined> {
    const [updated] = await db.update(schema.subscriptions)
      .set({ ...data, updatedAt: new Date() })
      .where(and(
        eq(schema.subscriptions.userId, userId),
        eq(schema.subscriptions.isActive, true)
      ))
      .returning();
    return updated;
  }

  async upgradeSubscription(userId: number, newPlan: SubscriptionPlan): Promise<Subscription> {
    const current = await this.getSubscription(userId);
    if (!current) {
      throw new Error("No active subscription found");
    }

    const newPlanDetails = schema.PLAN_DETAILS[newPlan];
    // Convert minutes to seconds (1 credit = 1 second)
    const creditsInSeconds = newPlanDetails.credits * 60;
    
    const [updated] = await db.update(schema.subscriptions)
      .set({
        plan: newPlan,
        creditsRemaining: current.creditsRemaining + creditsInSeconds,
        updatedAt: new Date(),
      })
      .where(eq(schema.subscriptions.id, current.id))
      .returning();

    return updated;
  }

  async cancelSubscription(userId: number): Promise<Subscription | undefined> {
    const [canceled] = await db.update(schema.subscriptions)
      .set({
        isActive: false,
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(schema.subscriptions.userId, userId),
        eq(schema.subscriptions.isActive, true)
      ))
      .returning();
    return canceled;
  }

  async deductCredits(userId: number, seconds: number): Promise<{ success: boolean; creditsRemaining: number; }> {
    const subscription = await this.getSubscription(userId);
    if (!subscription) {
      return { success: false, creditsRemaining: 0 };
    }

    // 1 credit = 1 second
    const creditsToDeduct = seconds;
    const newCredits = Math.max(0, subscription.creditsRemaining - creditsToDeduct);

    await this.updateSubscription(userId, {
      creditsRemaining: newCredits,
    });

    return { success: newCredits > 0, creditsRemaining: newCredits };
  }

  async consumeCredits(userId: number, seconds: number): Promise<{ success: boolean; creditsRemaining: number; exhausted: boolean; }> {
    const subscription = await this.getSubscription(userId);
    if (!subscription) {
      return { success: false, creditsRemaining: 0, exhausted: true };
    }

    // 1 credit = 1 second
    const creditsToDeduct = seconds;
    const newCredits = Math.max(0, subscription.creditsRemaining - creditsToDeduct);

    await this.updateSubscription(userId, {
      creditsRemaining: newCredits,
    });

    return { 
      success: true, 
      creditsRemaining: newCredits,
      exhausted: newCredits <= 0
    };
  }

  async handleBillingCycle(userId: number): Promise<Subscription | undefined> {
    const subscription = await this.getSubscription(userId);
    if (!subscription) return undefined;

    const now = new Date();
    if (now < subscription.billingCycleEnd) {
      return subscription;
    }

    const planDetails = schema.PLAN_DETAILS[subscription.plan];
    // Convert minutes to seconds (1 credit = 1 second)
    const creditsInSeconds = planDetails.credits * 60;
    const rolloverLimitInSeconds = planDetails.rolloverLimit * 60;
    
    let creditsForNextCycle = creditsInSeconds;
    let rolledOver = 0;

    if (subscription.creditsRemaining > 0 && rolloverLimitInSeconds > 0) {
      rolledOver = Math.min(subscription.creditsRemaining, rolloverLimitInSeconds);
      creditsForNextCycle += rolledOver;
    }

    const [updated] = await db.update(schema.subscriptions)
      .set({
        creditsRemaining: creditsForNextCycle,
        creditsRolledOver: rolledOver,
        billingCycleStart: now,
        billingCycleEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        updatedAt: now,
      })
      .where(eq(schema.subscriptions.id, subscription.id))
      .returning();

    return updated;
  }

  // Room methods
  async createRoom(userId: number, language: string, voiceGender: "male" | "female"): Promise<Room> {
    const id = randomUUID();
    const [room] = await db.insert(schema.rooms).values({
      id,
      userId,
      creatorLanguage: language,
      creatorVoiceGender: voiceGender,
      isActive: true,
    }).returning();
    return room;
  }

  async getRoom(id: string): Promise<Room | undefined> {
    const [room] = await db.select().from(schema.rooms).where(eq(schema.rooms.id, id));
    return room;
  }

  async updateRoom(id: string, data: Partial<Room>): Promise<Room | undefined> {
    const [updated] = await db.update(schema.rooms)
      .set(data)
      .where(eq(schema.rooms.id, id))
      .returning();
    return updated;
  }

  async deleteRoom(id: string): Promise<void> {
    await db.delete(schema.rooms).where(eq(schema.rooms.id, id));
  }

  async startSession(roomId: string): Promise<void> {
    await db.update(schema.rooms)
      .set({ sessionStartedAt: new Date() })
      .where(eq(schema.rooms.id, roomId));
  }

  async endSession(roomId: string): Promise<void> {
    await db.update(schema.rooms)
      .set({ sessionEndedAt: new Date() })
      .where(eq(schema.rooms.id, roomId));
  }

  // Credit usage methods
  async recordCreditUsage(userId: number, roomId: string, secondsUsed: number, creditsDeducted: number): Promise<CreditUsage> {
    const [usage] = await db.insert(schema.creditUsage).values({
      userId,
      roomId,
      secondsUsed,
      creditsDeducted,
    }).returning();
    return usage;
  }

  async getUserCreditUsage(userId: number): Promise<CreditUsage[]> {
    return await db.select()
      .from(schema.creditUsage)
      .where(eq(schema.creditUsage.userId, userId))
      .orderBy(schema.creditUsage.createdAt);
  }
}

export const storage = new PgStorage();
