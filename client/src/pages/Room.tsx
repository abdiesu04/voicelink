import { useState, useEffect, useRef, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { Mic, MicOff, PhoneOff, Copy, Check, Share2, Volume2, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { TranscriptionPanel } from "@/components/TranscriptionPanel";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SUPPORTED_LANGUAGES } from "@shared/schema";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

interface TranscriptionMessage {
  id: string;
  originalText: string;
  translatedText: string;
  isOwn: boolean;
}

export default function Room() {
  const [, params] = useRoute("/room/:roomId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { updateSubscription } = useAuth();

  const roomId = params?.roomId;
  
  // Memoize URL params to prevent re-creating on every render
  const { role, language, voiceGender } = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      role: urlParams.get("role") || "creator",
      language: urlParams.get("language") || "en",
      voiceGender: (urlParams.get("voiceGender") || "female") as "male" | "female"
    };
  }, []); // Only calculate once on mount
  
  // Only log on mount, not on every render
  useEffect(() => {
    console.log(`[Room Init] Role: ${role}, Language: ${language}, My Voice Gender: ${voiceGender}`);
    
    // Track browser tab visibility changes
    const handleVisibilityChange = () => {
      console.log('[Browser] Visibility changed:', document.hidden ? 'HIDDEN' : 'VISIBLE');
      if (document.hidden) {
        console.log('[Browser] ⚠️ Tab is now hidden - this may affect WebSocket/Azure connections');
      } else {
        console.log('[Browser] ✓ Tab is now visible - connections should remain active');
      }
    };
    
    // Track page unload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      console.log('[Browser] ⚠️ Page is unloading (tab closing/navigating away)');
    };
    
    // Track online/offline status
    const handleOnline = () => {
      console.log('[Network] ✓ Connection restored - back online');
    };
    
    const handleOffline = () => {
      console.error('[Network] ❌ Network connection lost - offline!');
      // Don't set UI to disconnected - let auto-reconnect handle this
      // The WebSocket onclose will fire and trigger reconnection when network returns
      console.log('[Network] Auto-reconnect will handle reconnection when network returns');
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    console.log('[Browser] Network status:', navigator.onLine ? 'ONLINE' : 'OFFLINE');
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connecting");
  const [disconnectReason, setDisconnectReason] = useState<string>("");
  const [disconnectDetails, setDisconnectDetails] = useState<string>("");
  const [isMuted, setIsMuted] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [partnerSpeaking, setPartnerSpeaking] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(role === "creator");
  const [copied, setCopied] = useState(false);
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [partnerLanguage, setPartnerLanguage] = useState<string>("");
  const [partnerVoiceGender, setPartnerVoiceGender] = useState<"male" | "female" | undefined>(undefined);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [quotaError, setQuotaError] = useState<string>("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);

  const [myMessages, setMyMessages] = useState<TranscriptionMessage[]>([]);
  const [partnerMessages, setPartnerMessages] = useState<TranscriptionMessage[]>([]);
  const [myInterimText, setMyInterimText] = useState<string>("");
  const [partnerInterimText, setPartnerInterimText] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);
  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);
  const azureTokenRef = useRef<{ token: string; region: string } | null>(null);
  const spokenMessageIdsRef = useRef<Set<string>>(new Set());
  const processedMessagesRef = useRef<Set<string>>(new Set()); // Track processed server messageIds for deduplication
  const lastInterimSentRef = useRef<number>(0);
  const activeSynthesizerRef = useRef<SpeechSDK.SpeechSynthesizer | null>(null);
  const ttsQueueRef = useRef<Array<{ text: string; languageCode: string; gender: "male" | "female"; messageId: string; retryCount?: number }>>([]);
  const isProcessingTTSRef = useRef<boolean>(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);
  const audioUnlockedRef = useRef<boolean>(false);
  const quotaExceededRef = useRef<boolean>(false);
  const partnerVoiceGenderRef = useRef<"male" | "female" | undefined>(undefined);
  const isMutedRef = useRef<boolean>(true); // Track mute state in ref for event handlers
  
  // Auto-reconnect state
  const reconnectAttemptRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isReconnectingRef = useRef<boolean>(false);
  const shouldReconnectRef = useRef<boolean>(true); // Set to false on intentional disconnect

  const myLanguage = SUPPORTED_LANGUAGES.find(l => l.code === language);
  const theirLanguage = SUPPORTED_LANGUAGES.find(l => l.code === partnerLanguage);
  
  // Keep ref in sync with state AND debug log
  useEffect(() => {
    partnerVoiceGenderRef.current = partnerVoiceGender;
    console.log('[State Change] partnerVoiceGender updated to:', partnerVoiceGender);
  }, [partnerVoiceGender]);

  // Timer - increment elapsed seconds every second when session is active
  useEffect(() => {
    if (!sessionActive) return;

    const timerId = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [sessionActive]);

  const azureLanguageMap: Record<string, string> = {
    'en': 'en-US', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE',
    'it': 'it-IT', 'pt': 'pt-PT', 'ru': 'ru-RU', 'ja': 'ja-JP',
    'ko': 'ko-KR', 'zh': 'zh-CN', 'ar': 'ar-SA', 'hi': 'hi-IN',
    'nl': 'nl-NL', 'pl': 'pl-PL', 'tr': 'tr-TR',
    'pt-br': 'pt-BR', 'sv': 'sv-SE', 'nb': 'nb-NO', 'da': 'da-DK',
    'fi': 'fi-FI', 'el': 'el-GR', 'cs': 'cs-CZ', 'ro': 'ro-RO',
    'uk': 'uk-UA', 'hu': 'hu-HU', 'vi': 'vi-VN', 'th': 'th-TH',
    'id': 'id-ID', 'he': 'he-IL', 'bn': 'bn-IN',
    'ta': 'ta-IN', 'te': 'te-IN', 'mr': 'mr-IN',
    'bg': 'bg-BG', 'hr': 'hr-HR', 'sk': 'sk-SK',
    'sl': 'sl-SI', 'ca': 'ca-ES', 'ms': 'ms-MY', 'af': 'af-ZA',
    'sw': 'sw-KE', 'gu': 'gu-IN', 'kn': 'kn-IN', 'ml': 'ml-IN',
    'sr': 'sr-RS', 'et': 'et-EE', 'lv': 'lv-LV',
  };

  // Azure TTS voice names for each language and gender
  const getAzureVoiceName = (languageCode: string, gender: "male" | "female"): string => {
    const voiceMap: Record<string, { male: string, female: string }> = {
      'en': { male: 'en-US-AndrewMultilingualNeural', female: 'en-US-AvaMultilingualNeural' },
      'es': { male: 'es-ES-AlvaroNeural', female: 'es-ES-ElviraNeural' },
      'fr': { male: 'fr-FR-RemyMultilingualNeural', female: 'fr-FR-VivienneMultilingualNeural' },
      'de': { male: 'de-DE-FlorianMultilingualNeural', female: 'de-DE-SeraphinaMultilingualNeural' },
      'it': { male: 'it-IT-DiegoNeural', female: 'it-IT-ElsaNeural' },
      'pt': { male: 'pt-PT-DuarteNeural', female: 'pt-PT-RaquelNeural' },
      'ru': { male: 'ru-RU-DmitryNeural', female: 'ru-RU-SvetlanaNeural' },
      'ja': { male: 'ja-JP-KeitaNeural', female: 'ja-JP-NanamiNeural' },
      'ko': { male: 'ko-KR-InJoonNeural', female: 'ko-KR-SunHiNeural' },
      'zh': { male: 'zh-CN-YunxiangNeural', female: 'zh-CN-XiaoyiNeural' },
      'ar': { male: 'ar-SA-HamedNeural', female: 'ar-SA-ZariyahNeural' },
      'hi': { male: 'hi-IN-MadhurNeural', female: 'hi-IN-SwaraNeural' },
      'nl': { male: 'nl-NL-MaartenNeural', female: 'nl-NL-ColetteNeural' },
      'pl': { male: 'pl-PL-MarekNeural', female: 'pl-PL-ZofiaNeural' },
      'tr': { male: 'tr-TR-AhmetNeural', female: 'tr-TR-EmelNeural' },
      'pt-br': { male: 'pt-BR-AntonioNeural', female: 'pt-BR-FranciscaNeural' },
      'sv': { male: 'sv-SE-MattiasNeural', female: 'sv-SE-SofieNeural' },
      'nb': { male: 'nb-NO-FinnNeural', female: 'nb-NO-PernilleNeural' },
      'da': { male: 'da-DK-JeppeNeural', female: 'da-DK-ChristelNeural' },
      'fi': { male: 'fi-FI-HarriNeural', female: 'fi-FI-NooraNeural' },
      'el': { male: 'el-GR-NestorasNeural', female: 'el-GR-AthinaNeural' },
      'cs': { male: 'cs-CZ-AntoninNeural', female: 'cs-CZ-VlastaNeural' },
      'ro': { male: 'ro-RO-EmilNeural', female: 'ro-RO-AlinaNeural' },
      'uk': { male: 'uk-UA-OstapNeural', female: 'uk-UA-PolinaNeural' },
      'hu': { male: 'hu-HU-TamasNeural', female: 'hu-HU-NoemiNeural' },
      'vi': { male: 'vi-VN-NamMinhNeural', female: 'vi-VN-HoaiMyNeural' },
      'th': { male: 'th-TH-NiwatNeural', female: 'th-TH-PremwadeeNeural' },
      'id': { male: 'id-ID-ArdiNeural', female: 'id-ID-GadisNeural' },
      'he': { male: 'he-IL-AvriNeural', female: 'he-IL-HilaNeural' },
      'bn': { male: 'bn-IN-BashkarNeural', female: 'bn-IN-TanishaaNeural' },
      'ta': { male: 'ta-IN-ValluvarNeural', female: 'ta-IN-PallaviNeural' },
      'te': { male: 'te-IN-MohanNeural', female: 'te-IN-ShrutiNeural' },
      'mr': { male: 'mr-IN-ManoharNeural', female: 'mr-IN-AarohiNeural' },
      'bg': { male: 'bg-BG-BorislavNeural', female: 'bg-BG-KalinaNeural' },
      'hr': { male: 'hr-HR-SreckoNeural', female: 'hr-HR-GabrijelaNeural' },
      'sk': { male: 'sk-SK-LukasNeural', female: 'sk-SK-ViktoriaNeural' },
      'sl': { male: 'sl-SI-RokNeural', female: 'sl-SI-PetraNeural' },
      'ca': { male: 'ca-ES-EnricNeural', female: 'ca-ES-JoanaNeural' },
      'ms': { male: 'ms-MY-OsmanNeural', female: 'ms-MY-YasminNeural' },
      'af': { male: 'af-ZA-WillemNeural', female: 'af-ZA-AdriNeural' },
      'sw': { male: 'sw-KE-RafikiNeural', female: 'sw-KE-ZuriNeural' },
      'gu': { male: 'gu-IN-NiranjanNeural', female: 'gu-IN-DhwaniNeural' },
      'kn': { male: 'kn-IN-GaganNeural', female: 'kn-IN-SapnaNeural' },
      'ml': { male: 'ml-IN-MidhunNeural', female: 'ml-IN-SobhanaNeural' },
      'sr': { male: 'sr-RS-NicholasNeural', female: 'sr-RS-SophieNeural' },
      'et': { male: 'et-EE-KertNeural', female: 'et-EE-AnuNeural' },
      'lv': { male: 'lv-LV-NilsNeural', female: 'lv-LV-EveritaNeural' },
    };
    
    const voices = voiceMap[languageCode] || voiceMap['en'];
    return voices[gender];
  };

  const getAzureToken = async () => {
    if (azureTokenRef.current) {
      return azureTokenRef.current;
    }
    
    const tokenResponse = await fetch('/api/speech/token');
    const tokenData = await tokenResponse.json();
    azureTokenRef.current = tokenData;
    
    setTimeout(() => {
      azureTokenRef.current = null;
    }, 540000);
    
    return tokenData;
  };

  // Unlock audio on mobile by playing silent audio on user interaction
  const unlockAudioForMobile = async () => {
    if (audioUnlockedRef.current) {
      return;
    }

    try {
      console.log('[Audio Unlock] Attempting to unlock audio for mobile...');
      
      // Create or get the audio element
      if (!currentAudioRef.current) {
        currentAudioRef.current = new Audio();
      }
      
      const audio = currentAudioRef.current;
      
      // Use a data URL for a tiny silent WAV file (more reliable than blob)
      // This is a 100ms silent WAV file
      const silentWav = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
      audio.src = silentWav;
      
      // Set volume to 0 to ensure truly silent
      audio.volume = 0;
      
      await audio.play();
      
      // Wait a tiny bit for the audio to actually start
      await new Promise(resolve => setTimeout(resolve, 50));
      
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1; // Restore volume for actual TTS playback
      
      audioUnlockedRef.current = true;
      
      console.log('[Audio Unlock] Audio successfully unlocked for mobile');
    } catch (error) {
      console.warn('[Audio Unlock] Failed to unlock audio:', error);
      // Even if unlock fails, set the flag to avoid repeated attempts
      audioUnlockedRef.current = true;
    }
  };

  // Escape XML special characters for SSML
  const escapeXml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // Synthesize speech using Azure REST TTS API - returns audio blob for reliable playback
  const synthesizeSpeechToBlob = async (
    text: string,
    languageCode: string,
    gender: "male" | "female"
  ): Promise<Blob> => {
    try {
      const { token, region } = await getAzureToken();
      
      const azureLang = azureLanguageMap[languageCode] || 'en-US';
      const voiceName = getAzureVoiceName(languageCode, gender);
      
      console.log(`[TTS] Synthesizing with gender: ${gender}, language: ${languageCode}, voice: ${voiceName}`);
      
      // Escape text for SSML (prevents XML parsing errors with &, <, >, etc.)
      const escapedText = escapeXml(text);
      
      // SSML for Azure TTS REST API
      const ssml = `
        <speak version='1.0' xml:lang='${azureLang}'>
          <voice xml:lang='${azureLang}' name='${voiceName}'>
            ${escapedText}
          </voice>
        </speak>
      `.trim();
      
      const response = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        },
        body: ssml,
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`[TTS] Azure TTS API error: ${response.status} ${response.statusText}`, errorText);
        
        // Check for quota errors (HTTP 429 = Too Many Requests)
        if (response.status === 429 || errorText.toLowerCase().includes('quota')) {
          console.error('[TTS] QUOTA EXCEEDED - stopping TTS queue processing');
          quotaExceededRef.current = true;
          setQuotaExceeded(true);
          setQuotaError('Azure TTS quota exceeded. Your account has hit its usage limit.');
          
          toast({
            title: "TTS Quota Limit Reached",
            description: "Azure Text-to-Speech quota exceeded. You can still receive translations as text.",
            variant: "destructive",
            duration: 10000,
          });
        }
        
        throw new Error(`Azure TTS failed: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Azure TTS returned empty audio blob');
      }
      
      return blob;
    } catch (error) {
      console.error('[TTS] Synthesis error:', error);
      throw error; // Re-throw to trigger retry logic in queue processor
    }
  };

  // Process the TTS queue - plays one item at a time with ABSOLUTE guarantee of no overlaps
  const processTTSQueue = async () => {
    // CRITICAL: Stop processing if quota exceeded
    if (quotaExceededRef.current) {
      console.log('[TTS Queue] Quota exceeded - skipping TTS processing');
      ttsQueueRef.current = []; // Clear the queue
      return;
    }
    
    // CRITICAL: Atomic check-and-set - prevents race conditions
    if (isProcessingTTSRef.current) {
      // Already processing - this call will just return
      return;
    }

    // If queue is empty, do nothing
    if (ttsQueueRef.current.length === 0) {
      return;
    }

    // Set the flag SYNCHRONOUSLY before any await
    isProcessingTTSRef.current = true;
    console.log('[TTS Queue] Queue processor started');

    try {
      while (ttsQueueRef.current.length > 0) {
        const item = ttsQueueRef.current.shift()!;
        
        // Initialize retry count if not present
        const retryCount = item.retryCount || 0;
        const maxRetries = 3;

        try {
          console.log('[TTS Queue] Playing:', item.text.substring(0, 50), retryCount > 0 ? `(retry ${retryCount}/${maxRetries})` : '');

          // CRITICAL: Create single Audio element on first use and reuse it (mobile-friendly)
          if (!currentAudioRef.current) {
            currentAudioRef.current = new Audio();
            console.log('[TTS Queue] Created single reusable Audio element');
          }

          const audio = currentAudioRef.current;

          // Stop current playback if any
          audio.pause();
          audio.currentTime = 0;

          // CRITICAL: Close any active Azure synthesizer (legacy cleanup)
          if (activeSynthesizerRef.current) {
            try {
              activeSynthesizerRef.current.close();
            } catch (e) {
              // Ignore close errors
            }
            activeSynthesizerRef.current = null;
          }

          // Synthesize speech using Azure REST TTS API
          console.log('[TTS Queue] Synthesizing audio via REST API...');
          const startTime = Date.now();
          const audioBlob = await synthesizeSpeechToBlob(item.text, item.languageCode, item.gender);
          const synthesisTime = Date.now() - startTime;
          console.log(`[TTS Queue] Synthesis completed in ${synthesisTime}ms, audio size: ${audioBlob.size} bytes`);

          // Revoke previous blob URL before creating new one
          if (currentBlobUrlRef.current) {
            URL.revokeObjectURL(currentBlobUrlRef.current);
            currentBlobUrlRef.current = null;
          }
          
          // Wait for audio to finish playing - using 'ended' event for precision
          await new Promise<void>((resolve, reject) => {
            let hasCompleted = false;
            let timeoutId: NodeJS.Timeout | null = null;
            
            const cleanupSuccess = () => {
              if (!hasCompleted) {
                hasCompleted = true;
                // CRITICAL: Mark as spoken AFTER successful playback
                spokenMessageIdsRef.current.add(item.messageId);
                console.log('[TTS Queue] Marked messageId as spoken:', item.messageId);
                
                // Clean up event listeners
                audio.removeEventListener('ended', onEnded);
                audio.removeEventListener('error', onError);
                
                // Clear timeout if exists
                if (timeoutId) {
                  clearTimeout(timeoutId);
                  timeoutId = null;
                }
                
                resolve();
              }
            };
            
            const cleanupError = (error: Error) => {
              if (!hasCompleted) {
                hasCompleted = true;
                
                // Clean up event listeners
                audio.removeEventListener('ended', onEnded);
                audio.removeEventListener('error', onError);
                
                // Clear timeout if exists
                if (timeoutId) {
                  clearTimeout(timeoutId);
                  timeoutId = null;
                }
                
                // Do NOT mark as spoken - allow retry
                reject(error);
              }
            };
            
            const onEnded = () => {
              console.log('[TTS Queue] Playback completed (audio ended event)');
              cleanupSuccess();
            };
            
            const onError = (e: Event) => {
              console.error('[TTS Queue] Audio playback error:', e);
              cleanupError(new Error('Audio playback failed'));
            };
            
            // Attach event listeners
            audio.addEventListener('ended', onEnded);
            audio.addEventListener('error', onError);
            
            // Create blob URL and set it
            const blobUrl = URL.createObjectURL(audioBlob);
            currentBlobUrlRef.current = blobUrl;
            audio.src = blobUrl;
            
            // CRITICAL FIX: Mobile browser fallback timeout
            // Some mobile browsers (iOS Safari, Android Chrome) don't reliably fire 'ended' event
            // Attach loadedmetadata listener BEFORE play() to avoid race condition
            const setupTimeoutFallback = () => {
              if (hasCompleted || timeoutId) return;
              
              const duration = audio.duration;
              if (duration && isFinite(duration)) {
                // Add 2 seconds buffer + duration, max 30 seconds for very long audio
                const timeoutDuration = Math.min((duration + 2) * 1000, 30000);
                console.log(`[TTS Queue] Setting fallback timeout: ${timeoutDuration}ms (audio duration: ${duration}s)`);
                
                timeoutId = setTimeout(() => {
                  if (!hasCompleted) {
                    console.warn('[TTS Queue] Mobile fallback: Timeout reached, assuming playback complete');
                    cleanupSuccess();
                  }
                }, timeoutDuration);
              } else {
                // Metadata not available yet, use generous 20 second default for safety
                console.log('[TTS Queue] Setting default fallback timeout: 20000ms (metadata not ready)');
                timeoutId = setTimeout(() => {
                  if (!hasCompleted) {
                    console.warn('[TTS Queue] Mobile fallback: Default timeout reached, assuming playback complete');
                    cleanupSuccess();
                  }
                }, 20000);
              }
            };
            
            // Try to setup timeout immediately if metadata already loaded
            if (audio.readyState >= 1) {
              // HAVE_METADATA or higher - duration is available
              setupTimeoutFallback();
            } else {
              // Wait for metadata to load
              audio.addEventListener('loadedmetadata', setupTimeoutFallback, { once: true });
            }
            
            audio.play().then(() => {
              console.log('[TTS Queue] Playback started successfully');
              
              // Double-check: if timeout still not set after play starts, set it now
              // This handles edge cases where metadata arrives between src assignment and play
              setTimeout(() => {
                if (!timeoutId && !hasCompleted) {
                  setupTimeoutFallback();
                }
              }, 100);
            }).catch((err) => {
              console.error('[TTS Queue] Failed to play audio:', err);
              cleanupError(err);
            });
          });
        } catch (error) {
          console.error('[TTS Queue] Failed to speak text:', error);
          
          // Retry logic: if we haven't exceeded max retries, push back to queue with exponential backoff
          if (retryCount < maxRetries) {
            const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Max 5 seconds
            console.log(`[TTS Queue] Retrying in ${backoffDelay}ms (${retryCount + 1}/${maxRetries})...`);
            
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            
            // Push to FRONT of queue for immediate retry
            ttsQueueRef.current.unshift({
              ...item,
              retryCount: retryCount + 1,
            });
          } else {
            console.error(`[TTS Queue] Max retries (${maxRetries}) exceeded, skipping message:`, item.text.substring(0, 50));
            // Mark as spoken even though it failed - prevents infinite retry loop
            spokenMessageIdsRef.current.add(item.messageId);
            
            // CRITICAL: Continue to next item - don't let one failure stop the entire queue
            console.log('[TTS Queue] Continuing to next item in queue...');
          }
        }
      }
    } finally {
      // Release the lock
      isProcessingTTSRef.current = false;
      console.log('[TTS Queue] Queue processor finished');
    }
  };

  // Add translation to queue and start processing
  const speakText = (text: string, languageCode: string, gender: "male" | "female", messageId: string) => {
    // CRITICAL: Check if we've already queued/played this exact messageId
    if (spokenMessageIdsRef.current.has(messageId)) {
      console.log('[TTS Queue] Skipping duplicate messageId:', messageId, text.substring(0, 50));
      return;
    }

    // Also check if already in queue (prevent double-queuing)
    const alreadyInQueue = ttsQueueRef.current.some(item => item.messageId === messageId);
    if (alreadyInQueue) {
      console.log('[TTS Queue] Skipping - already in queue:', messageId, text.substring(0, 50));
      return;
    }

    console.log('[TTS Queue] Adding to queue (queue size: ' + ttsQueueRef.current.length + '):', text.substring(0, 50));
    
    // Add translation to queue - all translations will play in order
    // Do NOT mark as spoken yet - only mark after successful playback
    ttsQueueRef.current.push({ text, languageCode, gender, messageId });
    
    // Start processing the queue if not already processing
    processTTSQueue();
  };

  useEffect(() => {
    if (!roomId) {
      setLocation("/");
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    console.log('[WebSocket] Creating new WebSocket connection to:', wsUrl);
    const ws = new WebSocket(wsUrl);
    const connectionStartTime = Date.now();
    wsRef.current = ws; // Store immediately

    ws.onopen = () => {
      console.log('[WebSocket] Connected successfully, readyState:', ws.readyState);
      setConnectionStatus("connected");
      ws.send(JSON.stringify({
        type: "join",
        roomId,
        language,
        voiceGender,
        role,
      }));

      toast({
        title: "Connected",
        description: "Successfully connected to the room",
      });
    };
    
    ws.onerror = (error) => {
      const duration = Math.floor((Date.now() - connectionStartTime) / 1000);
      const errorDetails = {
        type: 'WebSocket Error',
        duration: `${duration}s`,
        readyState: ws.readyState,
        readyStateText: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][ws.readyState],
        url: ws.url,
        timestamp: new Date().toISOString(),
        error: error
      };
      
      console.error('[WebSocket] ❌ ERROR EVENT FIRED:', errorDetails);
      
      // Don't show error UI immediately - let auto-reconnect handle it
      // The onclose handler will trigger reconnection and only show error if all retries fail
      console.log('[WebSocket] Error occurred, auto-reconnect will handle this if needed');
    };
    
    ws.onclose = (event) => {
      // CRITICAL: Log IMMEDIATELY as first line in handler
      console.log('[WebSocket] 🔌 ONCLOSE HANDLER FIRED! Code:', event.code, 'wasClean:', event.wasClean);
      
      const duration = Math.floor((Date.now() - connectionStartTime) / 1000);
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      const durationStr = `${minutes}m ${seconds}s`;
      
      // Detailed close code explanations for console
      const closeReasons: Record<number, string> = {
        1000: "Normal Closure",
        1001: "Going Away (tab closed/navigated)",
        1002: "Protocol Error",
        1003: "Unsupported Data",
        1005: "No Status Received",
        1006: "Abnormal Closure (network/proxy timeout)",
        1007: "Invalid Frame Payload",
        1008: "Policy Violation",
        1009: "Message Too Big",
        1010: "Missing Extension",
        1011: "Internal Server Error",
        1012: "Service Restart",
        1013: "Try Again Later",
        1014: "Bad Gateway",
        1015: "TLS Handshake Failure"
      };
      
      const closeReason = closeReasons[event.code] || `Unknown (${event.code})`;
      const customReason = event.reason || '';
      
      // ALWAYS log to console - every disconnect case with MAXIMUM detail
      const disconnectLog = {
        code: event.code,
        reason: closeReason,
        customMessage: customReason,
        wasClean: event.wasClean,
        duration: durationStr,
        totalSeconds: duration,
        timestamp: new Date().toISOString(),
        readyState: ws.readyState,
        url: ws.url,
        protocol: ws.protocol,
        bufferedAmount: ws.bufferedAmount
      };
      
      console.log('[WebSocket] 🔌 DISCONNECTED (FULL DETAILS):', disconnectLog);
      
      // Check if this is an intentional disconnect (user clicked End Call)
      const isIntentionalDisconnect = !shouldReconnectRef.current || event.code === 1000 || event.code === 1001;
      
      if (isIntentionalDisconnect) {
        // User intentionally ended call - don't reconnect
        console.log('[Auto-Reconnect] Intentional disconnect - not reconnecting');
        setConnectionStatus("disconnected");
        setDisconnectReason(closeReason);
        setDisconnectDetails(`Duration: ${durationStr}. ${customReason || 'No additional details.'}`);
        return;
      }
      
      // Unintentional disconnect (network issue, timeout, etc.) - auto-reconnect
      console.log('[Auto-Reconnect] Unintentional disconnect detected - will attempt reconnect');
      
      // Set reconnecting status (brief UI feedback)
      setConnectionStatus("connecting");
      setDisconnectReason("Reconnecting...");
      setDisconnectDetails("Connection lost, reconnecting automatically...");
      
      // Attempt reconnection with exponential backoff
      if (isReconnectingRef.current) {
        console.log('[Auto-Reconnect] Already reconnecting - skipping duplicate');
        return;
      }
      
      isReconnectingRef.current = true;
      reconnectAttemptRef.current += 1;
      
      // Exponential backoff: 500ms, 1s, 2s (max 3 attempts)
      const delay = Math.min(500 * Math.pow(2, reconnectAttemptRef.current - 1), 2000);
      
      console.log(`[Auto-Reconnect] Attempt ${reconnectAttemptRef.current}, reconnecting in ${delay}ms...`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (reconnectAttemptRef.current > 3) {
          // Max attempts reached - show error
          console.error('[Auto-Reconnect] Max reconnection attempts reached - giving up');
          setConnectionStatus("disconnected");
          setDisconnectReason("Connection Failed");
          setDisconnectDetails(`Failed to reconnect after ${reconnectAttemptRef.current} attempts. Please refresh the page.`);
          isReconnectingRef.current = false;
          
          toast({
            title: "Connection Failed",
            description: "Could not reconnect automatically. Please refresh the page and try again.",
            variant: "destructive",
            duration: 10000,
          });
          return;
        }
        
        console.log('[Auto-Reconnect] Executing reconnection...');
        
        // Create new WebSocket connection
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        const newWs = new WebSocket(wsUrl);
        const newConnectionStartTime = Date.now();
        
        newWs.onopen = () => {
          console.log('[Auto-Reconnect] ✅ Reconnection successful!');
          wsRef.current = newWs;
          setConnectionStatus("connected");
          reconnectAttemptRef.current = 0; // Reset counter
          isReconnectingRef.current = false;
          
          // Rejoin room with same settings
          newWs.send(JSON.stringify({
            type: "join",
            roomId,
            language,
            voiceGender,
            role,
          }));
          
          // Restart Azure Speech if it was running
          if (!isMutedRef.current && azureTokenRef.current) {
            console.log('[Auto-Reconnect] Restarting Azure Speech recognition...');
            startConversation();
          }
          
          console.log('[Auto-Reconnect] Reconnection complete - conversation resumed');
        };
        
        newWs.onerror = (error) => {
          console.error('[Auto-Reconnect] ❌ Reconnection failed:', error);
          isReconnectingRef.current = false;
          // Will retry due to onclose firing
        };
        
        newWs.onclose = ws.onclose; // Reuse the same close handler
        newWs.onmessage = ws.onmessage; // Reuse the same message handler
        
      }, delay);
    };

    // Application-level heartbeat to prevent 5-minute timeout
    // Send ping every 30 seconds to aggressively keep connection alive through proxies
    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        console.log('[Heartbeat] 💓 Sending ping to keep connection alive, readyState:', ws.readyState);
        ws.send(JSON.stringify({ type: "ping" }));
      } else {
        console.warn('[Heartbeat] ⚠️ Skipping ping - WebSocket not open, readyState:', ws.readyState);
      }
    }, 30000); // 30 seconds - aggressive heartbeat to prevent proxy timeout

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      // Handle pong response from server (keepalive)
      if (message.type === "pong") {
        console.log('[Heartbeat] 💚 Received pong from server - connection alive');
        return;
      }

      if (message.type === "participant-joined") {
        console.log(`[Voice Gender] Partner joined with gender: ${message.voiceGender}`);
        console.log(`[Voice Gender] My gender: ${voiceGender}`);
        setPartnerConnected(true);
        setPartnerLanguage(message.language);
        setPartnerVoiceGender(message.voiceGender);
        setShowShareDialog(false);
        toast({
          title: "Partner Joined",
          description: "Your conversation partner has joined the room",
        });
      }

      if (message.type === "session-started") {
        console.log('[Session] Session started - beginning timer');
        setSessionActive(true);
        setElapsedSeconds(0);
      }

      if (message.type === "session-ended") {
        console.log('[Session] Session ended - handling cleanup and navigation');
        handleSessionEnded(message.reason);
      }

      if (message.type === "credit-update") {
        const { creditsRemaining, exhausted } = message;
        console.log(`[Credits] Update received: ${creditsRemaining} seconds remaining, exhausted: ${exhausted}`);
        
        // Update global auth subscription state so Header and other components show live credits
        updateSubscription({ creditsRemaining });
        
        // Warn when less than 2 minutes (120 seconds) remaining  
        if (creditsRemaining <= 120 && creditsRemaining > 100 && !exhausted) {
          toast({
            title: "Low Credits Warning",
            description: `You have ${(creditsRemaining / 60).toFixed(1)} minutes remaining. Consider upgrading your plan.`,
            variant: "default",
          });
        }
        
        // Warn at 1 minute
        if (creditsRemaining <= 60 && creditsRemaining > 40 && !exhausted) {
          toast({
            title: "Critical - Less Than 1 Minute Remaining",
            description: "Your call will end soon. Upgrade to continue.",
            variant: "destructive",
          });
        }
      }

      if (message.type === "transcription") {
        const isOwn = message.speaker === role;
        
        // Handle interim transcriptions (partial results)
        if (message.interim === true) {
          if (isOwn) {
            setMyInterimText(message.text);
          } else {
            setPartnerInterimText(message.text);
            setPartnerSpeaking(true);
          }
          return;
        }
        
        // Handle final transcriptions
        if (isOwn) {
          setIsSpeaking(false);
          setMyInterimText(""); // Clear interim text
        } else {
          setPartnerSpeaking(false);
          setPartnerInterimText(""); // Clear interim text
        }
      }

      if (message.type === "translation") {
        const isOwn = message.speaker === role;
        
        // CRITICAL: Deduplicate based on server-provided messageId
        // This prevents duplicate WebSocket deliveries while allowing legitimate repeated phrases
        const serverMessageId = message.messageId;
        
        if (!serverMessageId) {
          console.error('[Deduplication] Missing messageId from server - this message may duplicate');
        } else {
          // Check if we've already processed this messageId
          if (processedMessagesRef.current.has(serverMessageId)) {
            console.log('[Deduplication] Skipping duplicate message (already processed):', serverMessageId);
            return; // Already processed this exact message
          }
          
          // Mark as processed
          processedMessagesRef.current.add(serverMessageId);
          
          // Clean up old entries to prevent memory leak (keep last 200)
          if (processedMessagesRef.current.size > 200) {
            const entries = Array.from(processedMessagesRef.current);
            processedMessagesRef.current = new Set(entries.slice(-200));
          }
        }
        
        // Use server messageId if available, otherwise fall back to client-generated
        const messageId = serverMessageId || `${message.speaker}-${Date.now()}-${message.originalText.substring(0, 20)}`;
        const newMessage: TranscriptionMessage = {
          id: messageId,
          originalText: message.originalText,
          translatedText: message.translatedText,
          isOwn,
        };

        if (isOwn) {
          setMyMessages(prev => [...prev, newMessage]);
          setMyInterimText(""); // Clear interim when final arrives
        } else {
          setPartnerMessages(prev => [...prev, newMessage]);
          setPartnerInterimText(""); // Clear interim when final arrives
          // CORRECT LOGIC: Use PARTNER's voiceGender (what they selected = the voice representing THEM)
          // "Your Voice" = voice representing YOU (what partner hears when you speak)
          // "Partner's Voice" = voice representing PARTNER (what you hear when partner speaks)
          // CRITICAL: Use ref to avoid React closure issue
          const currentPartnerGender = partnerVoiceGenderRef.current;
          if (currentPartnerGender) {
            console.log(`[Voice Gender] Playing partner's translation in PARTNER's voice: ${currentPartnerGender}, My voice (what partner hears): ${voiceGender}`);
            console.log(`[Voice Gender] Text to speak: "${message.translatedText}", Language: ${language}`);
            speakText(message.translatedText, language, currentPartnerGender, messageId);
          } else {
            console.error('[Voice Gender] Partner voice gender not set (ref value), skipping TTS. State value:', partnerVoiceGender);
          }
        }
      }

      if (message.type === "participant-left") {
        setPartnerConnected(false);
        toast({
          title: "Partner Left",
          description: "Your conversation partner has left the room",
          variant: "destructive",
        });
      }

      if (message.type === "error") {
        toast({
          title: "Error",
          description: message.message,
          variant: "destructive",
        });
      }
    };

    wsRef.current = ws;

    return () => {
      // Clear heartbeat interval
      clearInterval(heartbeatInterval);
      
      // Clear the TTS queue and stop any playing audio when leaving the room
      ttsQueueRef.current = [];
      isProcessingTTSRef.current = false;
      
      // Clean up the single audio element
      if (currentAudioRef.current) {
        try {
          currentAudioRef.current.pause();
          currentAudioRef.current.src = '';
          currentAudioRef.current.load();
          currentAudioRef.current = null;
        } catch (error) {
          console.error('[TTS Queue] Error stopping HTML5 audio on unmount:', error);
        }
      }
      
      // Clean up blob URL
      if (currentBlobUrlRef.current) {
        try {
          URL.revokeObjectURL(currentBlobUrlRef.current);
          currentBlobUrlRef.current = null;
        } catch (error) {
          console.error('[TTS Queue] Error revoking blob URL on unmount:', error);
        }
      }
      
      if (activeSynthesizerRef.current) {
        try {
          console.log('[TTS Queue] Stopping audio on component unmount');
          activeSynthesizerRef.current.close();
          activeSynthesizerRef.current = null;
        } catch (error) {
          console.error('[TTS Queue] Error stopping audio on unmount:', error);
        }
      }
      
      console.log('[WebSocket Cleanup] Component unmounting - cleaning up WebSocket, current readyState:', ws.readyState);
      
      // Clear reconnect timeout if pending
      if (reconnectTimeoutRef.current) {
        console.log('[WebSocket Cleanup] Clearing pending reconnect timeout');
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Prevent reconnect on component unmount
      shouldReconnectRef.current = false;
      
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        console.log('[WebSocket Cleanup] Closing WebSocket during component unmount');
        ws.close(1000, "Component unmount");
      } else {
        console.log('[WebSocket Cleanup] WebSocket already closed during unmount, readyState:', ws.readyState);
      }
      
      console.log('[WebSocket Cleanup] Clearing heartbeat interval');
      clearInterval(heartbeatInterval);
      
      console.log('[WebSocket Cleanup] Cleanup complete');
    };
    // CRITICAL: Do NOT include toast or setLocation - they cause constant re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, language, voiceGender, role]);

  const startConversation = async () => {
    // Check if quota is already exceeded
    if (quotaExceededRef.current) {
      toast({
        title: "Quota Limit Reached",
        description: "Cannot start conversation - Azure quota exceeded. Please upgrade your Azure account.",
        variant: "destructive",
      });
      return;
    }
    
    setConversationStarted(true);
    
    // MOBILE FIX: Unlock audio on first microphone activation
    await unlockAudioForMobile();
    
    try {
      const { token, region } = await getAzureToken();
      
      const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
      speechConfig.speechRecognitionLanguage = azureLanguageMap[language] || 'en-US';
      
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
      
      // Azure Speech SDK error handlers
      recognizer.canceled = (s, e) => {
        console.error('[Azure Speech] ❌ RECOGNITION CANCELED:', {
          reason: e.reason,
          errorCode: e.errorCode,
          errorDetails: e.errorDetails,
          sessionId: e.sessionId,
          timestamp: new Date().toISOString()
        });
        
        if (e.errorCode) {
          setDisconnectReason("Azure Speech Error");
          setDisconnectDetails(`Speech recognition error: ${e.errorDetails || e.errorCode}`);
          
          toast({
            title: "Speech Recognition Error",
            description: `Azure Speech SDK error: ${e.errorDetails || e.errorCode}`,
            variant: "destructive",
            duration: 10000,
          });
        }
      };
      
      recognizer.sessionStarted = (s, e) => {
        console.log('[Azure Speech] ✓ Session started:', {
          sessionId: e.sessionId,
          timestamp: new Date().toISOString()
        });
      };
      
      recognizer.sessionStopped = (s, e) => {
        console.log('[Azure Speech] Session stopped:', {
          sessionId: e.sessionId,
          timestamp: new Date().toISOString()
        });
      };
      
      recognizer.recognizing = (s, e) => {
        // CRITICAL: Don't process events if we're muted
        if (isMutedRef.current) {
          console.log('[Speech] Ignoring recognizing event - microphone is muted');
          return;
        }
        
        if (e.result.text) {
          setIsSpeaking(true);
          
          // Throttle interim updates to every 300ms
          const now = Date.now();
          if (now - lastInterimSentRef.current >= 300) {
            lastInterimSentRef.current = now;
            
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({
                type: "transcription",
                roomId,
                text: e.result.text,
                language,
                interim: true, // Mark as interim result
              }));
            }
          }
        }
      };
      
      recognizer.recognized = (s, e) => {
        // CRITICAL: Don't process events if we're muted
        if (isMutedRef.current) {
          console.log('[Speech] Ignoring recognized event - microphone is muted');
          return;
        }
        
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech && e.result.text) {
          setIsSpeaking(false);
          
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: "transcription",
              roomId,
              text: e.result.text,
              language,
              interim: false, // Mark as final result
            }));
          }
        }
      };
      
      // CRITICAL: Add error handlers to prevent recognizer from stopping
      recognizer.canceled = (s, e) => {
        console.error('[Speech] Recognition canceled:', e.reason, e.errorDetails);
        
        // Check if this is a quota error
        const isQuotaError = e.errorDetails?.toLowerCase().includes('quota') || 
                           e.errorDetails?.toLowerCase().includes('429') ||
                           e.errorDetails?.toLowerCase().includes('rate limit');
        
        if (isQuotaError) {
          console.error('[Speech] QUOTA EXCEEDED - stopping auto-retry to prevent infinite loop');
          quotaExceededRef.current = true;
          setQuotaExceeded(true);
          setQuotaError('Azure Speech Services quota exceeded. Your account has hit its usage limit.');
          setIsMuted(true);
          
          // Stop the recognizer completely
          if (recognizerRef.current) {
            recognizerRef.current.stopContinuousRecognitionAsync(
              () => {
                console.log('[Speech] Recognition stopped due to quota limit');
                recognizerRef.current?.close();
                recognizerRef.current = null;
              },
              (err) => console.error('[Speech] Error stopping recognizer:', err)
            );
          }
          
          toast({
            title: "Quota Limit Reached",
            description: "Your Azure Speech Services quota has been exceeded. Please upgrade your Azure account or wait for quota reset.",
            variant: "destructive",
            duration: 10000,
          });
          
          return; // Don't attempt restart
        }
        
        // If error is recoverable (not quota), restart recognition automatically
        if (e.reason === SpeechSDK.CancellationReason.Error && !quotaExceededRef.current) {
          console.log('[Speech] Attempting to restart recognition after error...');
          setTimeout(() => {
            // Check ref instead of state to avoid stale closure
            if (!isMutedRef.current && recognizerRef.current === recognizer) {
              recognizer.startContinuousRecognitionAsync(
                () => {
                  console.log('[Speech] Recognition restarted successfully');
                  isMutedRef.current = false;
                },
                (err) => console.error('[Speech] Failed to restart recognition:', err)
              );
            }
          }, 1000);
        }
      };
      
      recognizer.sessionStopped = (s, e) => {
        console.log('[Speech] Session stopped - will restart if not muted');
      };
      
      recognizer.startContinuousRecognitionAsync(
        () => {
          console.log('[Speech] Recognition started successfully');
          recognizerRef.current = recognizer;
          isMutedRef.current = false; // Update ref to allow event processing
          setIsMuted(false);
        },
        (err) => {
          console.error('[Speech] Failed to start recognition:', err);
          toast({
            title: "Speech Recognition Failed",
            description: "Could not start speech recognition. Please try again.",
            variant: "destructive",
          });
          isMutedRef.current = true; // Keep muted in ref
          setIsMuted(true);
        }
      );
      
    } catch (error) {
      console.error('Speech recognition error:', error);
      toast({
        title: "Microphone Access Denied",
        description: "Please enable microphone access to use voice features",
        variant: "destructive",
      });
      isMutedRef.current = true; // Keep muted in ref
      setIsMuted(true);
    }
  };


  const toggleMute = async () => {
    // Prevent unmuting if quota exceeded
    if (isMuted && quotaExceededRef.current) {
      toast({
        title: "Quota Limit Reached",
        description: "Cannot enable microphone - Azure quota exceeded. Please upgrade your Azure account.",
        variant: "destructive",
      });
      return;
    }
    
    if (!isMuted) {
      // Muting - stop the recognizer completely
      console.log('[Mic] Muting microphone - stopping recognition');
      
      // CRITICAL: Set muted state in ref FIRST to stop event processing immediately
      isMutedRef.current = true;
      setIsMuted(true);
      setIsSpeaking(false); // Clear speaking state immediately
      setMyInterimText(""); // Clear interim text
      
      if (recognizerRef.current) {
        const recognizer = recognizerRef.current;
        
        // Properly stop and clean up the recognizer
        try {
          await new Promise<void>((resolve, reject) => {
            recognizer.stopContinuousRecognitionAsync(
              () => {
                console.log('[Mic] Recognition stopped successfully');
                resolve();
              },
              (err) => {
                console.error('[Mic] Error stopping recognition:', err);
                reject(err);
              }
            );
          });
          
          // Close and null the recognizer after stopping
          recognizer.close();
          recognizerRef.current = null;
          console.log('[Mic] Recognizer closed and cleaned up');
        } catch (error) {
          console.error('[Mic] Failed to stop recognizer:', error);
          // Force cleanup even on error
          try {
            recognizer.close();
          } catch (e) {
            console.error('[Mic] Error closing recognizer:', e);
          }
          recognizerRef.current = null;
        }
      }
    } else {
      // Unmuting - start conversation
      console.log('[Mic] Unmuting microphone - starting recognition');
      isMutedRef.current = false; // Clear muted state in ref
      startConversation();
    }
  };

  const handleSessionEnded = (reason: 'creator-left' | 'participant-left' | 'credits-exhausted') => {
    console.log(`[Session] Handling session end, reason: ${reason}`);
    
    shouldReconnectRef.current = false;
    isReconnectingRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      console.log('[Session] Clearing reconnect timeout');
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (recognizerRef.current) {
      console.log('[Session] Stopping Azure Speech recognizer');
      const recognizer = recognizerRef.current;
      try {
        recognizer.stopContinuousRecognitionAsync(
          () => {
            console.log('[Session] Recognition stopped successfully');
            recognizer.close();
            recognizerRef.current = null;
          },
          (err) => {
            console.error('[Session] Error stopping recognition:', err);
            try {
              recognizer.close();
            } catch (e) {
              console.error('[Session] Error closing recognizer:', e);
            }
            recognizerRef.current = null;
          }
        );
      } catch (error) {
        console.error('[Session] Failed to stop recognizer:', error);
        try {
          recognizer.close();
        } catch (e) {
          console.error('[Session] Error closing recognizer:', e);
        }
        recognizerRef.current = null;
      }
    }
    
    if (activeSynthesizerRef.current) {
      console.log('[Session] Closing active synthesizer');
      try {
        activeSynthesizerRef.current.close();
      } catch (error) {
        console.error('[Session] Error closing synthesizer:', error);
      }
      activeSynthesizerRef.current = null;
    }
    
    ttsQueueRef.current = [];
    isProcessingTTSRef.current = false;
    
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = '';
        currentAudioRef.current.load();
      } catch (error) {
        console.error('[Session] Error stopping audio:', error);
      }
    }
    
    setSessionActive(false);
    setPartnerConnected(false);
    setConversationStarted(false);
    setMyInterimText("");
    setPartnerInterimText("");
    
    const reasonMessages = {
      'creator-left': {
        title: "Call Ended - Room Owner Left",
        description: "The room owner has ended the call."
      },
      'participant-left': {
        title: "Call Ended - Partner Left",
        description: "Your conversation partner has left the room."
      },
      'credits-exhausted': {
        title: "Call Ended - No Credits Remaining",
        description: "Your credits have been exhausted. Please upgrade your plan to continue."
      }
    };
    
    const message = reasonMessages[reason];
    toast({
      title: message.title,
      description: message.description,
      variant: "destructive",
    });
    
    setTimeout(() => {
      console.log('[Session] Navigating to dashboard after session end');
      setLocation("/");
    }, 2500);
  };

  const handleEndCall = () => {
    console.log('[End Call] User clicked End Call button - closing connection and navigating home');
    shouldReconnectRef.current = false; // Prevent auto-reconnect on intentional disconnect
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close(1000, "User ended call");
    }
    setLocation("/");
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/join/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link Copied",
      description: "Share this link with your conversation partner",
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:72px_72px]" />
      
      {/* Header - Compact Desktop */}
      <header className="border-b border-slate-300/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl relative z-10 pt-16 md:pt-20">
        <div className="container mx-auto px-3 sm:px-6 md:px-12 py-2">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Connection Status & Timer */}
            <div className="flex items-center gap-3">
              <ConnectionStatus 
                status={connectionStatus} 
                disconnectReason={disconnectReason}
                disconnectDetails={disconnectDetails}
              />
              
              {/* Session Timer - show when session is active or has elapsed time */}
              {(sessionActive || elapsedSeconds > 0) && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                  sessionActive 
                    ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30' 
                    : 'bg-gray-500/10 border border-gray-500/30'
                }`}>
                  {sessionActive && <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
                  <span className="text-sm font-mono font-bold text-foreground" data-testid="text-session-timer">
                    {formatTime(elapsedSeconds)}
                  </span>
                </div>
              )}
            </div>
            
            {/* Center: Language & Voice Info - Compact */}
            {myLanguage && theirLanguage && (
              <div className="flex items-center gap-4">
                {/* You */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/20">
                  <img 
                    src={`https://flagcdn.com/w40/${myLanguage.countryCode.toLowerCase()}.png`}
                    width="20"
                    height="15"
                    alt={myLanguage.code}
                    className="rounded border border-slate-400 dark:border-slate-600"
                  />
                  <span className="text-xs font-semibold text-foreground capitalize">
                    {myLanguage.name} ({voiceGender})
                  </span>
                </div>
                
                <div className="text-muted-foreground">↔</div>
                
                {/* Partner */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/5 border border-accent/20">
                  <img 
                    src={`https://flagcdn.com/w40/${theirLanguage.countryCode.toLowerCase()}.png`}
                    width="20"
                    height="15"
                    alt={theirLanguage.code}
                    className="rounded border border-slate-400 dark:border-slate-600"
                  />
                  <span className="text-xs font-semibold text-foreground capitalize">
                    {theirLanguage.name} ({partnerVoiceGender || '...'})
                  </span>
                </div>
              </div>
            )}
            
            {/* Right: End Call */}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEndCall}
              className="gap-2"
              data-testid="button-end-call"
            >
              <PhoneOff className="h-4 w-4" />
              <span className="hidden sm:inline text-sm">End Call</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Quota Warning Banner */}
      {quotaExceeded && (
        <div className="bg-destructive/20 border-y border-destructive/50 backdrop-blur-sm relative z-10">
          <div className="container mx-auto px-6 md:px-12 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex-shrink-0 h-6 w-6 rounded-full bg-destructive/30 flex items-center justify-center">
                  <span className="text-destructive font-bold text-sm">!</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-destructive mb-1">Azure Quota Limit Reached</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Your Azure Speech Services quota has been exceeded. If you've upgraded your account or changed API keys, click "Try Again" to resume.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  quotaExceededRef.current = false;
                  setQuotaExceeded(false);
                  setQuotaError("");
                  toast({
                    title: "Quota Reset",
                    description: "You can now try using voice features again",
                  });
                }}
                className="flex-shrink-0"
                data-testid="button-reset-quota"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Mobile Optimized */}
      <main className="flex-1 overflow-hidden relative z-10">
        <div className="h-full container mx-auto px-3 sm:px-6 md:px-12 py-3 sm:py-4 md:py-6">
          <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 max-w-7xl mx-auto">
            <TranscriptionPanel
              title="You"
              isActive={isSpeaking}
              messages={myMessages}
              isSpeaking={isSpeaking}
              interimText={myInterimText}
            />
            <TranscriptionPanel
              title="Partner"
              isActive={partnerSpeaking}
              messages={partnerMessages}
              isSpeaking={partnerSpeaking}
              interimText={partnerInterimText}
            />
          </div>
        </div>
      </main>

      {/* Footer - Mobile Optimized */}
      <footer className="border-t border-slate-300/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl relative z-10">
        <div className="container mx-auto px-3 sm:px-6 md:px-12 py-3 sm:py-4 md:py-6">
          {!conversationStarted && connectionStatus === "connected" ? (
            <div className="flex flex-col items-center gap-2 sm:gap-4">
              <Button
                size="lg"
                onClick={startConversation}
                disabled={quotaExceeded}
                className="h-12 sm:h-14 md:h-16 px-8 sm:px-10 md:px-12 text-base sm:text-lg bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/25 group disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-start-conversation"
              >
                <Mic className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 group-hover:scale-110 transition-transform" />
                {quotaExceeded ? "Quota Exceeded" : "Start Conversation"}
              </Button>
              <p className="text-xs sm:text-sm text-muted-foreground text-center px-4">
                {quotaExceeded 
                  ? "Cannot start - Azure quota limit reached" 
                  : "Click to enable your microphone and begin speaking"
                }
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              <Button
                size="lg"
                variant={isMuted ? "secondary" : "default"}
                onClick={toggleMute}
                disabled={quotaExceeded && isMuted}
                className={`h-16 w-16 sm:h-20 sm:w-20 rounded-full shadow-xl ${
                  !isMuted ? "bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-primary/25" : ""
                } ${quotaExceeded && isMuted ? "opacity-50 cursor-not-allowed" : ""}`}
                data-testid="button-toggle-mic"
              >
                {isMuted ? <MicOff className="h-6 w-6 sm:h-8 sm:w-8" /> : <Mic className="h-6 w-6 sm:h-8 sm:w-8" />}
              </Button>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
                  {!isMuted && (
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  )}
                  <span className="font-bold text-sm sm:text-base md:text-lg text-foreground">
                    {quotaExceeded && isMuted 
                      ? "Quota Exceeded" 
                      : isMuted 
                        ? "Microphone Off" 
                        : partnerConnected 
                          ? "Ready to speak" 
                          : "Waiting for partner"
                    }
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground px-4">
                  {quotaExceeded && isMuted 
                    ? "Azure quota reached - upgrade to continue"
                    : isMuted 
                      ? "Click the button to unmute" 
                      : "Click to mute your microphone"
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </footer>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-lg bg-white/95 dark:bg-slate-800/95 border-slate-300/50 dark:border-slate-700/50 backdrop-blur-xl" data-testid="dialog-share-link">
          <DialogHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/30">
                <Share2 className="h-7 w-7 text-primary" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
                <Sparkles className="h-3.5 w-3.5 text-success animate-pulse" />
                <span className="text-xs font-semibold text-success">Room Created</span>
              </div>
            </div>
            <div>
              <DialogTitle className="text-3xl text-foreground">Share Room Link</DialogTitle>
              <DialogDescription className="text-base mt-2 text-muted-foreground">
                Send this link to your conversation partner to start translating
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="flex gap-2">
              <Input
                readOnly
                value={`${window.location.origin}/join/${roomId}`}
                className="font-mono text-sm bg-slate-100/50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 text-foreground"
                data-testid="input-share-link"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="shrink-0"
                data-testid="button-copy-link"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button
              onClick={() => setShowShareDialog(false)}
              className="w-full h-14 text-base bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/25"
              data-testid="button-close-dialog"
            >
              <Mic className="mr-2 h-5 w-5" />
              {partnerConnected ? "Start Conversation" : "Got it"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
