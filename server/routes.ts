import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import axios from "axios";

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
  intervalId: NodeJS.Timeout;
  isActive: boolean;
}

const connections = new Map<WebSocket, RoomConnection>();
const roomConnections = new Map<string, WebSocket[]>();
const activeSessions = new Map<string, SessionTracking>(); // roomId -> session tracking
const broadcastedMessageIds = new Map<string, Map<string, number>>(); // roomId -> Map<dedupeKey, timestamp> for TTL-based deduplication

function endSession(roomId: string, reason: 'participant-left' | 'creator-left' | 'credits-exhausted') {
  console.log(`[Session] Ending session for room ${roomId}, reason: ${reason}`);
  
  const session = activeSessions.get(roomId);
  if (session) {
    const totalDuration = Math.floor((Date.now() - session.startTime) / 1000);
    console.log(`[Session] Total duration: ${totalDuration}s`);
    
    clearInterval(session.intervalId);
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
  storage.deleteRoom(roomId);
  
  console.log(`[Session] Cleaned up room ${roomId}, notified ${clients.length} clients, cleared deduplication tracking`);
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/rooms/create", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
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

  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    const connectionStartTime = Date.now();
    console.log('[WebSocket] New connection established');
    
    // Keep connection alive with ping/pong
    let isAlive = true;
    
    ws.on('pong', () => {
      isAlive = true;
    });

    const pingInterval = setInterval(() => {
      if (!isAlive) {
        clearInterval(pingInterval);
        return ws.terminate();
      }
      
      isAlive = false;
      ws.ping();
    }, 45000); // 45 seconds - aggressive protocol-level pings to prevent proxy timeout

    ws.on('message', async (data: Buffer) => {
      // ANY message from client proves connection is alive (fixes disconnection during heavy Azure operations)
      isAlive = true;
      
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'join') {
          const { roomId, language, voiceGender, role } = message;
          
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
          
          const room = await storage.getRoom(roomId);
          if (!room) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Room not found'
            }));
            return;
          }

          connections.set(ws, { ws, roomId, language, voiceGender, role });
          
          if (!roomConnections.has(roomId)) {
            roomConnections.set(roomId, []);
          }
          roomConnections.get(roomId)?.push(ws);

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
                    endSession(roomId, 'credits-exhausted');
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
        }

        // Application-level ping/pong for keeping connection alive through proxies
        if (message.type === 'ping') {
          const connInfo = connections.get(ws);
          console.log(`[Heartbeat-Server] 💓 Received ping from client (role: ${connInfo?.role}, language: ${connInfo?.language}), sending pong`);
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        if (message.type === 'transcription') {
          const { roomId, text, language, interim } = message;
          const connection = connections.get(ws);
          
          if (!connection) return;

          try {
            if (!text || text.trim().length === 0) {
              return;
            }
            
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

            const translatedText = await translateText(text, language, targetLanguage);
            const translationCompleteTimestamp = Date.now();
            console.log(`[Translation] ⏱️ Translation completed in ${translationCompleteTimestamp - transcriptionTimestamp}ms: "${text}" → "${translatedText}"`);

            // SERVER-SIDE DEDUPLICATION: Create content-based stable key WITHOUT timestamp
            // This prevents Azure Speech SDK from triggering duplicate broadcasts if 'recognized' event fires twice
            // Use full text (not truncated) to avoid false positives from long messages with shared prefixes
            const dedupeKey = `${connection.role}|${text}|${translatedText}`;
            const now = Date.now();
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
            
            const roomClients = roomConnections.get(roomId) || [];
            console.log(`[Translation Broadcast] 📡 Broadcasting to ${roomClients.length} clients in room ${roomId}, messageId: ${messageId}`);
            
            let successfulBroadcasts = 0;
            roomClients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'translation',
                  roomId,
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
        
        // End the entire session when ANY user disconnects
        // This ensures the other user is notified and credits stop immediately
        const sessionReason = role === 'creator' ? 'creator-left' : 'participant-left';
        endSession(roomId, sessionReason);
        
        connections.delete(ws);
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
