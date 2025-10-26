import { z } from "zod";

// Supported languages for translation
export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
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
