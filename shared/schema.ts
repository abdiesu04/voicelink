import { z } from "zod";

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
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]["code"];

// Room schema
export const roomSchema = z.object({
  id: z.string(),
  creatorLanguage: z.string(),
  participantLanguage: z.string().optional(),
  createdAt: z.date(),
  isActive: z.boolean(),
});

export const createRoomSchema = z.object({
  language: z.string(),
});

export type Room = z.infer<typeof roomSchema>;
export type CreateRoom = z.infer<typeof createRoomSchema>;

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
