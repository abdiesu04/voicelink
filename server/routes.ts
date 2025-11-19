import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage, db } from "./storage";
import axios from "axios";
import Stripe from "stripe";
import { PLAN_DETAILS, callRatings } from "@shared/schema";
import cookie from "cookie";
import signature from "cookie-signature";
import { Pool } from "@neondatabase/serverless";
import nodemailer from "nodemailer";
import multer from "multer";
import type { AuditEventType, InsertAuditLog } from "@shared/schema";

const sessionPool = new Pool({ connectionString: process.env.DATABASE_URL });
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required for WebSocket authentication');
}

// From javascript_stripe blueprint integration
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Multer configuration for file uploads (in-memory storage for email attachments)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (_req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Nodemailer configuration for sending contact form emails
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface RoomConnection {
  ws: WebSocket;
  roomId: string;
  language: string;
  voiceGender: "male" | "female";
  role: "creator" | "participant";
}

interface SessionTracking {
  roomId: string;
  userId: number;
  startTime: number;
  lastDeductionTime: number;
  intervalId: NodeJS.Timeout | null;
  isActive: boolean;
  pausedAt?: number; // Timestamp when session was paused (for credit fairness)
}

const connections = new Map<WebSocket, RoomConnection>();
const roomConnections = new Map<string, WebSocket[]>();
const activeSessions = new Map<string, SessionTracking>(); // roomId -> session tracking
const roomCleanupTimers = new Map<string, NodeJS.Timeout>(); // roomId -> cleanup timer (lightweight grace period)
const broadcastedMessageIds = new Map<string, Map<string, number>>(); // roomId -> Map<dedupeKey, timestamp> for TTL-based deduplication

// MOBILE FIX: WebSocket token authentication to replace cookie-based auth
// Tokens persist in client memory and survive mobile network switches/backgrounding
interface WebSocketToken {
  userId: number;
  createdAt: number;
}
export const wsTokens = new Map<string, WebSocketToken>(); // token -> userId mapping (exported for token revocation)
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Generate cryptographically secure random token
function generateWebSocketToken(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('base64url'); // URL-safe base64
}

// Revoke all WebSocket tokens for a specific user (called on logout)
export function revokeUserTokens(userId: number): number {
  let revokedCount = 0;
  for (const [token, tokenData] of wsTokens.entries()) {
    if (tokenData.userId === userId) {
      wsTokens.delete(token);
      revokedCount++;
    }
  }
  console.log(`[WebSocket Token] 🔒 Revoked ${revokedCount} tokens for user ${userId}`);
  return revokedCount;
}

// Cleanup expired tokens periodically
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  for (const [token, tokenData] of wsTokens.entries()) {
    if (now - tokenData.createdAt > TOKEN_EXPIRY_MS) {
      wsTokens.delete(token);
      cleanedCount++;
    }
  }
  if (cleanedCount > 0) {
    console.log(`[WebSocket Token] 🧹 Cleaned up ${cleanedCount} expired tokens`);
  }
}, 60 * 60 * 1000); // Run cleanup every hour

// AUDIT LOGGING: Non-blocking helper function to log pipeline events
async function logAudit(data: InsertAuditLog): Promise<void> {
  try {
    // Don't await - fire and forget to avoid blocking the main flow
    storage.createAuditLog({
      ...data,
      timestamp: new Date(), // Always set fresh timestamp
    }).catch((err) => {
      console.error('[Audit Log] Failed to write audit log:', err);
    });
  } catch (error) {
    console.error('[Audit Log] Error in logAudit helper:', error);
  }
}

// Grace period constant - keep room alive for mobile backgrounding recovery
const GRACE_PERIOD_MS = 60 * 1000; // 60 seconds

// Fuzzy matching deduplication: track recent messages per speaker to catch near-identical duplicates
interface RecentMessage {
  originalText: string;
  translatedText: string;
  timestamp: number;
}
const recentMessagesByRoomSpeaker = new Map<string, RecentMessage[]>(); // key: `${roomId}|${speaker}` -> last N messages

// SEQUENCE-BASED MESSAGE ORDERING: Eliminate reconnection replay duplicates
// Per-room sequence numbers provide canonical ordering and enable catch-up on reconnect
interface SequencedMessage {
  seq: number;
  messageId: string;
  originalText: string;
  translatedText: string;
  speaker: "creator" | "participant";
  originalLanguage: string;
  translatedLanguage: string;
  timestamp: number;
}

interface RoomSequenceState {
  nextSeq: number; // Next sequence number to assign (starts at 1)
  buffer: SequencedMessage[]; // Circular buffer of last 100 messages for catch-up
}

const roomSequences = new Map<string, RoomSequenceState>(); // roomId -> sequence state
const MAX_BUFFER_SIZE = 100; // Keep last 100 messages for reconnection catch-up

// Levenshtein distance for fuzzy text matching
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Calculate similarity ratio (0 to 1, where 1 is identical)
function textSimilarity(text1: string, text2: string): number {
  // Normalize: Unicode-aware normalization, lowercase, and remove punctuation/symbols
  // Uses NFKC normalization to handle Unicode variants, then removes only punctuation and symbols
  // This preserves non-Latin characters (Japanese, Arabic, Chinese, etc.)
  const normalize = (s: string) => s.normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}]/gu, '').trim();
  const a = normalize(text1);
  const b = normalize(text2);
  
  if (a === b) return 1.0;
  if (a.length === 0 && b.length === 0) return 1.0;
  if (a.length === 0 || b.length === 0) return 0.0;
  
  const maxLen = Math.max(a.length, b.length);
  const distance = levenshteinDistance(a, b);
  return 1 - (distance / maxLen);
}

// MOBILE FIX: Helper function to get userId from WebSocket - checks token first, then cookies
// Token-based auth survives mobile network switches and backgrounding
async function getUserIdFromWebSocketSession(req: any): Promise<number | null> {
  try {
    // PRIORITY 1: Check for token in query params (mobile-friendly, persistent)
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (token) {
      const tokenData = wsTokens.get(token);
      
      if (tokenData) {
        // Check if token is expired
        const age = Date.now() - tokenData.createdAt;
        if (age > TOKEN_EXPIRY_MS) {
          console.log('[WebSocket Auth] Token expired, removing');
          wsTokens.delete(token);
          // Fall through to cookie auth
        } else {
          console.log(`[WebSocket Auth] ✅ Token authenticated user ID: ${tokenData.userId}`);
          return tokenData.userId;
        }
      } else {
        console.log('[WebSocket Auth] Invalid token provided');
        // Fall through to cookie auth
      }
    }
    
    // PRIORITY 2: Fallback to cookie-based auth (for desktop/backwards compatibility)
    const cookies = cookie.parse(req.headers.cookie || '');
    const sessionCookieName = 'connect.sid';
    let signedSessionId = cookies[sessionCookieName];
    
    if (!signedSessionId) {
      console.log('[WebSocket Auth] No session cookie or token found');
      return null;
    }
    
    // Verify and unsign the session cookie (express-session adds 's:' prefix and HMAC signature)
    if (!signedSessionId.startsWith('s:')) {
      console.log('[WebSocket Auth] Invalid session cookie format');
      return null;
    }
    
    // Remove 's:' prefix and verify signature
    const unsignedValue = signature.unsign(signedSessionId.slice(2), SESSION_SECRET!);
    
    if (unsignedValue === false) {
      console.log('[WebSocket Auth] Invalid session cookie signature');
      return null;
    }
    
    const sessionId = unsignedValue;
    
    // Query session from PostgreSQL
    const result = await sessionPool.query(
      'SELECT sess FROM session WHERE sid = $1',
      [sessionId]
    );
    
    if (result.rows.length === 0) {
      console.log('[WebSocket Auth] Session not found in database');
      return null;
    }
    
    const sessionData = result.rows[0].sess;
    const userId = sessionData.userId || null;
    
    if (userId) {
      console.log(`[WebSocket Auth] 🍪 Cookie authenticated user ID: ${userId}`);
    } else {
      console.log('[WebSocket Auth] No userId in session');
    }
    
    return userId;
  } catch (error) {
    console.error('[WebSocket Auth] Error getting userId from session:', error);
    return null;
  }
}

function pauseSession(roomId: string) {
  const session = activeSessions.get(roomId);
  if (session && session.isActive && session.intervalId) {
    console.log(`[Session] ⏸️ Pausing credit deduction for room ${roomId}`);
    clearInterval(session.intervalId);
    session.intervalId = null;
    session.isActive = false;
    session.pausedAt = Date.now();
  }
}

function resumeSession(roomId: string) {
  const session = activeSessions.get(roomId);
  if (session && !session.isActive) {
    const userId = session.userId; // Get userId from stored session
    
    console.log(`[Session] ▶️ Resuming credit deduction for room ${roomId} (user ${userId})`);
    
    // Calculate time paused (for logging only - we don't charge during pause)
    const pausedDuration = session.pausedAt ? Math.floor((Date.now() - session.pausedAt) / 1000) : 0;
    console.log(`[Session] Was paused for ${pausedDuration}s - no credits deducted during pause`);
    
    session.isActive = true;
    session.pausedAt = undefined;
    session.lastDeductionTime = Date.now();
    
    // Restart credit deduction interval (use existing credit system - storage.consumeCredits)
    session.intervalId = setInterval(async () => {
      try {
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - session.lastDeductionTime) / 1000);
        
        if (elapsedSeconds >= 10) { // Match original 10-second deduction interval
          // Use storage.consumeCredits like the original code
          const result = await storage.consumeCredits(userId, 10);
          session.lastDeductionTime = currentTime;
          
          console.log(`[Credit Deduction] Deducted 10 credits from user ${userId}. Remaining: ${result.creditsRemaining}`);
          
          // Broadcast credit update to all clients in the room
          const clients = roomConnections.get(roomId) || [];
          clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'credit-update',
                creditsRemaining: result.creditsRemaining,
                exhausted: result.exhausted
              }));
            }
          });
          
          // If credits exhausted, end the session
          if (result.exhausted) {
            console.log(`[Credit Deduction] Credits exhausted for room ${roomId}`);
            await endSession(roomId, 'credits-exhausted');
          }
        }
      } catch (error) {
        console.error(`[Credit Deduction] Error for room ${roomId}:`, error);
      }
    }, 10000); // Check every 10 seconds
  }
}

