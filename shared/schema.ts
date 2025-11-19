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
  passwordHash: varchar("password_hash", { length: 255 }),
  googleId: varchar("google_id", { length: 255 }).unique(),
  name: varchar("name", { length: 255 }),
  profilePictureUrl: varchar("profile_picture_url", { length: 500 }),
  isEmailVerified: boolean("is_email_verified").notNull().default(true),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pendingRegistrations = pgTable("pending_registrations", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  hashedCode: varchar("hashed_code", { length: 255 }).notNull(),
  codeExpiry: timestamp("code_expiry").notNull(),
  attemptCount: integer("attempt_count").notNull().default(0),
  lastAttemptAt: timestamp("last_attempt_at"),
  resendCount: integer("resend_count").notNull().default(0),
  lastResendAt: timestamp("last_resend_at"),
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
  lastActivityAt: timestamp("last_activity_at").notNull().defaultNow(),
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

// Audit log event types
export const AUDIT_EVENT_TYPES = [
  "STT_INTERIM",           // Azure Speech SDK interim recognition
  "STT_FINAL",             // Azure Speech SDK final recognition
  "STT_RESULT_ID_BLOCK",   // Client-side resultId deduplication blocked
  "STT_OFFSET_BLOCK",      // Client-side temporal (offset) deduplication blocked
  "WS_SEND",               // Client sends transcription to server via WebSocket
  "WS_RECEIVE",            // Server receives transcription
  "TRANSLATION_REQUEST",   // Request sent to Azure Translator
  "TRANSLATION_RESPONSE",  // Response from Azure Translator
  "DEDUP_TIER1_BLOCK",     // Server Tier 1 dedup blocked (98% original similarity)
  "DEDUP_TIER2_BLOCK",     // Server Tier 2 dedup blocked (82% both texts)
  "DEDUP_TIER2_BYPASS",    // Server Tier 2 numeric bypass allowed
  "DEDUP_CONTENT_BLOCK",   // Server content-based dedup blocked
  "DEDUP_PASSED",          // Message passed all dedup checks
  "TTS_REQUEST",           // Request sent to Azure TTS
  "TTS_RESPONSE",          // Response from Azure TTS
  "TTS_QUEUE_ADD",         // Added to TTS playback queue
  "TTS_PLAYBACK_START",    // Audio playback started
  "TTS_PLAYBACK_END",      // Audio playback ended
  "SEQUENCE_ASSIGNED",     // Server assigned sequence number
] as const;

export type AuditEventType = typeof AUDIT_EVENT_TYPES[number];

// Audit logs table - tracks complete flow of every utterance through the system
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  eventType: varchar("event_type", { length: 50 }).$type<AuditEventType>().notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  roomId: varchar("room_id", { length: 255 }),
  userId: integer("user_id"),
  messageId: varchar("message_id", { length: 255 }), // Correlate events for same utterance
  azureResultId: varchar("azure_result_id", { length: 255 }), // Azure Speech SDK resultId
  offset: varchar("offset", { length: 50 }), // Azure Speech SDK audio offset in ticks (when utterance starts)
  duration: varchar("duration", { length: 50 }), // Azure Speech SDK audio duration in ticks
  sequenceNumber: integer("sequence_number"), // Server-assigned sequence number
  speaker: varchar("speaker", { length: 20 }), // creator or participant
  originalText: text("original_text"),
  translatedText: text("translated_text"),
  languageFrom: varchar("language_from", { length: 10 }),
  languageTo: varchar("language_to", { length: 10 }),
  metadata: text("metadata"), // JSON string for additional context (similarity scores, durations, etc.)
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Call ratings table - tracks user satisfaction ratings after calls
export const callRatings = pgTable("call_ratings", {
  id: serial("id").primaryKey(),
  roomId: varchar("room_id", { length: 255 }).notNull().references(() => rooms.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 stars
  feedback: text("feedback"), // Optional feedback for low ratings
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true,
});
export const insertPendingRegistrationSchema = createInsertSchema(pendingRegistrations).omit({ 
  id: true, 
  createdAt: true,
});
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRoomSchema = createInsertSchema(rooms).omit({ createdAt: true, sessionStartedAt: true, sessionEndedAt: true, lastActivityAt: true });
export const insertCreditUsageSchema = createInsertSchema(creditUsage).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export const insertCallRatingSchema = createInsertSchema(callRatings).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type PendingRegistration = typeof pendingRegistrations.$inferSelect;
export type InsertPendingRegistration = z.infer<typeof insertPendingRegistrationSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type CreditUsage = typeof creditUsage.$inferSelect;
export type InsertCreditUsage = z.infer<typeof insertCreditUsageSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type CallRating = typeof callRatings.$inferSelect;
export type InsertCallRating = z.infer<typeof insertCallRatingSchema>;

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

// Supported languages for translation (89 languages total)
// Hybrid approach: Base languages use short codes, regional variants use BCP-47 locales
// Backward compatible with existing rooms
export const SUPPORTED_LANGUAGES = [
  // English variants (1 base + 12 regional = 13 total)
  { code: "en", name: "English (US)", countryCode: "US", group: "English" },
  { code: "en-GB", name: "English (UK)", countryCode: "GB", group: "English" },
  { code: "en-AU", name: "English (Australia)", countryCode: "AU", group: "English" },
  { code: "en-CA", name: "English (Canada)", countryCode: "CA", group: "English" },
  { code: "en-IN", name: "English (India)", countryCode: "IN", group: "English" },
  { code: "en-IE", name: "English (Ireland)", countryCode: "IE", group: "English" },
  { code: "en-NZ", name: "English (New Zealand)", countryCode: "NZ", group: "English" },
  { code: "en-SG", name: "English (Singapore)", countryCode: "SG", group: "English" },
  { code: "en-HK", name: "English (Hong Kong)", countryCode: "HK", group: "English" },
  { code: "en-PH", name: "English (Philippines)", countryCode: "PH", group: "English" },
  { code: "en-NG", name: "English (Nigeria)", countryCode: "NG", group: "English" },
  { code: "en-ZA", name: "English (South Africa)", countryCode: "ZA", group: "English" },
  { code: "en-GH", name: "English (Ghana)", countryCode: "GH", group: "English" },

  // Spanish variants (1 base + 19 regional = 20 total)
  { code: "es", name: "Spanish (Spain)", countryCode: "ES", group: "Spanish" },
  { code: "es-MX", name: "Spanish (Mexico)", countryCode: "MX", group: "Spanish" },
  { code: "es-AR", name: "Spanish (Argentina)", countryCode: "AR", group: "Spanish" },
  { code: "es-CO", name: "Spanish (Colombia)", countryCode: "CO", group: "Spanish" },
  { code: "es-CL", name: "Spanish (Chile)", countryCode: "CL", group: "Spanish" },
  { code: "es-PE", name: "Spanish (Peru)", countryCode: "PE", group: "Spanish" },
  { code: "es-VE", name: "Spanish (Venezuela)", countryCode: "VE", group: "Spanish" },
  { code: "es-CR", name: "Spanish (Costa Rica)", countryCode: "CR", group: "Spanish" },
  { code: "es-PA", name: "Spanish (Panama)", countryCode: "PA", group: "Spanish" },
  { code: "es-GT", name: "Spanish (Guatemala)", countryCode: "GT", group: "Spanish" },
  { code: "es-HN", name: "Spanish (Honduras)", countryCode: "HN", group: "Spanish" },
  { code: "es-NI", name: "Spanish (Nicaragua)", countryCode: "NI", group: "Spanish" },
  { code: "es-SV", name: "Spanish (El Salvador)", countryCode: "SV", group: "Spanish" },
  { code: "es-BO", name: "Spanish (Bolivia)", countryCode: "BO", group: "Spanish" },
  { code: "es-PY", name: "Spanish (Paraguay)", countryCode: "PY", group: "Spanish" },
  { code: "es-UY", name: "Spanish (Uruguay)", countryCode: "UY", group: "Spanish" },
  { code: "es-DO", name: "Spanish (Dominican Republic)", countryCode: "DO", group: "Spanish" },
  { code: "es-PR", name: "Spanish (Puerto Rico)", countryCode: "PR", group: "Spanish" },
  { code: "es-EC", name: "Spanish (Ecuador)", countryCode: "EC", group: "Spanish" },
  { code: "es-US", name: "Spanish (United States)", countryCode: "US", group: "Spanish" },

  // Arabic variants (1 base + 13 regional = 14 total)
  { code: "ar", name: "Arabic (Saudi Arabia)", countryCode: "SA", group: "Arabic" },
  { code: "ar-EG", name: "Arabic (Egypt)", countryCode: "EG", group: "Arabic" },
  { code: "ar-AE", name: "Arabic (UAE)", countryCode: "AE", group: "Arabic" },
  { code: "ar-BH", name: "Arabic (Bahrain)", countryCode: "BH", group: "Arabic" },
  { code: "ar-IQ", name: "Arabic (Iraq)", countryCode: "IQ", group: "Arabic" },
  { code: "ar-JO", name: "Arabic (Jordan)", countryCode: "JO", group: "Arabic" },
  { code: "ar-KW", name: "Arabic (Kuwait)", countryCode: "KW", group: "Arabic" },
  { code: "ar-LB", name: "Arabic (Lebanon)", countryCode: "LB", group: "Arabic" },
  { code: "ar-OM", name: "Arabic (Oman)", countryCode: "OM", group: "Arabic" },
  { code: "ar-QA", name: "Arabic (Qatar)", countryCode: "QA", group: "Arabic" },
  { code: "ar-SY", name: "Arabic (Syria)", countryCode: "SY", group: "Arabic" },
  { code: "ar-LY", name: "Arabic (Libya)", countryCode: "LY", group: "Arabic" },
  { code: "ar-MA", name: "Arabic (Morocco)", countryCode: "MA", group: "Arabic" },
  { code: "ar-DZ", name: "Arabic (Algeria)", countryCode: "DZ", group: "Arabic" },

  // Other major languages with variants
  { code: "zh", name: "Chinese (Simplified)", countryCode: "CN", group: "Chinese" },
  { code: "zh-TW", name: "Chinese (Traditional)", countryCode: "TW", group: "Chinese" },
  { code: "zh-HK", name: "Chinese (Hong Kong)", countryCode: "HK", group: "Chinese" },
  
  { code: "fr", name: "French (France)", countryCode: "FR", group: "French" },
  { code: "fr-CA", name: "French (Canada)", countryCode: "CA", group: "French" },
  
  { code: "de", name: "German (Germany)", countryCode: "DE", group: "German" },
  { code: "de-AT", name: "German (Austria)", countryCode: "AT", group: "German" },
  { code: "de-CH", name: "German (Switzerland)", countryCode: "CH", group: "German" },
  
  { code: "pt", name: "Portuguese (Portugal)", countryCode: "PT", group: "Portuguese" },
  { code: "pt-br", name: "Portuguese (Brazil)", countryCode: "BR", group: "Portuguese" },

  // Single-variant languages (27 total)
  { code: "it", name: "Italian", countryCode: "IT" },
  { code: "ru", name: "Russian", countryCode: "RU" },
  { code: "ja", name: "Japanese", countryCode: "JP" },
  { code: "ko", name: "Korean", countryCode: "KR" },
  { code: "hi", name: "Hindi", countryCode: "IN" },
  { code: "nl", name: "Dutch", countryCode: "NL" },
  { code: "pl", name: "Polish", countryCode: "PL" },
  { code: "tr", name: "Turkish", countryCode: "TR" },
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
  { code: "gu", name: "Gujarati", countryCode: "IN" },
  { code: "kn", name: "Kannada", countryCode: "IN" },
  { code: "ml", name: "Malayalam", countryCode: "IN" },
  { code: "bg", name: "Bulgarian", countryCode: "BG" },
  { code: "hr", name: "Croatian", countryCode: "HR" },
  { code: "sk", name: "Slovak", countryCode: "SK" },
  { code: "sl", name: "Slovenian", countryCode: "SI" },
  { code: "ca", name: "Catalan", countryCode: "ES" },
  { code: "ms", name: "Malay", countryCode: "MY" },
  { code: "af", name: "Afrikaans", countryCode: "ZA" },
  { code: "sw", name: "Swahili", countryCode: "KE" },
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
