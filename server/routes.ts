import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import axios from "axios";

interface RoomConnection {
  ws: WebSocket;
  roomId: string;
  language: string;
  role: "creator" | "participant";
}

const connections = new Map<WebSocket, RoomConnection>();
const roomConnections = new Map<string, WebSocket[]>();

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/rooms/create", async (req, res) => {
    try {
      const { language } = req.body;
      
      if (!language) {
        return res.status(400).json({ error: "Language is required" });
      }

      const room = await storage.createRoom(language);
      
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

  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket connection');

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'join') {
          const { roomId, language, role } = message;
          
          if (!language) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Language is required'
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

          connections.set(ws, { ws, roomId, language, role });
          
          if (!roomConnections.has(roomId)) {
            roomConnections.set(roomId, []);
          }
          roomConnections.get(roomId)?.push(ws);

          if (role === 'participant') {
            await storage.updateRoom(roomId, { participantLanguage: language });
            
            const roomClients = roomConnections.get(roomId) || [];
            roomClients.forEach(client => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'participant-joined',
                  roomId,
                  language
                }));
              }
            });
          }
        }

        if (message.type === 'audio') {
          const { roomId, audioData, language, mimeType } = message;
          const connection = connections.get(ws);
          
          if (!connection) return;

          try {
            console.log(`[Audio] Received audio, size: ${audioData.length}, mimeType: ${mimeType}, language: ${language}`);
            
            const transcribedText = await transcribeAudio(audioData, language, mimeType);
            
            if (!transcribedText || transcribedText === 'Speech recognized but no text returned') {
              console.warn('[Audio] No transcription result');
              return;
            }
            
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

            const translatedText = await translateText(transcribedText, language, targetLanguage);

            const roomClients = roomConnections.get(roomId) || [];
            roomClients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'translation',
                  roomId,
                  originalText: transcribedText,
                  translatedText,
                  speaker: connection.role,
                  originalLanguage: language,
                  translatedLanguage: targetLanguage
                }));
              }
            });

          } catch (error) {
            console.error('[Audio] Error processing audio:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to process audio'
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

    ws.on('close', () => {
      const connection = connections.get(ws);
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
  });

  return httpServer;
}

async function transcribeAudio(base64Audio: string, language: string, mimeType?: string): Promise<string> {
  try {
    const audioBuffer = Buffer.from(base64Audio, 'base64');
    console.log(`[Transcription] Audio buffer size: ${audioBuffer.length} bytes, Language: ${language}, MimeType: ${mimeType}`);
    
    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_SPEECH_REGION;

    if (!speechKey || !speechRegion) {
      console.error('[Transcription] Azure Speech credentials not configured');
      throw new Error('Azure Speech credentials not configured');
    }

    console.log(`[Transcription] Calling Azure STT API: ${speechRegion}, locale: ${getAzureLanguageCode(language)}`);

    let contentType = 'audio/wav';
    if (mimeType && mimeType.includes('webm')) {
      contentType = 'audio/webm;codecs=opus';
    }

    const response = await axios.post(
      `https://${speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`,
      audioBuffer,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': speechKey,
          'Content-Type': contentType,
        },
        params: {
          language: getAzureLanguageCode(language),
          format: 'detailed',
        },
        validateStatus: () => true,
      }
    );

    console.log('[Transcription] Azure response status:', response.status);
    console.log('[Transcription] Azure response:', JSON.stringify(response.data));

    if (response.status === 200 && response.data.RecognitionStatus === 'Success') {
      const text = response.data.DisplayText;
      if (text && text.trim().length > 0) {
        console.log(`[Transcription] Success: "${text}"`);
        return text;
      } else {
        console.warn('[Transcription] Success but no text');
        return '';
      }
    } else {
      console.warn('[Transcription] Recognition failed:', response.status, response.data);
      return '';
    }
  } catch (error: any) {
    console.error('[Transcription] Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('[Transcription] Response status:', error.response.status);
      console.error('[Transcription] Response headers:', error.response.headers);
    }
    return '';
  }
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
