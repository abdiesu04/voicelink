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

const connections = new Map<WebSocket, RoomConnection>();
const roomConnections = new Map<string, WebSocket[]>();

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/rooms/create", async (req, res) => {
    try {
      const { language, voiceGender } = req.body;
      
      if (!language) {
        return res.status(400).json({ error: "Language is required" });
      }
      
      if (!voiceGender) {
        return res.status(400).json({ error: "Voice gender is required" });
      }

      const room = await storage.createRoom(language, voiceGender);
      
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
        null,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': speechKey,
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
          }
        }

        // Application-level ping/pong for keeping connection alive through proxies
        if (message.type === 'ping') {
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
            console.log(`[Transcription-Final] Received text: "${text}", language: ${language}`);
            
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

            const roomClients = roomConnections.get(roomId) || [];
            roomClients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'translation',
                  roomId,
                  originalText: text,
                  translatedText,
                  speaker: connection.role,
                  originalLanguage: language,
                  translatedLanguage: targetLanguage
                }));
              }
            });

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
        const { roomId } = connection;
        
        const roomClients = roomConnections.get(roomId);
        if (roomClients) {
          const index = roomClients.indexOf(ws);
          if (index > -1) {
            roomClients.splice(index, 1);
          }

          roomClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'participant-left',
                roomId
              }));
            }
          });

          if (roomClients.length === 0) {
            roomConnections.delete(roomId);
            storage.deleteRoom(roomId);
          }
        }

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
