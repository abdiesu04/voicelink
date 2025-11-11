import { z } from "zod";
import { pgTable, text, timestamp, integer, boolean, varchar, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";

// Subscription plan types
export const SUBSCRIPTION_PLANS = ["free", "starter", "pro"] as const;
export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[number];

// Plan details
export const PLAN_DETAILS = {
  free: { name: "Free Trial", price: 0, credits: 60, rolloverLimit: 0 },
  starter: { name: "Starter", price: 9.99, credits: 350, rolloverLimit: 350 },
  pro: { name: "Pro", price: 29.99, credits: 1200, rolloverLimit: 1200 },
} as const;

// Database Tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  plan: varchar("plan", { length: 50 }).$type<SubscriptionPlan>().notNull().default("free"),
  creditsRemaining: integer("credits_remaining").notNull().default(60),
  creditsRolledOver: integer("credits_rolled_over").notNull().default(0),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  billingCycleStart: timestamp("billing_cycle_start").notNull().defaultNow(),
  billingCycleEnd: timestamp("billing_cycle_end").notNull().default(sql`NOW() + INTERVAL '30 days'`),
  isActive: boolean("is_active").notNull().default(true),
  canceledAt: timestamp("canceled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  creatorLanguage: varchar("creator_language", { length: 10 }).notNull(),
  creatorVoiceGender: varchar("creator_voice_gender", { length: 10 }).$type<"male" | "female">().notNull(),
  participantLanguage: varchar("participant_language", { length: 10 }),
  participantVoiceGender: varchar("participant_voice_gender", { length: 10 }).$type<"male" | "female">(),
  isActive: boolean("is_active").notNull().default(true),
  sessionStartedAt: timestamp("session_started_at"),
  sessionEndedAt: timestamp("session_ended_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const creditUsage = pgTable("credit_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roomId: varchar("room_id", { length: 255 }).notNull().references(() => rooms.id, { onDelete: "cascade" }),
  secondsUsed: integer("seconds_used").notNull().default(0),
  creditsDeducted: integer("credits_deducted").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRoomSchema = createInsertSchema(rooms).omit({ createdAt: true, sessionStartedAt: true, sessionEndedAt: true });
export const insertCreditUsageSchema = createInsertSchema(creditUsage).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type CreditUsage = typeof creditUsage.$inferSelect;
export type InsertCreditUsage = z.infer<typeof insertCreditUsageSchema>;

// Authentication schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;

// Supported languages for translation
export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", countryCode: "US" },
  { code: "es", name: "Spanish", countryCode: "ES" },
  { code: "fr", name: "French", countryCode: "FR" },
  { code: "de", name: "German", countryCode: "DE" },
  { code: "it", name: "Italian", countryCode: "IT" },
  { code: "pt", name: "Portuguese", countryCode: "PT" },
  { code: "ru", name: "Russian", countryCode: "RU" },
  { code: "ja", name: "Japanese", countryCode: "JP" },
  { code: "ko", name: "Korean", countryCode: "KR" },
  { code: "zh", name: "Chinese", countryCode: "CN" },
  { code: "ar", name: "Arabic", countryCode: "SA" },
  { code: "hi", name: "Hindi", countryCode: "IN" },
  { code: "nl", name: "Dutch", countryCode: "NL" },
  { code: "pl", name: "Polish", countryCode: "PL" },
  { code: "tr", name: "Turkish", countryCode: "TR" },
  { code: "pt-br", name: "Portuguese (Brazil)", countryCode: "BR" },
  { code: "sv", name: "Swedish", countryCode: "SE" },
  { code: "nb", name: "Norwegian", countryCode: "NO" },
  { code: "da", name: "Danish", countryCode: "DK" },
  { code: "fi", name: "Finnish", countryCode: "FI" },
  { code: "el", name: "Greek", countryCode: "GR" },
  { code: "cs", name: "Czech", countryCode: "CZ" },
  { code: "ro", name: "Romanian", countryCode: "RO" },
  { code: "uk", name: "Ukrainian", countryCode: "UA" },
  { code: "hu", name: "Hungarian", countryCode: "HU" },
  { code: "vi", name: "Vietnamese", countryCode: "VN" },
  { code: "th", name: "Thai", countryCode: "TH" },
  { code: "id", name: "Indonesian", countryCode: "ID" },
  { code: "he", name: "Hebrew", countryCode: "IL" },
  { code: "bn", name: "Bengali", countryCode: "BD" },
  { code: "ta", name: "Tamil", countryCode: "IN" },
  { code: "te", name: "Telugu", countryCode: "IN" },
  { code: "mr", name: "Marathi", countryCode: "IN" },
  { code: "bg", name: "Bulgarian", countryCode: "BG" },
  { code: "hr", name: "Croatian", countryCode: "HR" },
  { code: "sk", name: "Slovak", countryCode: "SK" },
  { code: "sl", name: "Slovenian", countryCode: "SI" },
  { code: "ca", name: "Catalan", countryCode: "ES" },
  { code: "ms", name: "Malay", countryCode: "MY" },
  { code: "af", name: "Afrikaans", countryCode: "ZA" },
  { code: "sw", name: "Swahili", countryCode: "KE" },
  { code: "gu", name: "Gujarati", countryCode: "IN" },
  { code: "kn", name: "Kannada", countryCode: "IN" },
  { code: "ml", name: "Malayalam", countryCode: "IN" },
  { code: "sr", name: "Serbian", countryCode: "RS" },
  { code: "et", name: "Estonian", countryCode: "EE" },
  { code: "lv", name: "Latvian", countryCode: "LV" },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]["code"];

// Voice gender options
export const VOICE_GENDERS = ["male", "female"] as const;
export type VoiceGender = typeof VOICE_GENDERS[number];

// Translation message schema
export const translationMessageSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  speaker: z.enum(["creator", "participant"]),
  originalText: z.string(),
  originalLanguage: z.string(),
  translatedText: z.string(),
  translatedLanguage: z.string(),
  timestamp: z.date(),
});

export type TranslationMessage = z.infer<typeof translationMessageSchema>;

// WebSocket message types
export const wsMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("join"),
    roomId: z.string(),
    language: z.string(),
    voiceGender: z.enum(VOICE_GENDERS),
    role: z.enum(["creator", "participant"]),
  }),
  z.object({
    type: z.literal("audio"),
    roomId: z.string(),
    audioData: z.string(), // base64 encoded audio
    language: z.string(),
  }),
  z.object({
    type: z.literal("transcription"),
    roomId: z.string(),
    text: z.string(),
    speaker: z.enum(["creator", "participant"]),
    language: z.string(),
    interim: z.boolean().optional(), // true for partial results, false/undefined for final
  }),
  z.object({
    type: z.literal("translation"),
    roomId: z.string(),
    originalText: z.string(),
    translatedText: z.string(),
    speaker: z.enum(["creator", "participant"]),
    originalLanguage: z.string(),
    translatedLanguage: z.string(),
  }),
  z.object({
    type: z.literal("tts-audio"),
    roomId: z.string(),
    audioData: z.string(), // base64 encoded audio
    speaker: z.enum(["creator", "participant"]),
  }),
  z.object({
    type: z.literal("participant-joined"),
    roomId: z.string(),
    language: z.string(),
    voiceGender: z.enum(VOICE_GENDERS),
  }),
  z.object({
    type: z.literal("participant-left"),
    roomId: z.string(),
  }),
  z.object({
    type: z.literal("error"),
    message: z.string(),
  }),
]);

export type WSMessage = z.infer<typeof wsMessageSchema>;