async function endSession(roomId: string, reason: 'participant-left' | 'creator-left' | 'credits-exhausted') {
  console.log(`[Session] Ending session for room ${roomId}, reason: ${reason}`);
  
  // Cancel any pending grace timer
  const existingTimer = roomCleanupTimers.get(roomId);
  if (existingTimer) {
    console.log(`[Grace Period] ⏹️ Canceling grace timer during endSession for room ${roomId}`);
    clearTimeout(existingTimer);
    roomCleanupTimers.delete(roomId);
  }
  
  const session = activeSessions.get(roomId);
  if (session) {
    const totalDuration = Math.floor((Date.now() - session.startTime) / 1000);
    console.log(`[Session] Total duration: ${totalDuration}s`);
    
    if (session.intervalId) {
      clearInterval(session.intervalId);
    }
    session.isActive = false;
    activeSessions.delete(roomId);
  }
  
  const clients = roomConnections.get(roomId) || [];
  
  clients.forEach(client => {
    connections.delete(client);
    
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'session-ended',
        reason
      }));
      
      client.close(1000, `Session ended: ${reason}`);
    }
  });
  
  roomConnections.delete(roomId);
  broadcastedMessageIds.delete(roomId); // Clean up server-side deduplication tracking
  
  // Clean up fuzzy deduplication tracking for both creator and participant
  recentMessagesByRoomSpeaker.delete(`${roomId}|creator`);
  recentMessagesByRoomSpeaker.delete(`${roomId}|participant`);
  console.log(`[Memory Cleanup] 🧹 Cleared fuzzy dedup tracking for room ${roomId}`);
  
  // Clean up sequence buffer for this room
  const sequenceState = roomSequences.get(roomId);
  if (sequenceState) {
    console.log(`[Memory Cleanup] 🧹 Clearing sequence buffer for room ${roomId} (had ${sequenceState.buffer.length} messages, nextSeq was ${sequenceState.nextSeq})`);
    roomSequences.delete(roomId);
  }
  
  // CRITICAL FIX: Mark room as inactive instead of deleting it
  // Rooms will be cleaned up by background worker after 24h of inactivity
  try {
    await storage.updateRoom(roomId, { isActive: false, sessionEndedAt: new Date() });
    console.log(`[Session] ✅ Room ${roomId} marked as inactive in database`);
  } catch (error) {
    console.error(`[Session] ❌ Failed to mark room ${roomId} as inactive:`, error);
  }
  
  console.log(`[Session] Cleaned up room ${roomId}, notified ${clients.length} clients, cleared deduplication tracking`);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // MOBILE FIX: Generate WebSocket authentication token for mobile-friendly persistent auth
  // Tokens survive network switches and app backgrounding, unlike cookies
  app.get("/api/ws/token", async (req, res) => {
    try {
      // Enhanced logging for debugging - log ALL request details
      console.log(`[WebSocket Token] Request received:`, {
        ip: req.ip,
        sessionID: req.sessionID?.substring(0, 8) + '...',
        hasSession: !!req.session,
        userId: req.session?.userId || 'undefined',
        sessionKeys: req.session ? Object.keys(req.session) : [],
        cookies: req.cookies ? Object.keys(req.cookies) : [],
        signedCookies: req.signedCookies ? Object.keys(req.signedCookies) : [],
      });
      
      // CRITICAL FIX: Check session existence first
      if (!req.session) {
        console.log(`[WebSocket Token] ⚠️ No session object - returning 401`);
        return res.status(401).json({ error: "No session - authentication required" });
      }
      
      if (!req.session.userId) {
        console.log(`[WebSocket Token] ⚠️ Session exists but no userId - returning 401`);
        return res.status(401).json({ error: "Not logged in - authentication required" });
      }

      // Generate token
      console.log(`[WebSocket Token] Generating token for user ${req.session.userId}...`);
      const token = generateWebSocketToken();
      
      if (!token || token.length === 0) {
        throw new Error('Token generation failed - returned empty or null token');
      }
      
      // Store token with userId mapping
      wsTokens.set(token, {
        userId: req.session.userId,
        createdAt: Date.now()
      });
      
      console.log(`[WebSocket Token] ✅ Generated token for user ${req.session.userId}, token length: ${token.length}, total tokens in memory: ${wsTokens.size}`);
      
      res.json({ token });
    } catch (error: any) {
      console.error("[WebSocket Token] ❌ UNHANDLED ERROR:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
        sessionExists: !!req.session,
        userId: req.session?.userId || 'none',
        errorType: typeof error,
        errorKeys: Object.keys(error),
      });
      res.status(500).json({ 
        error: "Failed to generate token", 
        details: error.message,
        code: "TOKEN_GENERATION_ERROR"
      });
    }
  });

  app.post("/api/rooms/create", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Email verification is required to create rooms
      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      if (!user.isEmailVerified) {
        return res.status(403).json({ 
          error: "Email verification required",
          message: "Please verify your email address before creating translation rooms. Check your inbox for the verification email.",
          requiresVerification: true
        });
      }
      
      const { language, voiceGender } = req.body;
      
      if (!language) {
        return res.status(400).json({ error: "Language is required" });
      }
      
      if (!voiceGender) {
        return res.status(400).json({ error: "Voice gender is required" });
      }

      const room = await storage.createRoom(req.session.userId, language, voiceGender);
      
      res.json({ roomId: room.id });
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ error: "Failed to create room" });
    }
  });

  app.get("/api/rooms/:roomId", async (req, res) => {
    try {
      const { roomId } = req.params;
      const room = await storage.getRoom(roomId);
      
      if (!room) {
        return res.status(404).json({ error: "Room not found" });
      }

      res.json(room);
    } catch (error) {
      console.error("Error fetching room:", error);
      res.status(500).json({ error: "Failed to fetch room" });
    }
  });

  // Submit call rating
  app.post("/api/ratings", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const { roomId, rating, feedback } = req.body;

      if (!roomId) {
        return res.status(400).json({ error: "Room ID is required" });
      }

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }

      // Save rating to database
      await db.insert(callRatings).values({
        roomId,
        userId: req.session.userId,
        rating,
        feedback: feedback || null,
      });

      console.log(`[Call Rating] User ${req.session.userId} rated room ${roomId}: ${rating} stars${feedback ? ' with feedback' : ''}`);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving call rating:", error);
      res.status(500).json({ error: "Failed to save rating" });
    }
  });

  app.get("/api/speech/token", async (req, res) => {
    try {
      const speechKey = process.env.AZURE_SPEECH_KEY;
      const speechRegion = process.env.AZURE_SPEECH_REGION;

      if (!speechKey || !speechRegion) {
        return res.status(500).json({ error: "Azure Speech credentials not configured" });
      }

      const tokenResponse = await axios.post(
        `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
        '',
        {
          headers: {
            'Ocp-Apim-Subscription-Key': speechKey,
            'Content-Length': '0',
          },
        }
      );

      res.json({
        token: tokenResponse.data,
        region: speechRegion,
      });
    } catch (error) {
      console.error("Error getting speech token:", error);
      res.status(500).json({ error: "Failed to get speech token" });
    }
  });

  // Contact form submission - send email to support
  app.post("/api/contact", async (req, res) => {
    // CRITICAL: Check authentication BEFORE processing uploads to prevent spam
    if (!req.session.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Now that user is authenticated, process the upload
    upload.single('screenshot')(req, res, async (err) => {
      try {
        // Handle multer errors explicitly
        if (err) {
          if (err.message === 'Only image files are allowed') {
            return res.status(400).json({ error: "Only image files (PNG, JPG, etc.) are allowed" });
          }
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: "File size exceeds 5MB limit" });
          }
          return res.status(400).json({ error: err.message || "File upload error" });
        }

        const { category, message } = req.body;
        const screenshot = req.file;

        // Validate required fields
        if (!category || !message?.trim()) {
          return res.status(400).json({ error: "Category and message are required" });
        }

        // Validate category is one of the allowed values
        const validCategories = ['feature-request', 'bug-report', 'language-request', 'billing'];
        if (!validCategories.includes(category)) {
          return res.status(400).json({ error: "Invalid category" });
        }

        // Get user information
        const user = await storage.getUserById(req.session.userId!);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        // Verify email configuration before attempting to send
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
          console.error("[Contact Form] Email not configured - missing EMAIL_USER or EMAIL_PASS");
          return res.status(503).json({ 
            error: "Email service not configured. Please contact support directly at support@getvoztra.com" 
          });
        }

        // Prepare email content
        const categoryLabels: Record<string, string> = {
          'feature-request': 'Feature Request',
          'bug-report': 'Bug Report',
          'language-request': 'Language Request',
          'billing': 'Billing'
        };

        const categoryLabel = categoryLabels[category] || category;

        // Sanitize all user-controlled strings to prevent HTML injection
        // CRITICAL: Escape & first to prevent double-encoding attacks (e.g., "&lt;script&gt;" -> "<script>")
        const escapeHtml = (str: string) => str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
        const sanitizedMessage = escapeHtml(message).replace(/\n/g, '<br>');
        const sanitizedFilename = screenshot ? escapeHtml(screenshot.originalname) : '';

        const emailHtml = `
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${escapeHtml(user.email)} (User ID: ${user.id})</p>
          <p><strong>Category:</strong> ${categoryLabel}</p>
          <p><strong>Message:</strong></p>
          <p>${sanitizedMessage}</p>
          ${screenshot ? `<p><strong>Screenshot attached:</strong> ${sanitizedFilename}</p>` : ''}
          <hr>
          <p><em>Submitted via Voztra Contact Form</em></p>
        `;

        // Prepare email options
        const mailOptions: any = {
          from: process.env.EMAIL_USER,
          to: 'support@getvoztra.com',
          replyTo: user.email,
          subject: `[Voztra Contact] ${categoryLabel} from ${user.email}`,
          html: emailHtml,
        };

        // Add screenshot attachment if provided
        if (screenshot) {
          mailOptions.attachments = [{
            filename: screenshot.originalname,
            content: screenshot.buffer,
            contentType: screenshot.mimetype,
          }];
        }

        // Send email
        try {
          await emailTransporter.sendMail(mailOptions);
          console.log(`[Contact Form] ✅ Email sent from user ${user.id} (${user.email}), category: ${category}`);
        } catch (emailError: any) {
          console.error("[Contact Form] ❌ Email sending failed:", emailError);
          return res.status(503).json({ 
            error: "Failed to send email. Please try again or contact support@getvoztra.com directly",
            details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
          });
        }

        res.json({ success: true, message: "Your message has been sent successfully" });
      } catch (error: any) {
        console.error("[Contact Form] Error processing contact form:", error);
        res.status(500).json({ 
          error: "Failed to process your request", 
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    });
  });

  // Client-side audit logging endpoint
  app.post("/api/audit-log", async (req, res) => {
    try {
      // Authentication is optional for audit logs - we track userId if available
      const userId = req.session.userId || undefined;
      
      const { eventType, roomId, messageId, azureResultId, sequenceNumber, speaker, originalText, translatedText, languageFrom, languageTo, metadata } = req.body;
      
      if (!eventType) {
        return res.status(400).json({ error: "eventType is required" });
      }
      
      await storage.createAuditLog({
        eventType,
        roomId,
        userId,
        messageId,
        azureResultId,
        sequenceNumber,
        speaker,
        originalText,
        translatedText,
        languageFrom,
        languageTo,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      });
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Audit Log API] Error creating audit log:", error);
      res.status(500).json({ error: "Failed to create audit log" });
    }
  });

  // Query audit logs (admin/debugging endpoint)
  app.get("/api/audit-logs", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const { roomId, messageId, eventType, eventTypes, startTime, endTime, limit, includeAllUsers } = req.query;
      
      // SECURITY: If querying a specific room, verify the user owns that room
      if (roomId) {
        const room = await storage.getRoom(roomId as string);
        if (!room) {
          return res.status(404).json({ error: "Room not found" });
        }
        // Only the room creator can view audit logs for their room
        if (room.createdBy !== req.session.userId) {
          return res.status(403).json({ error: "Access denied: You can only view audit logs for rooms you created" });
        }
      }
      
      // Parse eventTypes if provided (comma-separated list)
      let eventTypesArray: any[] | undefined;
      if (eventTypes) {
        eventTypesArray = (eventTypes as string).split(',');
      } else if (eventType) {
        eventTypesArray = [eventType as string];
      }
      
      const logs = await storage.getAuditLogs({
        roomId: roomId as string | undefined,
        // Only filter by userId if includeAllUsers is NOT set (for debugging, allow viewing all logs)
        userId: includeAllUsers === 'true' ? undefined : req.session.userId,
        messageId: messageId as string | undefined,
        eventTypes: eventTypesArray,
        startTime: startTime ? new Date(startTime as string) : undefined,
        endTime: endTime ? new Date(endTime as string) : undefined,
        limit: limit ? parseInt(limit as string, 10) : 1000,
      });
      
      res.json({ logs });
    } catch (error: any) {
      console.error("[Audit Log API] Error querying audit logs:", error);
      res.status(500).json({ error: "Failed to query audit logs" });
    }
  });

  // Stripe Checkout Session - Create subscription checkout
  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { plan } = req.body;
      
      if (!plan || (plan !== 'starter' && plan !== 'pro')) {
        return res.status(400).json({ error: "Invalid plan. Must be 'starter' or 'pro'" });
      }

      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get or create Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user.id.toString(),
          },
        });
        customerId = customer.id;
        await storage.setUserStripeCustomerId(user.id, customerId);
      }

      // Get price ID from environment variable
      const priceId = plan === 'starter' 
        ? process.env.STRIPE_STARTER_PRICE_ID 
        : process.env.STRIPE_PRO_PRICE_ID;

      if (!priceId) {
        return res.status(500).json({ error: `Price ID not configured for ${plan} plan` });
      }

      // CRITICAL: Use req.headers.origin to preserve custom domain (getvoztra.com)
      // This ensures users are redirected back to the same domain they paid from
      const baseUrl = req.headers.origin || (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'https://getvoztra.com');
      
      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/pricing`,
        client_reference_id: user.id.toString(),
        metadata: {
          userId: user.id.toString(),
          plan,
        },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session", details: error.message });
    }
  });

  // Stripe Billing Portal - Manage subscription
  app.post("/api/create-billing-portal-session", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await storage.getUserById(req.session.userId);
      if (!user || !user.stripeCustomerId) {
        return res.status(400).json({ error: "No Stripe customer found. Please subscribe first." });
      }

      // CRITICAL: Use req.headers.origin to preserve custom domain (getvoztra.com)
      const baseUrl = req.headers.origin || (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'https://getvoztra.com');
      
      // Create billing portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${baseUrl}/account`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      // Enhanced error logging for Stripe issues
      console.error("Error creating billing portal session:", {
        message: error.message,
        type: error.type,
        code: error.code,
        statusCode: error.statusCode,
        requestId: error.requestId,
        raw: error.raw?.message,
      });
      res.status(500).json({ 
        error: "Failed to create billing portal session", 
        details: error.message,
        stripeErrorType: error.type,
        stripeErrorCode: error.code,
      });
    }
  });

  // Helper function: Activate subscription after successful payment (shared by webhooks and verification endpoint)
  async function activateSubscription(userId: number, plan: 'starter' | 'pro', stripeSubscriptionId: string, stripePriceId: string) {
    const currentSubscription = await storage.getSubscription(userId);
    
    // Idempotency: Skip ONLY if subscription already matches target plan, Stripe subscription ID, AND price ID
    if (
      currentSubscription?.plan === plan &&
      currentSubscription?.stripeSubscriptionId === stripeSubscriptionId &&
      currentSubscription?.stripePriceId === stripePriceId
    ) {
      console.log(`[Subscription] User ${userId} already has ${plan} plan with subscription ${stripeSubscriptionId} - skipping activation`);
      return currentSubscription;
    }

    console.log(`[Subscription] Activating ${plan} for user ${userId}, subscription ${stripeSubscriptionId}`);

    // Update user's subscription in database
    await storage.setSubscriptionStripeInfo(userId, stripeSubscriptionId, stripePriceId);
    
    // Calculate new credits: ADD plan minutes to existing balance (accumulate)
    const planDetails = PLAN_DETAILS[plan];
    const newCreditsInSeconds = planDetails.credits * 60;
    const currentCredits = currentSubscription?.creditsRemaining || 0;
    const totalCredits = currentCredits + newCreditsInSeconds;
    
    await storage.updateSubscription(userId, {
      plan,
      creditsRemaining: totalCredits,
      billingCycleStart: new Date(),
      billingCycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    console.log(`[Subscription] ✓ Activated ${plan} subscription for user ${userId}: added ${planDetails.credits} minutes to existing ${Math.floor(currentCredits/60)} minutes = ${Math.floor(totalCredits/60)} total minutes`);
    
    return await storage.getSubscription(userId);
  }

  // Payment Verification Endpoint - For development only when webhooks aren't available
  app.post("/api/payments/verify", async (req, res) => {
    // Security: Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: "Payment verification is only available in development. Use Stripe webhooks in production." });
    }

    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { sessionId } = req.body;
      
      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ error: "Valid session_id is required" });
      }

      // Retrieve the checkout session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // Verify session belongs to current user
      const userId = parseInt(session.metadata?.userId || session.client_reference_id || '0');
      if (userId !== req.session.userId) {
        return res.status(403).json({ error: "Session does not belong to current user" });
      }

      // Check payment status
      if (session.payment_status !== 'paid') {
        return res.status(400).json({ error: "Payment not completed", paymentStatus: session.payment_status });
      }

      // Verify it's a subscription
      if (session.mode !== 'subscription' || !session.subscription) {
        return res.status(400).json({ error: "Invalid session type" });
      }

      const plan = session.metadata?.plan as 'starter' | 'pro';
      if (!plan || (plan !== 'starter' && plan !== 'pro')) {
        return res.status(400).json({ error: "Invalid plan in session metadata" });
      }

      // Get subscription details
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0]?.price.id;

      if (!priceId) {
        return res.status(500).json({ error: "Price ID not found in subscription" });
      }

      // Activate subscription (idempotent)
      const updatedSubscription = await activateSubscription(userId, plan, subscription.id, priceId);

      res.json({
        success: true,
        subscription: updatedSubscription,
      });
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ error: "Failed to verify payment", details: error.message });
    }
  });

  // Payment Confirmation Endpoint - Verifies payment directly with Stripe API (PRODUCTION-SAFE FALLBACK)
  // This endpoint provides a fallback activation mechanism if webhooks fail or are delayed
  app.post("/api/payments/confirm", async (req, res) => {
    try {
      if (!req.session.userId) {
        console.warn("[Payment Confirm] Authentication required - session may have been lost during Stripe redirect");
        return res.status(401).json({ 
          error: "Authentication required",
          requiresLogin: true,
          message: "Please log in to complete activation" 
        });
      }

      const { sessionId } = req.body;
      
      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ error: "Valid session_id is required" });
      }

      console.log(`[Payment Confirm] User ${req.session.userId} requesting confirmation for session ${sessionId}`);

      // Retrieve the checkout session from Stripe API (authoritative source of truth)
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // Verify session belongs to current user
      const userId = parseInt(session.metadata?.userId || session.client_reference_id || '0');
      if (userId !== req.session.userId) {
        console.warn(`[Payment Confirm] Session ownership mismatch: session userId=${userId}, current userId=${req.session.userId}`);
        return res.status(403).json({ error: "Session does not belong to current user" });
      }

      // Check payment status
      if (session.payment_status !== 'paid') {
        console.log(`[Payment Confirm] Payment not complete: status=${session.payment_status}`);
        return res.status(400).json({ 
          error: "Payment not completed", 
          paymentStatus: session.payment_status 
        });
      }

      // Verify it's a subscription
      if (session.mode !== 'subscription' || !session.subscription) {
        console.warn(`[Payment Confirm] Invalid session type: mode=${session.mode}`);
        return res.status(400).json({ error: "Invalid session type" });
      }

      const plan = session.metadata?.plan as 'starter' | 'pro';
      if (!plan || (plan !== 'starter' && plan !== 'pro')) {
        console.warn(`[Payment Confirm] Invalid plan: ${plan}`);
        return res.status(400).json({ error: "Invalid plan in session metadata" });
      }

      // Get subscription details from Stripe
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0]?.price.id;

      if (!priceId) {
        console.error(`[Payment Confirm] Price ID not found in subscription ${subscription.id}`);
        return res.status(500).json({ error: "Price ID not found in subscription" });
      }

      console.log(`[Payment Confirm] Verified payment: plan=${plan}, subscriptionId=${subscription.id}`);

      // Activate subscription using shared idempotent helper
      const updatedSubscription = await activateSubscription(userId, plan, subscription.id, priceId);

      console.log(`[Payment Confirm] ✓ Subscription confirmed and activated for user ${userId}`);

      res.json({
        success: true,
        subscription: updatedSubscription,
        message: "Subscription activated successfully"
      });
    } catch (error: any) {
      console.error("[Payment Confirm] Error:", error);
      
      // Handle Stripe API errors gracefully
      if (error.type === 'StripeInvalidRequestError') {
        return res.status(400).json({ 
          error: "Invalid session ID", 
          details: error.message 
        });
      }
      
      res.status(500).json({ 
        error: "Failed to confirm payment", 
        details: error.message 
      });
    }
  });

  // Reconciliation Endpoint - Catches any missed payment activations (100% guarantee)
  // This endpoint queries Stripe for recent paid sessions and activates any that were missed
  // Can be called manually or by a cron job to ensure NO user is ever left without their subscription
  app.post("/api/payments/reconcile", async (req, res) => {
    try {
      // Optional: Add basic auth or API key for production security
      // For now, only allow in production or with explicit flag
      const allowReconciliation = process.env.ALLOW_RECONCILIATION === 'true' || process.env.NODE_ENV !== 'production';
      
      if (!allowReconciliation) {
        return res.status(403).json({ error: "Reconciliation endpoint requires ALLOW_RECONCILIATION=true" });
      }

      console.log("[Reconciliation] Starting payment reconciliation sweep...");

      // Query Stripe for ALL checkout sessions EVER with auto-pagination
      // No time filter ensures TRUE 100% guarantee - we catch every payment regardless of age
      const allSessions: Stripe.Checkout.Session[] = [];
      
      // Use Stripe's auto-pagination to fetch ALL sessions (no time limit for 100% guarantee)
      for await (const session of stripe.checkout.sessions.list({
        limit: 100, // Fetch in batches of 100
      })) {
        allSessions.push(session);
      }

      console.log(`[Reconciliation] Found ${allSessions.length} total sessions`);

      let processedCount = 0;
      let activatedCount = 0;
      let errorCount = 0;

      for (const session of allSessions) {
        // Only process paid subscription sessions
        if (session.payment_status !== 'paid' || session.mode !== 'subscription' || !session.subscription) {
          continue;
        }

        processedCount++;

        try {
          const userId = parseInt(session.metadata?.userId || session.client_reference_id || '0');
          const plan = session.metadata?.plan as 'starter' | 'pro';

          if (!userId || !plan || (plan !== 'starter' && plan !== 'pro')) {
            console.warn(`[Reconciliation] Skipping session ${session.id}: invalid userId or plan`);
            continue;
          }

          // Get Stripe subscription details to check if it's still active
          const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = stripeSubscription.items.data[0]?.price.id;

          if (!priceId) {
            console.warn(`[Reconciliation] Skipping session ${session.id}: no priceId found`);
            continue;
          }

          // CRITICAL: Only process ACTIVE subscriptions to avoid downgrading users
          // Skip canceled, past_due, or replaced subscriptions (user may have upgraded/downgraded)
          if (stripeSubscription.status !== 'active' && stripeSubscription.status !== 'trialing') {
            continue; // Skip inactive subscriptions silently
          }

          // CRITICAL: Verify plan/price consistency to prevent downgrades from in-place upgrades
          // If subscription was upgraded in-place, the priceId won't match the session's plan
          const expectedPriceId = PLAN_DETAILS[plan].priceId;
          if (priceId !== expectedPriceId) {
            // Price mismatch indicates this is an old session that was upgraded/downgraded
            // Skip it to avoid reverting the user to the old plan
            continue;
          }

          // Check current subscription status (may be undefined for new users)
          const currentSubscription = await storage.getSubscription(userId);

          // Check if already activated (all three values match)
          // Use optional chaining to handle missing subscription rows safely
          const alreadyActivated = 
            currentSubscription?.plan === plan &&
            currentSubscription?.stripeSubscriptionId === stripeSubscription.id &&
            currentSubscription?.stripePriceId === priceId;

          if (alreadyActivated) {
            continue; // Already activated, skip silently
          }

          // NOT ACTIVATED - This is a missed payment with ACTIVE subscription! Activate it now
          console.warn(`[Reconciliation] 🚨 FOUND UNACTIVATED PAYMENT: session=${session.id}, user=${userId}, plan=${plan}, status=${stripeSubscription.status}`);
          
          await activateSubscription(userId, plan, stripeSubscription.id, priceId);
          activatedCount++;

          console.log(`[Reconciliation] ✅ Successfully activated missed payment for user ${userId}`);
        } catch (error: any) {
          errorCount++;
          console.error(`[Reconciliation] Error processing session ${session.id}:`, error);
        }
      }

      const result = {
        success: true,
        totalSessions: allSessions.length,
        processedSessions: processedCount,
        activatedPayments: activatedCount,
        errors: errorCount,
        timestamp: new Date().toISOString(),
      };

      console.log(`[Reconciliation] ✓ Sweep complete:`, result);

      res.json(result);
    } catch (error: any) {
      console.error("[Reconciliation] Failed:", error);
      res.status(500).json({ 
        error: "Reconciliation failed", 
        details: error.message 
      });
    }
  });

  // Stripe Webhook Handler - Process subscription lifecycle events
  app.post("/api/webhooks/stripe", async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    if (!sig) {
      return res.status(400).json({ error: "No stripe-signature header" });
    }

    let event: Stripe.Event;

    try {
      // Use rawBody saved by express.json verify callback
      const rawBody = (req as any).rawBody;
      if (!rawBody) {
        throw new Error("Raw body not available");
      }
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: any) {
      console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    try {
      // Handle specific events
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          console.log(`[Stripe Webhook] Checkout completed for session: ${session.id}`);

          if (session.mode === 'subscription' && session.subscription && session.customer) {
            const userId = parseInt(session.metadata?.userId || session.client_reference_id || '0');
            const plan = session.metadata?.plan as 'starter' | 'pro';

            if (!userId || !plan) {
              console.error('[Stripe Webhook] Missing userId or plan in session metadata');
              break;
            }

            // Get the subscription and price details
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            const priceId = subscription.items.data[0]?.price.id;

            if (!priceId) {
              console.error('[Stripe Webhook] No price ID found in subscription');
              break;
            }

            // Activate subscription using shared helper (idempotent)
            await activateSubscription(userId, plan, subscription.id, priceId);
          }
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as any; // Use any to handle Stripe API inconsistencies
          console.log(`[Stripe Webhook] Invoice paid: ${invoice.id}`);

          // Reset monthly credits on recurring invoice payment
          const subscriptionId = typeof invoice.subscription === 'string' 
            ? invoice.subscription 
            : invoice.subscription?.id || null;

          if (invoice.billing_reason === 'subscription_cycle' && subscriptionId) {
            const subscription = await storage.getSubscriptionByStripeId(subscriptionId);
            
            if (subscription) {
              const planDetails = PLAN_DETAILS[subscription.plan];
              const creditsInSeconds = planDetails.credits * 60;
              
              await storage.updateSubscription(subscription.userId, {
                creditsRemaining: creditsInSeconds,
                billingCycleStart: new Date(),
                billingCycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              });

              console.log(`[Stripe Webhook] Reset credits for user ${subscription.userId}`);
            }
          }
          break;
        }

        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`[Stripe Webhook] Subscription updated: ${subscription.id}`);

          const dbSubscription = await storage.getSubscriptionByStripeId(subscription.id);
          if (dbSubscription) {
            // Check if plan changed (upgrade/downgrade)
            const priceId = subscription.items.data[0]?.price.id;
            if (priceId !== dbSubscription.stripePriceId) {
              // Plan changed - determine new plan
              const newPlan = priceId === process.env.STRIPE_STARTER_PRICE_ID ? 'starter' 
                : priceId === process.env.STRIPE_PRO_PRICE_ID ? 'pro' 
                : dbSubscription.plan;

              if (newPlan !== dbSubscription.plan) {
                const planDetails = PLAN_DETAILS[newPlan];
                const creditsInSeconds = planDetails.credits * 60;

                await storage.updateSubscription(dbSubscription.userId, {
                  plan: newPlan,
                  creditsRemaining: creditsInSeconds,
                  stripePriceId: priceId,
                });

                console.log(`[Stripe Webhook] Plan changed to ${newPlan} for user ${dbSubscription.userId}`);
              }
            }
          }
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`[Stripe Webhook] Subscription canceled: ${subscription.id}`);

          const dbSubscription = await storage.getSubscriptionByStripeId(subscription.id);
          if (dbSubscription) {
            // Downgrade to free tier with lifetime 60 minutes
            await storage.updateSubscription(dbSubscription.userId, {
              plan: 'free',
              creditsRemaining: 60 * 60, // 60 minutes in seconds
              billingCycleEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // 100 years (lifetime)
            });

            await storage.clearSubscriptionStripeInfo(dbSubscription.userId);

            console.log(`[Stripe Webhook] Downgraded user ${dbSubscription.userId} to free tier`);
          }
          break;
        }

        default:
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
      }

      // Acknowledge receipt
      res.json({ received: true });
    } catch (error: any) {
      console.error(`[Stripe Webhook] Error processing event: ${error.message}`);
      res.status(500).json({ error: "Webhook handler failed", details: error.message });
    }
  });

  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req: any) => {
    const connectionStartTime = Date.now();
    console.log('[WebSocket] New connection established');
    
    // Store the HTTP request for session access
    (ws as any).upgradeReq = req;
    
    // MOBILE FIX: Native WebSocket keepalive - prevents mobile carrier proxy timeout
    // Mobile carriers often terminate idle connections after 15 seconds
    // Protocol-level pings (ws.ping) are recognized by proxies, unlike application JSON messages
    let isAlive = true;
    
    ws.on('pong', () => {
      isAlive = true;
      console.log('[Keepalive] 💚 Received pong - connection healthy');
    });

    const pingInterval = setInterval(() => {
      if (!isAlive) {
        console.log('[Keepalive] ❌ No pong received - terminating stale connection');
        clearInterval(pingInterval);
        return ws.terminate();
      }
      
      isAlive = false;
      console.log('[Keepalive] 💓 Sending protocol-level ping');
      ws.ping();
    }, 10000); // 10 seconds - prevents mobile carrier 15s idle timeout

    ws.on('message', async (data: Buffer) => {
      // ANY message from client proves connection is alive (fixes disconnection during heavy Azure operations)
      isAlive = true;
      
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'join') {
          const { roomId, language, voiceGender, role, lastReceivedSeq } = message;
          const clientLastSeq = lastReceivedSeq || 0; // Default to 0 for first-time connections
          
          if (!language) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Language is required'
            }));
            return;
          }
          
          if (!voiceGender) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Voice gender is required'
            }));
            return;
          }

          // Get authenticated userId from session (security: never trust client-supplied userId)
          const req = (ws as any).upgradeReq;
          const userId = await getUserIdFromWebSocketSession(req);

          // Only require authentication for room creators (they pay for credits)
          // Participants join as guests via invite link - no login required
          if (role === 'creator' && !userId) {
            ws.send(JSON.stringify({
              type: 'error',
              error: 'Authentication required',
              message: 'Please log in to create a translation session',
              requiresAuth: true
            }));
            ws.close();
            return;
          }
          
          // Note: Email verification temporarily disabled for testing
          // TODO: Re-enable email verification before production deployment
          
          const room = await storage.getRoom(roomId);
          if (!room) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Room not found'
            }));
            return;
          }

          // CRITICAL FIX: Cancel grace period cleanup timer if user is reconnecting
          const existingTimer = roomCleanupTimers.get(roomId);
          if (existingTimer) {
            console.log(`[Grace Period] ✅ User reconnected to room ${roomId} - canceling cleanup timer`);
            clearTimeout(existingTimer);
            roomCleanupTimers.delete(roomId);
            
            // Resume credit deduction (gets userId from existing session)
            resumeSession(roomId);
            
            // Notify any existing clients that peer has reconnected
            const existingClients = roomConnections.get(roomId) || [];
            existingClients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'peer-reconnected'
                }));
              }
            });
            
            // CRITICAL FIX: Re-send partner info to reconnecting user
            // This fixes the bug where tab backgrounding causes partnerVoiceGender to stay undefined
            console.log(`[Reconnection] Re-sending partner info to reconnecting ${role}`);
            const existingPartners = existingClients.filter(c => c !== ws && c.readyState === WebSocket.OPEN);
            if (existingPartners.length > 0) {
              // Get partner's connection data
              const partnerConnection = connections.get(existingPartners[0]);
              if (partnerConnection) {
                console.log(`[Reconnection] Sending partner's voice gender (${partnerConnection.voiceGender}) and language (${partnerConnection.language}) to reconnecting user`);
                ws.send(JSON.stringify({
                  type: 'participant-joined',
                  roomId,
                  language: partnerConnection.language,
                  voiceGender: partnerConnection.voiceGender
                }));
              }
            }
          }

          connections.set(ws, { ws, roomId, language, voiceGender, role });
          
          if (!roomConnections.has(roomId)) {
            roomConnections.set(roomId, []);
          }
          roomConnections.get(roomId)?.push(ws);

          // CRITICAL FIX: Send partner info to joining/reconnecting user from database
          // This handles cases where partner info wasn't sent during grace period reconnection
          if (role === 'creator' && room.participantLanguage && room.participantVoiceGender) {
            console.log(`[Join] Creator joined/reconnected - sending participant info from database`);
            console.log(`[Join] Participant language: ${room.participantLanguage}, gender: ${room.participantVoiceGender}`);
            ws.send(JSON.stringify({
              type: 'participant-joined',
              roomId,
              language: room.participantLanguage,
              voiceGender: room.participantVoiceGender
            }));
          }

          if (role === 'participant') {
            await storage.updateRoom(roomId, { 
              participantLanguage: language,
              participantVoiceGender: voiceGender 
            });
            
            console.log(`[Join] Participant joined with gender: ${voiceGender}`);
            console.log(`[Join] Sending creator's gender to participant: ${room.creatorVoiceGender}`);
            
            // Send creator's info to the participant
            ws.send(JSON.stringify({
              type: 'participant-joined',
              roomId,
              language: room.creatorLanguage,
              voiceGender: room.creatorVoiceGender
            }));
            
            console.log(`[Join] Sending participant's gender to creator: ${voiceGender}`);
            
            // Notify creator that participant joined
            const roomClients = roomConnections.get(roomId) || [];
            roomClients.forEach(client => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'participant-joined',
                  roomId,
                  language,
                  voiceGender
                }));
              }
            });

            // Start credit tracking session
            if (!activeSessions.has(roomId)) {
              console.log(`[Credit Tracking] Starting session for room ${roomId}`);
              const now = Date.now();
              
              // Get creator's subscription to send initial credit balance
              const creatorSubscription = await storage.getSubscription(room.userId);
              const initialCredits = creatorSubscription?.creditsRemaining || 0;
              
              // Start interval to deduct credits every 10 seconds
              const intervalId = setInterval(async () => {
                const session = activeSessions.get(roomId);
                if (!session || !session.isActive) {
                  clearInterval(intervalId);
                  return;
                }

                const now = Date.now();
                const elapsedSinceLastDeduction = Math.floor((now - session.lastDeductionTime) / 1000);
                
                if (elapsedSinceLastDeduction >= 10) {
                  // Deduct 10 seconds worth of credits using consumeCredits
                  const result = await storage.consumeCredits(room.userId, 10);
                  session.lastDeductionTime = now;
                  
                  console.log(`[Credit Tracking] Deducted 10 credits from user ${room.userId}. Remaining: ${result.creditsRemaining}`);
                  
                  // Broadcast credit update to all clients in the room
                  const clients = roomConnections.get(roomId) || [];
                  clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                      client.send(JSON.stringify({
                        type: 'credit-update',
                        creditsRemaining: result.creditsRemaining,
                        exhausted: result.exhausted
                      }));
                    }
                  });

                  // If credits exhausted, end the session for everyone
                  if (result.exhausted) {
                    console.log(`[Credit Tracking] Credits exhausted for room ${roomId}`);
                    await endSession(roomId, 'credits-exhausted');
                  }
                }
              }, 10000); // Check every 10 seconds

              activeSessions.set(roomId, {
                roomId,
                userId: room.userId,
                startTime: now,
                lastDeductionTime: now,
                intervalId,
                isActive: true
              });

              // Send session-started event with initial credit balance
              roomClients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'session-started',
                    creditsRemaining: initialCredits
                  }));
                }
              });

              console.log(`[Credit Tracking] Session started with ${initialCredits} credits remaining`);
            }
          }
          
          // CATCH-UP LOGIC: Send buffered messages that client hasn't received yet
          // This prevents duplicate audio on reconnection while ensuring no messages are missed
          const sequenceState = roomSequences.get(roomId);
          if (sequenceState && clientLastSeq > 0) {
            // Find messages with seq > clientLastSeq
            const missedMessages = sequenceState.buffer.filter(msg => msg.seq > clientLastSeq);
            
            if (missedMessages.length > 0) {
              console.log(`[Sequence Catch-up] 📦 Client reconnected with lastSeq=${clientLastSeq}`);
              console.log(`[Sequence Catch-up] 📨 Sending ${missedMessages.length} missed messages (seq ${missedMessages[0].seq} to ${missedMessages[missedMessages.length - 1].seq})`);
              
              // Send missed messages in order
              for (const msg of missedMessages) {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({
                    type: 'translation',
                    roomId,
                    seq: msg.seq,
                    messageId: msg.messageId,
                    originalText: msg.originalText,
                    translatedText: msg.translatedText,
                    speaker: msg.speaker,
                    originalLanguage: msg.originalLanguage,
                    translatedLanguage: msg.translatedLanguage
                  }));
                }
              }
              
              console.log(`[Sequence Catch-up] ✅ Catch-up complete. Client is now synced to seq=${sequenceState.nextSeq - 1}`);
            } else {
              console.log(`[Sequence Catch-up] ✨ Client is up-to-date (lastSeq=${clientLastSeq}, latest=${sequenceState.nextSeq - 1})`);
            }
          } else if (clientLastSeq === 0) {
            console.log(`[Sequence Catch-up] 🆕 First-time connection (lastSeq=0), no catch-up needed`);
          }
        }

        // Application-level ping/pong for keeping connection alive through proxies
        if (message.type === 'ping') {
          const connInfo = connections.get(ws);
          console.log(`[Heartbeat-Server] 💓 Received ping from client (role: ${connInfo?.role}, language: ${connInfo?.language}), sending pong`);
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        if (message.type === 'transcription') {
          const { roomId, text, language, interim, offset, duration } = message;
          const connection = connections.get(ws);
          
          if (!connection) return;

          try {
            if (!text || text.trim().length === 0) {
              return;
            }
            
            // Validate and normalize offset/duration - ensure they're valid numbers or undefined
            const validOffset = (typeof offset === 'number' && !isNaN(offset)) ? offset : undefined;
            const validDuration = (typeof duration === 'number' && !isNaN(duration)) ? duration : undefined;
            
            // Handle interim transcriptions (partial results)
            if (interim === true) {
              console.log(`[Transcription-Interim] Received text: "${text}", language: ${language}`);
              
              // Broadcast interim transcription directly without translation
              const roomClients = roomConnections.get(roomId) || [];
              roomClients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'transcription',
                    roomId,
                    text,
                    speaker: connection.role,
                    language,
                    interim: true
                  }));
                }
              });
              return;
            }
            
            // Handle final transcriptions (recognized speech)
            const transcriptionTimestamp = Date.now();
            console.log(`[Transcription-Final] ⏱️ Timestamp: ${transcriptionTimestamp}, Received text: "${text}", language: ${language}, speaker: ${connection.role}`);
            
            // AUDIT LOG: WebSocket received transcription from client
            logAudit({
              eventType: 'WS_RECEIVE',
              roomId,
              speaker: connection.role,
              originalText: text,
              languageFrom: language,
              offset: validOffset?.toString(),
              duration: validDuration?.toString(),
              metadata: JSON.stringify({ interim: false }),
            });
            
            const room = await storage.getRoom(roomId);
            if (!room) return;

            const targetLanguage = connection.role === 'creator' 
              ? room.participantLanguage 
              : room.creatorLanguage;

            if (!targetLanguage) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Participant has not joined yet'
              }));
              return;
            }

            // AUDIT LOG: Translation request to Azure
            logAudit({
              eventType: 'TRANSLATION_REQUEST',
              roomId,
              speaker: connection.role,
              originalText: text,
              languageFrom: language,
              languageTo: targetLanguage,
              offset: validOffset?.toString(),
              duration: validDuration?.toString(),
            });

            const translatedText = await translateText(text, language, targetLanguage);
            const translationCompleteTimestamp = Date.now();
            console.log(`[Translation] ⏱️ Translation completed in ${translationCompleteTimestamp - transcriptionTimestamp}ms: "${text}" → "${translatedText}"`);
            
            // AUDIT LOG: Translation response received
            logAudit({
              eventType: 'TRANSLATION_RESPONSE',
              roomId,
              speaker: connection.role,
              originalText: text,
              translatedText,
              languageFrom: language,
              languageTo: targetLanguage,
              offset: validOffset?.toString(),
              duration: validDuration?.toString(),
              metadata: JSON.stringify({ durationMs: translationCompleteTimestamp - transcriptionTimestamp }),
            });

            const now = Date.now();
            
            // FUZZY MATCHING DEDUPLICATION: Multi-tier approach to catch all duplicate scenarios
            // Tier 1: Azure Speech SDK rescoring (same original, different translation due to number/name errors)
            // Tier 2: Normal duplicates (both original and translated are similar)
            const ORIGINAL_ONLY_THRESHOLD = 0.98; // 98% - High threshold for catching Azure rescoring (typically 100% identical)
            const FUZZY_SIMILARITY_THRESHOLD = 0.82; // 82% - Lower threshold when BOTH original and translated match
            const FUZZY_TIME_WINDOW_MS = 2000; // 2 seconds - duplicates arrive within this window
            const MAX_RECENT_MESSAGES = 5; // Compare against last 5 messages per speaker
            
            const speakerKey = `${roomId}|${connection.role}`;
            if (!recentMessagesByRoomSpeaker.has(speakerKey)) {
              recentMessagesByRoomSpeaker.set(speakerKey, []);
            }
            
            const recentMessages = recentMessagesByRoomSpeaker.get(speakerKey)!;
            
            // Clean up old messages outside time window
            const validMessages = recentMessages.filter(msg => now - msg.timestamp <= FUZZY_TIME_WINDOW_MS);
            recentMessagesByRoomSpeaker.set(speakerKey, validMessages);
            
            // Check similarity against recent messages
            for (const recentMsg of validMessages) {
              const originalSimilarity = textSimilarity(text, recentMsg.originalText);
              const translatedSimilarity = textSimilarity(translatedText, recentMsg.translatedText);
              const timeSinceOriginal = now - recentMsg.timestamp;
              
              // TIER 1: Azure Speech SDK Rescoring Detection (Language-Agnostic)
              // Blocks when ORIGINAL text is nearly identical, regardless of translation differences
              // This catches Azure rescoring the same utterance with different interpretations
              // Example: "16 people killed" → "41016 people killed" (same Bengali source, different number recognition)
              if (originalSimilarity >= ORIGINAL_ONLY_THRESHOLD) {
                console.warn(`[Azure Rescoring] ⛔ DUPLICATE BLOCKED - Azure Speech SDK double-fired with same original text!`);
                console.warn(`[Azure Rescoring] 📝 First:   "${recentMsg.originalText}" → "${recentMsg.translatedText}"`);
                console.warn(`[Azure Rescoring] 🔁 Second:  "${text}" → "${translatedText}"`);
                console.warn(`[Azure Rescoring] 📊 Original similarity: ${(originalSimilarity * 100).toFixed(1)}% (threshold: ${(ORIGINAL_ONLY_THRESHOLD * 100).toFixed(0)}%)`);
                console.warn(`[Azure Rescoring] 📊 Translation similarity: ${(translatedSimilarity * 100).toFixed(1)}% (different due to rescoring)`);
                console.warn(`[Azure Rescoring] ⏱️ Time between utterances: ${timeSinceOriginal}ms (window: ${FUZZY_TIME_WINDOW_MS}ms)`);
                console.warn(`[Azure Rescoring] 🔍 This is Azure's rescoring behavior - same speech recognized twice with different accuracy`);
                
                // AUDIT LOG: Tier 1 dedup blocked
                logAudit({
                  eventType: 'DEDUP_TIER1_BLOCK',
                  roomId,
                  speaker: connection.role,
                  originalText: text,
                  translatedText,
                  languageFrom: language,
                  languageTo: targetLanguage,
                  metadata: JSON.stringify({
                    originalSimilarity,
                    translatedSimilarity,
                    timeSinceOriginalMs: timeSinceOriginal,
                    firstOriginal: recentMsg.originalText,
                    firstTranslated: recentMsg.translatedText,
                  }),
                });
                
                return; // Block this Azure-generated duplicate
              }
              
              // TIER 2: Standard Fuzzy Matching (Both Original AND Translated Similar)
              // Catches normal duplicates where both texts are similar
              // Example: "Former president" vs "Formal president" (typo/minor differences in both)
              if (originalSimilarity >= FUZZY_SIMILARITY_THRESHOLD && translatedSimilarity >= FUZZY_SIMILARITY_THRESHOLD) {
                // NUMERIC-DELTA BYPASS: Allow messages where only numbers differ
                // Extract numbers from all four texts
                const extractNumbers = (txt: string): string[] => {
                  return (txt.match(/\d+/g) || []);
                };
                
                const originalNumbers1 = extractNumbers(recentMsg.originalText).join(',');
                const originalNumbers2 = extractNumbers(text).join(',');
                const translatedNumbers1 = extractNumbers(recentMsg.translatedText).join(',');
                const translatedNumbers2 = extractNumbers(translatedText).join(',');
                
                // If both original AND translated contain numbers, and those numbers differ, allow it
                const hasNumbers = (originalNumbers1 || originalNumbers2) && (translatedNumbers1 || translatedNumbers2);
                const numbersDiffer = originalNumbers1 !== originalNumbers2 || translatedNumbers1 !== translatedNumbers2;
                
                if (hasNumbers && numbersDiffer) {
                  console.log(`[Numeric Bypass] ✅ ALLOWED - Numbers differ (legitimate correction)`);
                  console.log(`[Numeric Bypass] 📝 Original numbers: "${originalNumbers1}" → "${originalNumbers2}"`);
                  console.log(`[Numeric Bypass] 📝 Translated numbers: "${translatedNumbers1}" → "${translatedNumbers2}"`);
                  console.log(`[Numeric Bypass] 📊 Text similarity: Original=${(originalSimilarity * 100).toFixed(1)}%, Translated=${(translatedSimilarity * 100).toFixed(1)}%`);
                  console.log(`[Numeric Bypass] 🔍 This is likely a legitimate number correction (e.g., "3 PM" → "5 PM")`);
                  
                  // AUDIT LOG: Tier 2 numeric bypass
                  logAudit({
                    eventType: 'DEDUP_TIER2_BYPASS',
                    roomId,
                    speaker: connection.role,
                    originalText: text,
                    translatedText,
                    languageFrom: language,
                    languageTo: targetLanguage,
                    metadata: JSON.stringify({
                      originalSimilarity,
                      translatedSimilarity,
                      originalNumbers: `${originalNumbers1} → ${originalNumbers2}`,
                      translatedNumbers: `${translatedNumbers1} → ${translatedNumbers2}`,
                    }),
                  });
                  
                  // Don't return - allow this message through
                } else {
                  // No number differences - block as duplicate
                  console.warn(`[Fuzzy Deduplication] ⛔ NEAR-DUPLICATE DETECTED AND BLOCKED!`);
                  console.warn(`[Fuzzy Deduplication] 📝 Original: "${recentMsg.originalText}" → "${recentMsg.translatedText}"`);
                  console.warn(`[Fuzzy Deduplication] 🔁 Current:  "${text}" → "${translatedText}"`);
                  console.warn(`[Fuzzy Deduplication] 📊 Similarity: Original=${(originalSimilarity * 100).toFixed(1)}%, Translated=${(translatedSimilarity * 100).toFixed(1)}%`);
                  console.warn(`[Fuzzy Deduplication] ⏱️ Time since first message: ${timeSinceOriginal}ms (window: ${FUZZY_TIME_WINDOW_MS}ms)`);
                  console.warn(`[Fuzzy Deduplication] 🔍 This is likely Azure Speech SDK producing slightly different transcriptions of the same audio`);
                  
                  // AUDIT LOG: Tier 2 dedup blocked
                  logAudit({
                    eventType: 'DEDUP_TIER2_BLOCK',
                    roomId,
                    speaker: connection.role,
                    originalText: text,
                    translatedText,
                    languageFrom: language,
                    languageTo: targetLanguage,
                    metadata: JSON.stringify({
                      originalSimilarity,
                      translatedSimilarity,
                      timeSinceOriginalMs: timeSinceOriginal,
                      firstOriginal: recentMsg.originalText,
                      firstTranslated: recentMsg.translatedText,
                    }),
                  });
                  
                  return; // Block this duplicate
                }
              }
            }
            
            // Add current message to recent messages (keep only last N)
            validMessages.push({
              originalText: text,
              translatedText,
              timestamp: now
            });
            if (validMessages.length > MAX_RECENT_MESSAGES) {
              validMessages.shift(); // Remove oldest
            }
            console.log(`[Fuzzy Deduplication] ✅ Message passed fuzzy check. Recent messages for speaker: ${validMessages.length}`);
            
            // AUDIT LOG: Message passed all fuzzy dedup checks
            logAudit({
              eventType: 'DEDUP_PASSED',
              roomId,
              speaker: connection.role,
              originalText: text,
              translatedText,
              languageFrom: language,
              languageTo: targetLanguage,
              offset: validOffset?.toString(),
              duration: validDuration?.toString(),
              metadata: JSON.stringify({ recentMessagesCount: validMessages.length }),
            });

            // Update room activity timestamp (for 24h cleanup)
            await storage.updateRoomActivity(roomId);

            // SERVER-SIDE DEDUPLICATION: Create content-based stable key WITHOUT timestamp
            // This prevents Azure Speech SDK from triggering duplicate broadcasts if 'recognized' event fires twice
            // Use full text (not truncated) to avoid false positives from long messages with shared prefixes
            const dedupeKey = `${connection.role}|${text}|${translatedText}`;
            const DEDUPE_TTL_MS = 5000; // 5 second TTL: same content within 5s = duplicate, after 5s = legitimate repetition
            
            if (!broadcastedMessageIds.has(roomId)) {
              broadcastedMessageIds.set(roomId, new Map());
            }
            
            const roomMessageTracker = broadcastedMessageIds.get(roomId)!;
            
            // Clean up expired entries (older than TTL)
            const expiredKeys: string[] = [];
            roomMessageTracker.forEach((timestamp, key) => {
              if (now - timestamp > DEDUPE_TTL_MS) {
                expiredKeys.push(key);
              }
            });
            expiredKeys.forEach(key => roomMessageTracker.delete(key));
            if (expiredKeys.length > 0) {
              console.log(`[Server Deduplication] 🧹 Cleaned up ${expiredKeys.length} expired dedupe entries (TTL: ${DEDUPE_TTL_MS}ms)`);
            }
            
            // Check if this content was already broadcast within TTL window
            const lastBroadcastTime = roomMessageTracker.get(dedupeKey);
            if (lastBroadcastTime !== undefined) {
              const timeSinceLastBroadcast = now - lastBroadcastTime;
              console.warn(`[Server Deduplication] ⛔ DUPLICATE BROADCAST PREVENTED!`);
              console.warn(`[Server Deduplication] 📝 Text: "${text}" → "${translatedText}"`);
              console.warn(`[Server Deduplication] ⏱️ Last broadcast: ${timeSinceLastBroadcast}ms ago (TTL: ${DEDUPE_TTL_MS}ms)`);
              console.warn(`[Server Deduplication] 🔍 This likely means Azure Speech SDK fired the 'recognized' event twice for the same utterance`);
              
              // AUDIT LOG: Content-based dedup blocked
              logAudit({
                eventType: 'DEDUP_CONTENT_BLOCK',
                roomId,
                speaker: connection.role,
                originalText: text,
                translatedText,
                languageFrom: language,
                languageTo: targetLanguage,
                metadata: JSON.stringify({
                  timeSinceLastBroadcastMs: timeSinceLastBroadcast,
                  dedupeKey,
                }),
              });
              
              return; // Don't broadcast again - this is a true duplicate from Azure
            }
            
            // Mark content as broadcast with current timestamp
            roomMessageTracker.set(dedupeKey, now);
            console.log(`[Server Deduplication] ✅ New content added to broadcast tracker. Room ${roomId} has ${roomMessageTracker.size} tracked messages`);
            
            // NOW generate unique messageId for client-side tracking (each broadcast gets unique ID)
            const messageId = `${connection.role}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            console.log(`[Server Deduplication] 🆔 Generated messageId: ${messageId} for content hash`);
            
            // Additional cleanup: cap total entries to prevent unbounded growth (should never hit this with TTL cleanup)
            if (roomMessageTracker.size > 200) {
              const entriesToDelete = Array.from(roomMessageTracker.entries())
                .sort((a, b) => a[1] - b[1]) // Sort by timestamp, oldest first
                .slice(0, 100) // Delete oldest 100
                .map(([key]) => key);
              
              entriesToDelete.forEach(key => roomMessageTracker.delete(key));
              console.log(`[Server Deduplication] 🧹 Emergency cleanup: removed ${entriesToDelete.length} oldest entries. New size: ${roomMessageTracker.size}`);
            }
            
            // SEQUENCE ASSIGNMENT: Assign incrementing sequence number per room
            // Initialize room sequence state if needed
            if (!roomSequences.has(roomId)) {
              roomSequences.set(roomId, {
                nextSeq: 1,
                buffer: []
              });
              console.log(`[Sequence] 🎬 Initialized sequence state for room ${roomId}`);
            }
            
            const sequenceState = roomSequences.get(roomId)!;
            const seq = sequenceState.nextSeq++;
            
            // Create sequenced message and add to circular buffer
            const sequencedMsg: SequencedMessage = {
              seq,
              messageId,
              originalText: text,
              translatedText,
              speaker: connection.role,
              originalLanguage: language,
              translatedLanguage: targetLanguage,
              timestamp: now
            };
            
            sequenceState.buffer.push(sequencedMsg);
            
            // Maintain circular buffer - keep only last MAX_BUFFER_SIZE messages
            if (sequenceState.buffer.length > MAX_BUFFER_SIZE) {
              const removed = sequenceState.buffer.shift();
              console.log(`[Sequence] 🔄 Buffer full - removed oldest message (seq=${removed?.seq})`);
            }
            
            console.log(`[Sequence] 📊 Assigned seq=${seq} to message. Buffer size: ${sequenceState.buffer.length}/${MAX_BUFFER_SIZE}`);
            
            // AUDIT LOG: Sequence number assigned
            logAudit({
              eventType: 'SEQUENCE_ASSIGNED',
              roomId,
              speaker: connection.role,
              messageId,
              sequenceNumber: seq,
              originalText: text,
              translatedText,
              languageFrom: language,
              languageTo: targetLanguage,
              offset: validOffset?.toString(),
              duration: validDuration?.toString(),
              metadata: JSON.stringify({ bufferSize: sequenceState.buffer.length }),
            });
            
            const roomClients = roomConnections.get(roomId) || [];
            console.log(`[Translation Broadcast] 📡 Broadcasting to ${roomClients.length} clients in room ${roomId}, seq=${seq}, messageId=${messageId}`);
            
            let successfulBroadcasts = 0;
            roomClients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'translation',
                  roomId,
                  seq, // Add sequence number to message
                  messageId,
                  originalText: text,
                  translatedText,
                  speaker: connection.role,
                  originalLanguage: language,
                  translatedLanguage: targetLanguage
                }));
                successfulBroadcasts++;
              }
            });
            
            const broadcastCompleteTimestamp = Date.now();
            console.log(`[Translation Broadcast] ✅ Successfully broadcast to ${successfulBroadcasts}/${roomClients.length} clients`);
            console.log(`[Translation Broadcast] ⏱️ Total time (transcription → translation → broadcast): ${broadcastCompleteTimestamp - transcriptionTimestamp}ms`);

          } catch (error) {
            console.error('[Transcription] Error processing text:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to process transcription'
            }));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', (code: number, reason: Buffer) => {
      const duration = Math.floor((Date.now() - connectionStartTime) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      const connection = connections.get(ws);
      
      // Close code descriptions
      const closeReasons: Record<number, string> = {
        1000: "Normal",
        1001: "Going Away",
        1006: "Abnormal (network/timeout)",
        1011: "Server Error"
      };
      
      const closeReason = closeReasons[code] || `Code ${code}`;
      
      // ALWAYS log ALL disconnects with full details
      console.log(`[WebSocket] 🔌 DISCONNECTED [${closeReason}]:`, {
        code,
        reason: reason.toString() || 'none',
        duration: `${minutes}m ${seconds}s (${duration}s)`,
        roomId: connection?.roomId || 'unknown',
        language: connection?.language || 'unknown',
        role: connection?.role || 'unknown',
        timestamp: new Date().toISOString()
      });
      
      clearInterval(pingInterval);
      
      if (connection) {
        const { roomId, role } = connection;
        
        // Remove this connection from active connections
        connections.delete(ws);
        const roomClients = roomConnections.get(roomId) || [];
        const updatedClients = roomClients.filter(client => client !== ws);
        roomConnections.set(roomId, updatedClients);
        
        // Differentiate intentional exits from accidental disconnects
        const isIntentionalExit = code === 1000 || code === 4000;
        
        if (isIntentionalExit) {
          // Intentional exit - clean up immediately
          console.log(`[Grace Period] ⏭️ Intentional exit (code ${code}) - cleaning up immediately`);
          const sessionReason = role === 'creator' ? 'creator-left' : 'participant-left';
          void endSession(roomId, sessionReason).catch(err => 
            console.error(`[Session] Failed to end session on intentional exit:`, err)
          );
          
          // Clean up fuzzy deduplication tracking for this speaker
          const speakerKey = `${roomId}|${role}`;
          recentMessagesByRoomSpeaker.delete(speakerKey);
          console.log(`[Memory Cleanup] 🧹 Cleared recent messages for ${speakerKey}`);
        } else {
          // Accidental disconnect (network issue, mobile backgrounding, etc.)
          console.log(`[Grace Period] 🕒 Accidental disconnect (code ${code}) - starting ${GRACE_PERIOD_MS/1000}s grace period`);
          
          // Pause credit deduction immediately
          pauseSession(roomId);
          
          // Notify partner that peer disconnected (if they exist and are still connected)
          const remainingClients = roomConnections.get(roomId) || [];
          remainingClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'peer-disconnected',
                waitingForReconnect: true,
                graceSeconds: GRACE_PERIOD_MS / 1000
              }));
            }
          });
          
          // Set cleanup timer - will be canceled if user reconnects
          const cleanupTimer = setTimeout(() => {
            console.log(`[Grace Period] ⏰ Grace period expired for room ${roomId}`);
            
            // MOBILE FIX: Check if partner has joined before ending session
            // If creator is waiting alone (no partner yet), keep room alive so they can return from backgrounding
            const roomClients = roomConnections.get(roomId) || [];
            const hasPartner = roomClients.length > 0;
            
            if (role === 'creator' && !hasPartner) {
              console.log(`[Grace Period] ✓ Creator waiting alone - keeping room alive for partner to join`);
              console.log(`[Grace Period] Room ${roomId} stays active, creator can return from mobile backgrounding`);
              
              // Clean up this specific timer, but DON'T call endSession
              roomCleanupTimers.delete(roomId);
              
              // Clean up fuzzy deduplication tracking for this speaker
              const speakerKey = `${roomId}|${role}`;
              recentMessagesByRoomSpeaker.delete(speakerKey);
              console.log(`[Memory Cleanup] 🧹 Cleared recent messages for ${speakerKey}`);
              
              return; // Don't end session - room stays alive
            }
            
            // Normal case: either participant left, or creator left after partner joined
            console.log(`[Grace Period] Ending session - ${hasPartner ? 'partner was present' : 'participant left'}`);
            const sessionReason = role === 'creator' ? 'creator-left' : 'participant-left';
            void endSession(roomId, sessionReason).catch(err => 
              console.error(`[Session] Failed to end session after grace period:`, err)
            );
            
            // Clean up fuzzy deduplication tracking for this speaker
            const speakerKey = `${roomId}|${role}`;
            recentMessagesByRoomSpeaker.delete(speakerKey);
            console.log(`[Memory Cleanup] 🧹 Cleared recent messages for ${speakerKey}`);
            
            roomCleanupTimers.delete(roomId);
          }, GRACE_PERIOD_MS);
          
          roomCleanupTimers.set(roomId, cleanupTimer);
          console.log(`[Grace Period] ⏲️ Grace timer set for room ${roomId}, expires in ${GRACE_PERIOD_MS/1000}s`);
        }
      }
    });

    ws.on('error', (error) => {
      const duration = Math.floor((Date.now() - connectionStartTime) / 1000);
      const connection = connections.get(ws);
      
      // ALWAYS log ALL errors with full context
      console.error('[WebSocket] ❌ ERROR:', {
        message: error.message,
        duration: `${duration}s`,
        roomId: connection?.roomId || 'unknown',
        role: connection?.role || 'unknown',
        timestamp: new Date().toISOString()
      });
      
      clearInterval(pingInterval);
    });
  });

  // Automatic Reconciliation Worker - Runs every 1 minute to guarantee fast activation
  // This ensures NO user is ever left without their subscription, even if webhooks and confirm both fail
  const RECONCILIATION_INTERVAL = 1 * 60 * 1000; // 1 minute in milliseconds
  
  async function runReconciliation() {
    try {
      console.log("[Auto Reconciliation] Running scheduled payment reconciliation...");
      
      // Query Stripe for ALL checkout sessions EVER with auto-pagination
      // No time filter ensures TRUE 100% guarantee - we catch every payment regardless of age
      const allSessions: Stripe.Checkout.Session[] = [];
      
      for await (const session of stripe.checkout.sessions.list({
        limit: 100,
      })) {
        allSessions.push(session);
      }

      let activatedCount = 0;

      for (const session of allSessions) {
        if (session.payment_status !== 'paid' || session.mode !== 'subscription' || !session.subscription) {
          continue;
        }

        try {
          const userId = parseInt(session.metadata?.userId || session.client_reference_id || '0');
          const plan = session.metadata?.plan as 'starter' | 'pro';

          if (!userId || !plan || (plan !== 'starter' && plan !== 'pro')) {
            continue;
          }

          // Get Stripe subscription details to check if it's still active
          const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = stripeSubscription.items.data[0]?.price.id;

          if (!priceId) continue;

          // CRITICAL: Only process ACTIVE subscriptions to avoid downgrading users
          // Skip canceled, past_due, or replaced subscriptions (user may have upgraded/downgraded)
          if (stripeSubscription.status !== 'active' && stripeSubscription.status !== 'trialing') {
            continue; // Skip inactive subscriptions silently
          }

          // CRITICAL: Verify plan/price consistency to prevent downgrades from in-place upgrades
          // If subscription was upgraded in-place, the priceId won't match the session's plan
          const expectedPriceId = PLAN_DETAILS[plan].priceId;
          if (priceId !== expectedPriceId) {
            // Price mismatch indicates this is an old session that was upgraded/downgraded
            // Skip it to avoid reverting the user to the old plan
            continue;
          }

          // Check current subscription status (may be undefined for new users)
          const currentSubscription = await storage.getSubscription(userId);

          const alreadyActivated = 
            currentSubscription?.plan === plan &&
            currentSubscription?.stripeSubscriptionId === stripeSubscription.id &&
            currentSubscription?.stripePriceId === priceId;

          if (!alreadyActivated) {
            console.warn(`[Auto Reconciliation] 🚨 FOUND UNACTIVATED PAYMENT: session=${session.id}, user=${userId}, plan=${plan}, status=${stripeSubscription.status}`);
            await activateSubscription(userId, plan, stripeSubscription.id, priceId);
            activatedCount++;
            console.log(`[Auto Reconciliation] ✅ Activated missed payment for user ${userId}`);
          }
        } catch (error: any) {
          console.error(`[Auto Reconciliation] Error processing session ${session.id}:`, error);
        }
      }

      if (activatedCount > 0) {
        console.log(`[Auto Reconciliation] ✓ Completed: ${activatedCount} payments activated`);
      }
    } catch (error: any) {
      console.error("[Auto Reconciliation] Worker failed:", error);
    }
  }

  // Run reconciliation immediately on startup, then every minute
  runReconciliation();
  setInterval(runReconciliation, RECONCILIATION_INTERVAL);
  console.log("[Auto Reconciliation] ✓ Worker started - running every minute for fast activation");

  // SEO: Sitemap XML
  app.get("/sitemap.xml", (req, res) => {
    // Always use production URL for sitemap
    const baseUrl = 'https://getvoztra.com';
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/pricing</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/privacy-california</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/login</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/register</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  });

  // SEO: robots.txt is served from public folder automatically

  return httpServer;
}

async function translateText(text: string, fromLanguage: string, toLanguage: string): Promise<string> {
  try {
    const translatorKey = process.env.AZURE_TRANSLATOR_KEY;
    const translatorRegion = process.env.AZURE_TRANSLATOR_REGION;

    if (!translatorKey || !translatorRegion) {
      throw new Error('Azure Translator credentials not configured');
    }

    const response = await axios.post(
      'https://api.cognitive.microsofttranslator.com/translate',
      [{ text }],
      {
        headers: {
          'Ocp-Apim-Subscription-Key': translatorKey,
          'Ocp-Apim-Subscription-Region': translatorRegion,
          'Content-Type': 'application/json',
        },
        params: {
          'api-version': '3.0',
          from: fromLanguage,
          to: toLanguage,
        },
      }
    );

    if (response.data && response.data[0]?.translations?.[0]?.text) {
      return response.data[0].translations[0].text;
    } else {
      console.warn('Translation failed:', response.data);
      return text;
    }
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

function getAzureLanguageCode(code: string): string {
  const languageMap: Record<string, string> = {
    'en': 'en-US',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'it': 'it-IT',
    'pt': 'pt-PT',
    'ru': 'ru-RU',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'zh': 'zh-CN',
    'ar': 'ar-SA',
    'hi': 'hi-IN',
    'nl': 'nl-NL',
    'pl': 'pl-PL',
    'tr': 'tr-TR',
  };
  return languageMap[code] || code;
}

// Background cleanup worker: Deletes inactive rooms after 24 hours
export function startRoomCleanupWorker() {
  const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Run every hour
  
  const runCleanup = async () => {
    try {
      const deletedCount = await storage.cleanupInactiveRooms();
      if (deletedCount > 0) {
        console.log(`[Room Cleanup] 🧹 Deleted ${deletedCount} inactive room(s) (>24h old)`);
      }
    } catch (error) {
      console.error('[Room Cleanup] Error during cleanup:', error);
    }
  };

  // Run immediately on startup
  runCleanup();
  
  // Then run every hour
  setInterval(runCleanup, CLEANUP_INTERVAL_MS);
  
  console.log('[Room Cleanup] ✅ Background worker started (runs every hour)');
}

// Background cleanup worker: Deletes audit logs older than 10 days
export function startAuditLogCleanupWorker() {
  const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // Run every 24 hours
  
  const runCleanup = async () => {
    try {
      const deletedCount = await storage.cleanupOldAuditLogs();
      if (deletedCount > 0) {
        console.log(`[Audit Log Cleanup] 🧹 Deleted ${deletedCount} audit log(s) (>10 days old)`);
      }
    } catch (error) {
      console.error('[Audit Log Cleanup] Error during cleanup:', error);
    }
  };

  // Run immediately on startup
  runCleanup();
  
  // Then run every 24 hours
  setInterval(runCleanup, CLEANUP_INTERVAL_MS);
  
  console.log('[Audit Log Cleanup] ✅ Background worker started (runs every 24 hours, keeps logs for 10 days)');
}
