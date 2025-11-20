import { useState, useEffect, useRef, useMemo } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Mic, MicOff, PhoneOff, Copy, Check, Share2, Volume2, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { TranscriptionPanel } from "@/components/TranscriptionPanel";
import { UpgradeModal } from "@/components/UpgradeModal";
import { RatingDialog } from "@/components/RatingDialog";
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
  const { updateSubscription, user, subscription } = useAuth();

  // MOBILE STABILITY FIX: Store roomId in ref to prevent undefined during mobile browser backgrounding
  // Mobile browsers (Chrome, Safari, Firefox) can temporarily lose route params when:
  // - Opening share sheet / clipboard UI
  // - Backgrounding the tab
  // - Screen orientation changes
  // Storing in ref creates stable reference that persists through React re-renders
  const roomIdRef = useRef<string | undefined>(params?.roomId);
  const roomId = params?.roomId;
  
  // Update ref if params change (shouldn't happen, but defensive)
  if (roomId && roomId !== roomIdRef.current) {
    console.log(`[Room Stability] roomId changed from ${roomIdRef.current} to ${roomId}`);
    roomIdRef.current = roomId;
  }
  
  // CRITICAL: If roomId is undefined initially, redirect immediately - corrupted URL
  if (!roomIdRef.current) {
    console.error('[Room Stability] ❌ CRITICAL: roomId is undefined - redirecting to home');
    console.error('[Room Stability] URL:', window.location.href);
    console.error('[Room Stability] Params:', params);
    setLocation("/");
    return null; // Early return - don't render anything
  }
  
  // Memoize URL params to prevent re-creating on every render
  const { role, language, voiceGender } = useMemo(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      role: urlParams.get("role") || "creator",
      language: urlParams.get("language") || "en",
      voiceGender: (urlParams.get("voiceGender") || "female") as "male" | "female"
    };
  }, []); // Only calculate once on mount
  
  // Auto-recreate state management
  const autoRecreateInProgressRef = useRef(false);
  
  // Only log on mount, not on every render
  useEffect(() => {
    console.log(`[Room Init] Role: ${role}, Language: ${language}, My Voice Gender: ${voiceGender}`);
    
    // Track browser tab visibility changes (logging only - reconnection handled by dedicated useEffect below)
    const handleVisibilityChange = () => {
      console.log('[Browser] Visibility changed:', document.hidden ? 'HIDDEN' : 'VISIBLE');
      if (document.hidden) {
        console.log('[Browser] ⚠️ Tab is now hidden - this may affect WebSocket/Azure connections');
      } else {
        console.log('[Browser] ✓ Tab is now visible again');
        // NOTE: Reconnection logic is handled by dedicated Page Visibility useEffect hook further down
        // This handler is for logging only to avoid duplicate/conflicting reconnection attempts
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0); // State for UI updates
  const [showRatingDialog, setShowRatingDialog] = useState(false);

  const [myMessages, setMyMessages] = useState<TranscriptionMessage[]>([]);
  const [partnerMessages, setPartnerMessages] = useState<TranscriptionMessage[]>([]);
  const [myInterimText, setMyInterimText] = useState<string>("");
  const [partnerInterimText, setPartnerInterimText] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);
  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);
  const azureSessionReadyRef = useRef<boolean>(false); // Track if Azure Speech SDK session is ready
  const azureTokenRef = useRef<{ token: string; region: string } | null>(null);
  const spokenMessageIdsRef = useRef<Set<string>>(new Set());
  const processedMessagesRef = useRef<Set<string>>(new Set()); // Track processed server messageIds for deduplication
  const processedResultIdsRef = useRef<Map<string, number>>(new Map()); // Track Azure Speech SDK resultIds to prevent duplicate rescoring events
  const processedOffsetsRef = useRef<Map<string, { offset: number; text: string; timestamp: number }>>(new Map()); // Track Azure Speech SDK audio offsets + text for temporal deduplication
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
  
  // Request throttling - prevent concurrent Azure API calls
  const ttsRequestInFlightRef = useRef<boolean>(false);
  const tokenRequestInFlightRef = useRef<boolean>(false);
  
  // REQUEST COUNTERS: Track all Azure API calls for monitoring and cost control
  const ttsRequestCounterRef = useRef<number>(0);
  const tokenRequestCounterRef = useRef<number>(0);
  const translationRequestCounterRef = useRef<number>(0);
  
  // Auto-reconnect state
  const reconnectAttemptRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isReconnectingRef = useRef<boolean>(false);
  const shouldReconnectRef = useRef<boolean>(true); // Set to false on intentional disconnect
  
  // FIX: Auto-clear interim text timeouts - prevents "Transcribing..." from freezing UI
  // If Azure doesn't send a final transcription within 3 seconds, auto-clear the interim text
  const myInterimTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const partnerInterimTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // MOBILE FIX: Promise-based reconnection coordinator - prevents overlapping WebSocket connections
  // Multiple triggers (visibility change, network restore, onclose) can call reconnect simultaneously
  // Coordinator serializes all reconnect requests to prevent race conditions
  const reconnectPromiseRef = useRef<Promise<WebSocket> | null>(null);
  const reconnectAbortControllerRef = useRef<AbortController | null>(null);
  
  // MOBILE FIX: Token-based WebSocket authentication
  // Tokens persist in client memory and survive mobile network switches/backgrounding (unlike cookies)
  const wsTokenRef = useRef<string | null>(null);
  const wsUrlRef = useRef<string | null>(null);
  
  // Promise-based URL readiness notification (avoids busy-wait loops)
  const wsUrlReadyResolverRef = useRef<(() => void) | null>(null);
  const wsUrlReadyPromise = useRef<Promise<void>>(
    new Promise(resolve => {
      wsUrlReadyResolverRef.current = resolve;
    })
  );
  
  // MESSAGE QUEUE: Store transcriptions when WebSocket isn't ready
  // Prevents messages from being lost during connection delays
  interface PendingMessage {
    type: string;
    roomId: string;
    text: string;
    language: string;
    interim: boolean;
    offset?: number;
    duration?: number;
    timestamp: number;
  }
  const pendingMessagesRef = useRef<PendingMessage[]>([]);
  
  // MOBILE FIX: Fetch WebSocket token with retry logic for resilient authentication
  useEffect(() => {
    const fetchWsToken = async (retryCount = 0): Promise<void> => {
      try {
        const response = await fetch('/api/ws/token');
        if (response.ok) {
          const data = await response.json();
          wsTokenRef.current = data.token;
          console.log('[WebSocket Token] ✅ Fetched authentication token');
          
          // Build WebSocket URL with token
          const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
          const host = window.location.host || window.location.hostname + (window.location.port ? ':' + window.location.port : '');
          const wsUrl = `${protocol}//${host}/ws?token=${data.token}`;
          wsUrlRef.current = wsUrl;
          console.log('[WebSocket] Cached authenticated URL for mobile stability');
          
          // Notify waiting connections that URL is ready
          if (wsUrlReadyResolverRef.current) {
            wsUrlReadyResolverRef.current();
            wsUrlReadyResolverRef.current = null;
          }
        } else if (response.status === 401) {
          // Not authenticated - fall back to cookie-based auth
          console.log('[WebSocket Token] Not authenticated, using cookie-based auth');
          const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
          const host = window.location.host || window.location.hostname + (window.location.port ? ':' + window.location.port : '');
          const wsUrl = `${protocol}//${host}/ws`;
          wsUrlRef.current = wsUrl;
          console.log('[WebSocket] Cached URL (cookie auth) for mobile stability');
          
          // Notify waiting connections that URL is ready
          if (wsUrlReadyResolverRef.current) {
            wsUrlReadyResolverRef.current();
            wsUrlReadyResolverRef.current = null;
          }
        } else {
          // Server error - retry up to 3 times
          if (retryCount < 3) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff: 1s, 2s, 4s
            console.log(`[WebSocket Token] Server error (${response.status}), retrying in ${delay}ms (attempt ${retryCount + 1}/3)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchWsToken(retryCount + 1);
          } else {
            console.error('[WebSocket Token] Failed after 3 retries, falling back to cookie auth');
            const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            const host = window.location.host || window.location.hostname + (window.location.port ? ':' + window.location.port : '');
            const wsUrl = `${protocol}//${host}/ws`;
            wsUrlRef.current = wsUrl;
            
            // Notify waiting connections that URL is ready
            if (wsUrlReadyResolverRef.current) {
              wsUrlReadyResolverRef.current();
              wsUrlReadyResolverRef.current = null;
            }
          }
        }
      } catch (error) {
        // Network error - retry up to 3 times
        if (retryCount < 3) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
          console.log(`[WebSocket Token] Network error, retrying in ${delay}ms (attempt ${retryCount + 1}/3):`, error);
          await new Promise(resolve => setTimeout(resolve, delay));
          return fetchWsToken(retryCount + 1);
        } else {
          console.error('[WebSocket Token] Failed after 3 retries, using cookie-based auth:', error);
          const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
          const host = window.location.host || window.location.hostname + (window.location.port ? ':' + window.location.port : '');
          const wsUrl = `${protocol}//${host}/ws`;
          wsUrlRef.current = wsUrl;
          
          // Notify waiting connections that URL is ready
          if (wsUrlReadyResolverRef.current) {
            wsUrlReadyResolverRef.current();
            wsUrlReadyResolverRef.current = null;
          }
        }
      }
    };
    
    if (!wsUrlRef.current) {
      fetchWsToken();
    }
  }, []);
  
  // localStorage helpers for room persistence
  const ROOM_STORAGE_KEY = 'voztra_last_room';
  const ROOM_TTL = 15 * 60 * 1000; // 15 minutes
  
  // SEQUENCE TRACKING: Store last received sequence number per room to prevent replay on reconnect
  const getLastReceivedSeqKey = (roomId: string) => `voztra_seq_${roomId}`;
  
  const getLastReceivedSeq = (roomId: string): number => {
    try {
      const stored = localStorage.getItem(getLastReceivedSeqKey(roomId));
      if (!stored) return 0;
      const seq = parseInt(stored, 10);
      console.log(`[Sequence] 📖 Retrieved lastReceivedSeq=${seq} for room ${roomId}`);
      return isNaN(seq) ? 0 : seq;
    } catch (error) {
      console.warn('[Sequence] Failed to get lastReceivedSeq:', error);
      return 0;
    }
  };
  
  const saveLastReceivedSeq = (roomId: string, seq: number) => {
    try {
      localStorage.setItem(getLastReceivedSeqKey(roomId), seq.toString());
      console.log(`[Sequence] 💾 Saved lastReceivedSeq=${seq} for room ${roomId}`);
    } catch (error) {
      console.warn('[Sequence] Failed to save lastReceivedSeq:', error);
    }
  };
  
  const clearLastReceivedSeq = (roomId: string) => {
    try {
      localStorage.removeItem(getLastReceivedSeqKey(roomId));
      console.log(`[Sequence] 🧹 Cleared lastReceivedSeq for room ${roomId}`);
    } catch (error) {
      console.warn('[Sequence] Failed to clear lastReceivedSeq:', error);
    }
  };
  
  const saveRoomToStorage = (settings: { roomId: string; language: string; voiceGender: string; role: string }) => {
    try {
      const data = {
        ...settings,
        createdAt: Date.now()
      };
      localStorage.setItem(ROOM_STORAGE_KEY, JSON.stringify(data));
      console.log('[Room Persistence] Saved room settings to localStorage:', settings.roomId);
    } catch (error) {
      console.warn('[Room Persistence] Failed to save to localStorage (private mode?):', error);
    }
  };
  
  const loadRoomFromStorage = (): { roomId: string; language: string; voiceGender: string; role: string } | null => {
    try {
      const data = localStorage.getItem(ROOM_STORAGE_KEY);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      const age = Date.now() - parsed.createdAt;
      
      if (age > ROOM_TTL) {
        console.log('[Room Persistence] Stored room expired (age:', Math.floor(age / 1000), 's), clearing');
        clearRoomFromStorage();
        return null;
      }
      
      console.log('[Room Persistence] Loaded room from localStorage:', parsed.roomId);
      return parsed;
    } catch (error) {
      console.warn('[Room Persistence] Failed to load from localStorage:', error);
      return null;
    }
  };
  
  const clearRoomFromStorage = () => {
    try {
      localStorage.removeItem(ROOM_STORAGE_KEY);
      console.log('[Room Persistence] Cleared room from localStorage');
    } catch (error) {
      console.warn('[Room Persistence] Failed to clear localStorage:', error);
    }
  };
  
  // Partner join timeout (Google Meet-style behavior)
  const PARTNER_WAIT_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  const PARTNER_WAIT_WARNING_TIME = 4 * 60 * 1000; // 4:00 - show warning 1 minute before timeout
  const partnerWaitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const partnerWaitWarningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [waitingCountdown, setWaitingCountdown] = useState<number>(0);

  const myLanguage = SUPPORTED_LANGUAGES.find(l => l.code === language);
  const theirLanguage = SUPPORTED_LANGUAGES.find(l => l.code === partnerLanguage);
  
  // Keep ref in sync with state AND debug log
  useEffect(() => {
    partnerVoiceGenderRef.current = partnerVoiceGender;
    console.log('[State Change] partnerVoiceGender updated to:', partnerVoiceGender);
  }, [partnerVoiceGender]);

  // Cleanup interim text timeouts on component unmount
  // Prevents orphaned callbacks from firing after navigation/unmount
  useEffect(() => {
    return () => {
      console.log('[Cleanup] Clearing interim text timeouts on unmount');
      if (myInterimTimeoutRef.current) {
        clearTimeout(myInterimTimeoutRef.current);
        myInterimTimeoutRef.current = null;
      }
      if (partnerInterimTimeoutRef.current) {
        clearTimeout(partnerInterimTimeoutRef.current);
        partnerInterimTimeoutRef.current = null;
      }
    };
  }, []); // Empty deps - only run on mount/unmount

  // Timer - increment elapsed seconds every second when session is active
  useEffect(() => {
    if (!sessionActive) return;

    const timerId = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [sessionActive]);

  // Partner join timeout - Only for room owners
  useEffect(() => {
    // Only apply timeout for room creators/owners, not participants
    if (role !== "creator" && role !== "owner") {
      console.log('[Partner Wait] Skipping timeout - user is participant');
      return;
    }

    // If partner already connected, no need for timeout
    if (partnerConnected) {
      console.log('[Partner Wait] Partner already connected - clearing all timers');
      
      // Clear all timeout and countdown timers
      if (partnerWaitTimeoutRef.current) {
        clearTimeout(partnerWaitTimeoutRef.current);
        partnerWaitTimeoutRef.current = null;
      }
      if (partnerWaitWarningTimeoutRef.current) {
        clearTimeout(partnerWaitWarningTimeoutRef.current);
        partnerWaitWarningTimeoutRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setWaitingCountdown(0);
      return;
    }

    console.log('[Partner Wait] Starting 5-minute partner join timeout for owner');

    // Set warning timeout at 4:00 (1 minute before final timeout)
    partnerWaitWarningTimeoutRef.current = setTimeout(() => {
      console.log('[Partner Wait] Warning - 60 seconds (1 minute) until redirect');
      
      // Start 60-second countdown
      let secondsLeft = 60;
      setWaitingCountdown(secondsLeft);
      
      // Show initial warning toast
      toast({
        title: "No One Joined Yet",
        description: `Your partner hasn't joined yet. Redirecting to home in 1 minute...`,
        variant: "info",
      });
      
      // Update countdown every second
      countdownIntervalRef.current = setInterval(() => {
        secondsLeft--;
        setWaitingCountdown(secondsLeft);
        
        if (secondsLeft <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
        }
      }, 1000);
      
    }, PARTNER_WAIT_WARNING_TIME);

    // Set final timeout at 5:00 - redirect to home
    partnerWaitTimeoutRef.current = setTimeout(() => {
      console.log('[Partner Wait] Timeout reached - redirecting to home');
      
      // Clear countdown interval
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      
      // Close WebSocket gracefully with custom close code
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        console.log('[Partner Wait] Closing WebSocket due to partner timeout');
        shouldReconnectRef.current = false; // Prevent auto-reconnect
        wsRef.current.close(4000, "partner-timeout");
      }
      
      // Show final notification
      toast({
        title: "Returning to Home",
        description: "No one joined your room. You can create a new one anytime.",
        variant: "info",
      });
      
      // Redirect to home after brief delay
      setTimeout(() => {
        setLocation("/");
      }, 1500);
      
    }, PARTNER_WAIT_TIMEOUT);

    // Cleanup function - clear all timers on unmount or when partner connects
    return () => {
      console.log('[Partner Wait] Cleaning up timeout timers');
      if (partnerWaitTimeoutRef.current) {
        clearTimeout(partnerWaitTimeoutRef.current);
        partnerWaitTimeoutRef.current = null;
      }
      if (partnerWaitWarningTimeoutRef.current) {
        clearTimeout(partnerWaitWarningTimeoutRef.current);
        partnerWaitWarningTimeoutRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [role, partnerConnected, toast, setLocation, PARTNER_WAIT_TIMEOUT, PARTNER_WAIT_WARNING_TIME]);

  const azureLanguageMap: Record<string, string> = {
    // Base languages (short codes mapped to default locales)
    'en': 'en-US', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE',
    'it': 'it-IT', 'pt': 'pt-PT', 'ru': 'ru-RU', 'ja': 'ja-JP',
    'ko': 'ko-KR', 'zh': 'zh-CN', 'ar': 'ar-SA', 'hi': 'hi-IN',
    'nl': 'nl-NL', 'pl': 'pl-PL', 'tr': 'tr-TR', 'sv': 'sv-SE',
    'nb': 'nb-NO', 'da': 'da-DK', 'fi': 'fi-FI', 'el': 'el-GR',
    'cs': 'cs-CZ', 'ro': 'ro-RO', 'uk': 'uk-UA', 'hu': 'hu-HU',
    'vi': 'vi-VN', 'th': 'th-TH', 'id': 'id-ID', 'he': 'he-IL',
    'bn': 'bn-IN', 'ta': 'ta-IN', 'te': 'te-IN', 'mr': 'mr-IN',
    'bg': 'bg-BG', 'hr': 'hr-HR', 'sk': 'sk-SK', 'sl': 'sl-SI',
    'ca': 'ca-ES', 'ms': 'ms-MY', 'af': 'af-ZA', 'sw': 'sw-KE',
    'gu': 'gu-IN', 'kn': 'kn-IN', 'ml': 'ml-IN', 'sr': 'sr-RS',
    'et': 'et-EE', 'lv': 'lv-LV',
    
    // English regional variants (13 total)
    'en-US': 'en-US', 'en-GB': 'en-GB', 'en-AU': 'en-AU', 'en-CA': 'en-CA',
    'en-IN': 'en-IN', 'en-IE': 'en-IE', 'en-NZ': 'en-NZ', 'en-SG': 'en-SG',
    'en-HK': 'en-HK', 'en-PH': 'en-PH', 'en-NG': 'en-NG', 'en-ZA': 'en-ZA', 'en-GH': 'en-GH',
    
    // Spanish regional variants (20 total)
    'es-ES': 'es-ES', 'es-MX': 'es-MX', 'es-AR': 'es-AR', 'es-CO': 'es-CO',
    'es-CL': 'es-CL', 'es-PE': 'es-PE', 'es-VE': 'es-VE', 'es-CR': 'es-CR',
    'es-PA': 'es-PA', 'es-GT': 'es-GT', 'es-HN': 'es-HN', 'es-NI': 'es-NI',
    'es-SV': 'es-SV', 'es-BO': 'es-BO', 'es-PY': 'es-PY', 'es-UY': 'es-UY',
    'es-DO': 'es-DO', 'es-PR': 'es-PR', 'es-EC': 'es-EC', 'es-US': 'es-US',
    
    // Arabic regional variants (14 total)
    'ar-SA': 'ar-SA', 'ar-EG': 'ar-EG', 'ar-AE': 'ar-AE', 'ar-BH': 'ar-BH',
    'ar-IQ': 'ar-IQ', 'ar-JO': 'ar-JO', 'ar-KW': 'ar-KW', 'ar-LB': 'ar-LB',
    'ar-OM': 'ar-OM', 'ar-QA': 'ar-QA', 'ar-SY': 'ar-SY', 'ar-LY': 'ar-LY',
    'ar-MA': 'ar-MA', 'ar-DZ': 'ar-DZ',
    
    // Chinese variants (3 total)
    'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW', 'zh-HK': 'zh-HK',
    
    // French variants (2 total)
    'fr-FR': 'fr-FR', 'fr-CA': 'fr-CA',
    
    // German variants (3 total)
    'de-DE': 'de-DE', 'de-AT': 'de-AT', 'de-CH': 'de-CH',
    
    // Portuguese variants (2 total)
    'pt-PT': 'pt-PT', 'pt-BR': 'pt-BR', 'pt-br': 'pt-BR', // backward compat
  };

  // Azure TTS voice mapping - hybrid approach for best quality across 95 languages
  // Priority: Use region-specific voices for major variants, fall back to multilingual voices
  // NOTE: Regional voices provide authentic native accents (⭐⭐⭐⭐⭐ quality)
  // NOTE: Multilingual voices (Andrew/Ava) support 91 language variants (⭐⭐⭐⭐ quality, good but may lack accent nuance)
  const getAzureVoiceName = (languageCode: string, gender: "male" | "female"): string => {
    // Comprehensive voice mappings for all 95 supported languages
    const regionalVoices: Record<string, { male: string; female: string }> = {
      // English variants (13 total) - authentic US, British, Australian, Canadian, Indian accents
      "en": { male: "en-US-GuyNeural", female: "en-US-JennyNeural" },
      "en-US": { male: "en-US-GuyNeural", female: "en-US-JennyNeural" },
      "en-GB": { male: "en-GB-RyanNeural", female: "en-GB-SoniaNeural" },
      "en-AU": { male: "en-AU-WilliamNeural", female: "en-AU-NatashaNeural" },
      "en-CA": { male: "en-CA-LiamNeural", female: "en-CA-ClaraNeural" },
      "en-IN": { male: "en-IN-PrabhatNeural", female: "en-IN-NeerjaNeural" },
      "en-IE": { male: "en-IE-ConnorNeural", female: "en-IE-EmilyNeural" },
      "en-NZ": { male: "en-NZ-MitchellNeural", female: "en-NZ-MollyNeural" },
      "en-SG": { male: "en-SG-WayneNeural", female: "en-SG-LunaNeural" },
      "en-HK": { male: "en-HK-SamNeural", female: "en-HK-YanNeural" },
      "en-PH": { male: "en-PH-JamesNeural", female: "en-PH-RosaNeural" },
      "en-ZA": { male: "en-ZA-LukeNeural", female: "en-ZA-LeahNeural" },
      "en-NG": { male: "en-NG-AbeoNeural", female: "en-NG-EzinneNeural" },
      "en-GH": { male: "en-GH-KwameDrummerNeural", female: "en-GH-AkoaNeural" },
      
      // Spanish variants (20 total) - authentic Spain, Mexican, Argentine, Colombian accents
      "es": { male: "es-ES-AlvaroNeural", female: "es-ES-ElviraNeural" },
      "es-ES": { male: "es-ES-AlvaroNeural", female: "es-ES-ElviraNeural" },
      "es-MX": { male: "es-MX-JorgeNeural", female: "es-MX-DaliaNeural" },
      "es-AR": { male: "es-AR-TomasNeural", female: "es-AR-ElenaNeural" },
      "es-CO": { male: "es-CO-GonzaloNeural", female: "es-CO-SalomeNeural" },
      "es-CL": { male: "es-CL-LorenzoNeural", female: "es-CL-CatalinaNeural" },
      "es-PE": { male: "es-PE-AlexNeural", female: "es-PE-CamilaNeural" },
      "es-VE": { male: "es-VE-SebastianNeural", female: "es-VE-PaolaNeural" },
      "es-CR": { male: "es-CR-JuanNeural", female: "es-CR-MariaNeural" },
      "es-US": { male: "es-US-AlonsoNeural", female: "es-US-PalomaNeural" },
      "es-PA": { male: "es-PA-RobertoNeural", female: "es-PA-MargaritaNeural" },
      "es-GT": { male: "es-GT-AndresNeural", female: "es-GT-MartaNeural" },
      "es-HN": { male: "es-HN-CarlosNeural", female: "es-HN-KarlaNeural" },
      "es-NI": { male: "es-NI-FedericoNeural", female: "es-NI-YolandaNeural" },
      "es-SV": { male: "es-SV-RodrigoNeural", female: "es-SV-LorenaNeural" },
      "es-BO": { male: "es-BO-MarceloNeural", female: "es-BO-SofiaNeural" },
      "es-PY": { male: "es-PY-MarioNeural", female: "es-PY-TaniaNeural" },
      "es-UY": { male: "es-UY-MateoNeural", female: "es-UY-ValentinaNeural" },
      "es-DO": { male: "es-DO-EmilioNeural", female: "es-DO-RamonaNeural" },
      "es-PR": { male: "es-PR-VictorNeural", female: "es-PR-KarinaNeural" },
      "es-EC": { male: "es-EC-LuisNeural", female: "es-EC-AndreaNeural" },
      
      // Arabic variants (14 total) - authentic Saudi, Egyptian, UAE, Levantine accents
      "ar": { male: "ar-SA-HamedNeural", female: "ar-SA-ZariyahNeural" },
      "ar-SA": { male: "ar-SA-HamedNeural", female: "ar-SA-ZariyahNeural" },
      "ar-EG": { male: "ar-EG-ShakirNeural", female: "ar-EG-SalmaNeural" },
      "ar-AE": { male: "ar-AE-HamdanNeural", female: "ar-AE-FatimaNeural" },
      "ar-BH": { male: "ar-BH-AliNeural", female: "ar-BH-LailaNeural" },
      "ar-JO": { male: "ar-JO-TaimNeural", female: "ar-JO-SanaNeural" },
      "ar-KW": { male: "ar-KW-FahedNeural", female: "ar-KW-NouraNeural" },
      "ar-LB": { male: "ar-LB-RamiNeural", female: "ar-LB-LaylaNeural" },
      "ar-OM": { male: "ar-OM-AbdullahNeural", female: "ar-OM-AyshaNeural" },
      "ar-QA": { male: "ar-QA-MoazNeural", female: "ar-QA-AmalNeural" },
      "ar-SY": { male: "ar-SY-LaithNeural", female: "ar-SY-AmanyNeural" },
      "ar-MA": { male: "ar-MA-JamalNeural", female: "ar-MA-MounaNeural" },
      "ar-DZ": { male: "ar-DZ-IsmaelNeural", female: "ar-DZ-AminaNeural" },
      "ar-IQ": { male: "ar-IQ-BasselNeural", female: "ar-IQ-RanaNeural" },
      "ar-LY": { male: "ar-LY-OmarNeural", female: "ar-LY-ImanNeural" },
      
      // Chinese variants (3 total) - Simplified, Traditional, Hong Kong Cantonese
      "zh": { male: "zh-CN-YunxiNeural", female: "zh-CN-XiaoxiaoNeural" },
      "zh-CN": { male: "zh-CN-YunxiNeural", female: "zh-CN-XiaoxiaoNeural" },
      "zh-TW": { male: "zh-TW-YunJheNeural", female: "zh-TW-HsiaoChenNeural" },
      "zh-HK": { male: "zh-HK-WanLungNeural", female: "zh-HK-HiuGaaiNeural" },
      
      // French variants (2 total) - France and Canadian accents
      "fr": { male: "fr-FR-HenriNeural", female: "fr-FR-DeniseNeural" },
      "fr-FR": { male: "fr-FR-HenriNeural", female: "fr-FR-DeniseNeural" },
      "fr-CA": { male: "fr-CA-AntoineNeural", female: "fr-CA-SylvieNeural" },
      
      // German variants (3 total) - Germany, Austrian, Swiss accents
      "de": { male: "de-DE-ConradNeural", female: "de-DE-KatjaNeural" },
      "de-DE": { male: "de-DE-ConradNeural", female: "de-DE-KatjaNeural" },
      "de-AT": { male: "de-AT-JonasNeural", female: "de-AT-IngridNeural" },
      "de-CH": { male: "de-CH-JanNeural", female: "de-CH-LeniNeural" },
      
      // Portuguese variants (2 total) - Portugal and Brazilian accents
      "pt": { male: "pt-PT-DuarteNeural", female: "pt-PT-RaquelNeural" },
      "pt-PT": { male: "pt-PT-DuarteNeural", female: "pt-PT-RaquelNeural" },
      "pt-BR": { male: "pt-BR-AntonioNeural", female: "pt-BR-FranciscaNeural" },
      
      // Single-variant languages (38 total) - major global languages
      "it": { male: "it-IT-DiegoNeural", female: "it-IT-ElsaNeural" },
      "it-IT": { male: "it-IT-DiegoNeural", female: "it-IT-ElsaNeural" },
      "ru": { male: "ru-RU-DmitryNeural", female: "ru-RU-SvetlanaNeural" },
      "ru-RU": { male: "ru-RU-DmitryNeural", female: "ru-RU-SvetlanaNeural" },
      "ja": { male: "ja-JP-KeitaNeural", female: "ja-JP-NanamiNeural" },
      "ja-JP": { male: "ja-JP-KeitaNeural", female: "ja-JP-NanamiNeural" },
      "ko": { male: "ko-KR-InJoonNeural", female: "ko-KR-SunHiNeural" },
      "ko-KR": { male: "ko-KR-InJoonNeural", female: "ko-KR-SunHiNeural" },
      "hi": { male: "hi-IN-MadhurNeural", female: "hi-IN-SwaraNeural" },
      "hi-IN": { male: "hi-IN-MadhurNeural", female: "hi-IN-SwaraNeural" },
      "nl": { male: "nl-NL-MaartenNeural", female: "nl-NL-ColetteNeural" },
      "nl-NL": { male: "nl-NL-MaartenNeural", female: "nl-NL-ColetteNeural" },
      "pl": { male: "pl-PL-MarekNeural", female: "pl-PL-ZofiaNeural" },
      "pl-PL": { male: "pl-PL-MarekNeural", female: "pl-PL-ZofiaNeural" },
      "tr": { male: "tr-TR-AhmetNeural", female: "tr-TR-EmelNeural" },
      "tr-TR": { male: "tr-TR-AhmetNeural", female: "tr-TR-EmelNeural" },
      "sv": { male: "sv-SE-MattiasNeural", female: "sv-SE-SofieNeural" },
      "sv-SE": { male: "sv-SE-MattiasNeural", female: "sv-SE-SofieNeural" },
      "nb": { male: "nb-NO-FinnNeural", female: "nb-NO-PernilleNeural" },
      "nb-NO": { male: "nb-NO-FinnNeural", female: "nb-NO-PernilleNeural" },
      "da": { male: "da-DK-JeppeNeural", female: "da-DK-ChristelNeural" },
      "da-DK": { male: "da-DK-JeppeNeural", female: "da-DK-ChristelNeural" },
      "fi": { male: "fi-FI-HarriNeural", female: "fi-FI-NooraNeural" },
      "fi-FI": { male: "fi-FI-HarriNeural", female: "fi-FI-NooraNeural" },
      "el": { male: "el-GR-NestorasNeural", female: "el-GR-AthinaNeural" },
      "el-GR": { male: "el-GR-NestorasNeural", female: "el-GR-AthinaNeural" },
      "cs": { male: "cs-CZ-AntoninNeural", female: "cs-CZ-VlastaNeural" },
      "cs-CZ": { male: "cs-CZ-AntoninNeural", female: "cs-CZ-VlastaNeural" },
      "ro": { male: "ro-RO-EmilNeural", female: "ro-RO-AlinaNeural" },
      "ro-RO": { male: "ro-RO-EmilNeural", female: "ro-RO-AlinaNeural" },
      "uk": { male: "uk-UA-OstapNeural", female: "uk-UA-PolinaNeural" },
      "uk-UA": { male: "uk-UA-OstapNeural", female: "uk-UA-PolinaNeural" },
      "hu": { male: "hu-HU-TamasNeural", female: "hu-HU-NoemiNeural" },
      "hu-HU": { male: "hu-HU-TamasNeural", female: "hu-HU-NoemiNeural" },
      "vi": { male: "vi-VN-NamMinhNeural", female: "vi-VN-HoaiMyNeural" },
      "vi-VN": { male: "vi-VN-NamMinhNeural", female: "vi-VN-HoaiMyNeural" },
      "th": { male: "th-TH-NiwatNeural", female: "th-TH-PremwadeeNeural" },
      "th-TH": { male: "th-TH-NiwatNeural", female: "th-TH-PremwadeeNeural" },
      "id": { male: "id-ID-ArdiNeural", female: "id-ID-GadisNeural" },
      "id-ID": { male: "id-ID-ArdiNeural", female: "id-ID-GadisNeural" },
      "he": { male: "he-IL-AvriNeural", female: "he-IL-HilaNeural" },
      "he-IL": { male: "he-IL-AvriNeural", female: "he-IL-HilaNeural" },
      "bn": { male: "bn-IN-BashkarNeural", female: "bn-IN-TanishaaNeural" },
      "bn-IN": { male: "bn-IN-BashkarNeural", female: "bn-IN-TanishaaNeural" },
      "ta": { male: "ta-IN-ValluvarNeural", female: "ta-IN-PallaviNeural" },
      "ta-IN": { male: "ta-IN-ValluvarNeural", female: "ta-IN-PallaviNeural" },
      "te": { male: "te-IN-MohanNeural", female: "te-IN-ShrutiNeural" },
      "te-IN": { male: "te-IN-MohanNeural", female: "te-IN-ShrutiNeural" },
      "mr": { male: "mr-IN-ManoharNeural", female: "mr-IN-AarohiNeural" },
      "mr-IN": { male: "mr-IN-ManoharNeural", female: "mr-IN-AarohiNeural" },
      "gu": { male: "gu-IN-NiranjanNeural", female: "gu-IN-DhwaniNeural" },
      "gu-IN": { male: "gu-IN-NiranjanNeural", female: "gu-IN-DhwaniNeural" },
      "kn": { male: "kn-IN-GaganNeural", female: "kn-IN-SapnaNeural" },
      "kn-IN": { male: "kn-IN-GaganNeural", female: "kn-IN-SapnaNeural" },
      "ml": { male: "ml-IN-MidhunNeural", female: "ml-IN-SobhanaNeural" },
      "ml-IN": { male: "ml-IN-MidhunNeural", female: "ml-IN-SobhanaNeural" },
      "bg": { male: "bg-BG-BorislavNeural", female: "bg-BG-KalinaNeural" },
      "bg-BG": { male: "bg-BG-BorislavNeural", female: "bg-BG-KalinaNeural" },
      "hr": { male: "hr-HR-SreckoNeural", female: "hr-HR-GabrijelaNeural" },
      "hr-HR": { male: "hr-HR-SreckoNeural", female: "hr-HR-GabrijelaNeural" },
      "sk": { male: "sk-SK-LukasNeural", female: "sk-SK-ViktoriaNeural" },
      "sk-SK": { male: "sk-SK-LukasNeural", female: "sk-SK-ViktoriaNeural" },
      "sl": { male: "sl-SI-RokNeural", female: "sl-SI-PetraNeural" },
      "sl-SI": { male: "sl-SI-RokNeural", female: "sl-SI-PetraNeural" },
      "ca": { male: "ca-ES-EnricNeural", female: "ca-ES-JoanaNeural" },
      "ca-ES": { male: "ca-ES-EnricNeural", female: "ca-ES-JoanaNeural" },
      "ms": { male: "ms-MY-OsmanNeural", female: "ms-MY-YasminNeural" },
      "ms-MY": { male: "ms-MY-OsmanNeural", female: "ms-MY-YasminNeural" },
      "af": { male: "af-ZA-WillemNeural", female: "af-ZA-AdriNeural" },
      "af-ZA": { male: "af-ZA-WillemNeural", female: "af-ZA-AdriNeural" },
      "sw": { male: "sw-KE-RafikiNeural", female: "sw-KE-ZuriNeural" },
      "sw-KE": { male: "sw-KE-RafikiNeural", female: "sw-KE-ZuriNeural" },
      "sr": { male: "sr-RS-NicholasNeural", female: "sr-RS-SophieNeural" },
      "sr-RS": { male: "sr-RS-NicholasNeural", female: "sr-RS-SophieNeural" },
      "et": { male: "et-EE-KertNeural", female: "et-EE-AnuNeural" },
      "et-EE": { male: "et-EE-KertNeural", female: "et-EE-AnuNeural" },
      "lv": { male: "lv-LV-NilsNeural", female: "lv-LV-EveritaNeural" },
      "lv-LV": { male: "lv-LV-NilsNeural", female: "lv-LV-EveritaNeural" },
    };
    
    // Check if regional voice exists for this language
    const regionalVoice = regionalVoices[languageCode];
    if (regionalVoice) {
      return gender === "male" ? regionalVoice.male : regionalVoice.female;
    }
    
    // Fall back to premium multilingual voices (Andrew/Ava) for all other languages
    // These support 91 language/accent variants with auto language detection and neutral accent
    return gender === "male" ? "en-US-AndrewMultilingualNeural" : "en-US-AvaMultilingualNeural";
  };

  const getAzureToken = async () => {
    // Return cached token if available
    if (azureTokenRef.current) {
      console.log('[Azure Token] Using cached token');
      return azureTokenRef.current;
    }
    
    // THROTTLING: Wait for any in-flight token request to complete with safety timeout
    let waitTime = 0;
    const MAX_WAIT_TIME = 30000; // 30 seconds max wait
    
    while (tokenRequestInFlightRef.current) {
      if (waitTime >= MAX_WAIT_TIME) {
        console.error('[Token] DEADLOCK PREVENTION: Max wait time exceeded, forcing request');
        tokenRequestInFlightRef.current = false; // Force reset to break potential deadlock
        break;
      }
      console.log('[Azure Token] Waiting for in-flight token request...');
      await new Promise(resolve => setTimeout(resolve, 100));
      waitTime += 100;
    }
    
    // Double-check cache after wait (another request may have completed)
    if (azureTokenRef.current) {
      console.log('[Azure Token] Using token cached by concurrent request');
      return azureTokenRef.current;
    }
    
    const requestStartTime = Date.now();
    // Mark request as in-flight BEFORE any async operations
    tokenRequestInFlightRef.current = true;
    
    // INCREMENT TOKEN REQUEST COUNTER
    tokenRequestCounterRef.current += 1;
    const requestNumber = tokenRequestCounterRef.current;
    
    try {
      console.log(`[Azure Token API] 🔑 REQUEST #${requestNumber} START - Fetching new auth token`);
      
      const tokenResponse = await fetch('/api/speech/token');
      
      if (!tokenResponse.ok) {
        const requestDuration = Date.now() - requestStartTime;
        console.error(`[Azure Token API] ❌ FAILED - Status: ${tokenResponse.status}, Duration: ${requestDuration}ms`);
        throw new Error(`Token request failed: ${tokenResponse.status}`);
      }
      
      const tokenData = await tokenResponse.json();
      const requestDuration = Date.now() - requestStartTime;
      console.log(`[Azure Token API] ✅ REQUEST #${requestNumber} SUCCESS - Duration: ${requestDuration}ms, Region: ${tokenData.region}`);
      
      azureTokenRef.current = tokenData;
      
      // Token expires after 10 minutes, clear cache after 9 minutes
      setTimeout(() => {
        console.log('[Azure Token] Cache expired, will fetch new token on next request');
        azureTokenRef.current = null;
      }, 540000);
      
      return tokenData;
    } finally {
      tokenRequestInFlightRef.current = false;
    }
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
    const requestStartTime = Date.now();
    
    // INCREMENT REQUEST COUNTER (outside try-catch so it's accessible in catch block)
    ttsRequestCounterRef.current += 1;
    const requestNumber = ttsRequestCounterRef.current;
    
    try {
      // THROTTLING: Wait for any in-flight TTS request to complete with safety timeout
      let waitTime = 0;
      const MAX_WAIT_TIME = 30000; // 30 seconds max wait
      
      while (ttsRequestInFlightRef.current) {
        if (waitTime >= MAX_WAIT_TIME) {
          console.error('[TTS] DEADLOCK PREVENTION: Max wait time exceeded, forcing request');
          ttsRequestInFlightRef.current = false; // Force reset to break potential deadlock
          break;
        }
        console.log('[TTS] Waiting for in-flight request to complete...');
        await new Promise(resolve => setTimeout(resolve, 100));
        waitTime += 100;
      }
      
      // Mark request as in-flight BEFORE any async operations
      ttsRequestInFlightRef.current = true;
      
      const { token, region } = await getAzureToken();
      
      const azureLang = azureLanguageMap[languageCode] || 'en-US';
      const voiceName = getAzureVoiceName(languageCode, gender);
      
      console.log(`[Azure TTS API] 🎤 REQUEST #${requestNumber} START - Voice: ${voiceName}, Language: ${languageCode}, Region: ${region}, Text: "${text.substring(0, 50)}..."`);
      
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
      
      const requestDuration = Date.now() - requestStartTime;
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`[Azure TTS API] ❌ REQUEST #${requestNumber} FAILED - Status: ${response.status}, Duration: ${requestDuration}ms, Error: ${errorText.substring(0, 200)}`);
        
        // CRITICAL FIX: Only trigger quota detection on STRICT HTTP 429 status code
        // Do NOT use string matching on error text (prevents false positives from HTML error pages)
        if (response.status === 429) {
          console.error('[Azure TTS API] 🚫 QUOTA EXCEEDED (HTTP 429) - Stopping all TTS processing');
          quotaExceededRef.current = true;
          setQuotaExceeded(true);
          setQuotaError('Service quota exceeded. Your account has hit its usage limit.');
          
          toast({
            title: "Service Quota Limit Reached",
            description: "Speech service quota exceeded. You can still receive translations as text.",
            variant: "destructive",
            duration: 10000,
          });
        }
        
        throw new Error(`Azure TTS failed: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log(`[Azure TTS API] ✅ REQUEST #${requestNumber} SUCCESS - Voice: ${voiceName}, Duration: ${requestDuration}ms, Audio size: ${blob.size} bytes`);
      
      if (blob.size === 0) {
        throw new Error('Azure TTS returned empty audio blob');
      }
      
      return blob;
    } catch (error) {
      const requestDuration = Date.now() - requestStartTime;
      console.error(`[Azure TTS API] ❌ REQUEST #${requestNumber} ERROR - Duration: ${requestDuration}ms, Error:`, error);
      throw error; // Re-throw to trigger retry logic in queue processor
    } finally {
      // ALWAYS clear the in-flight flag
      ttsRequestInFlightRef.current = false;
      console.log(`[Azure TTS API] 📊 Session Total: ${ttsRequestCounterRef.current} TTS requests made`);
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

  // Create fresh message handler (no WebSocket closure)
  const createMessageHandler = (wsInstance: WebSocket) => (event: MessageEvent) => {
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
      
      // CRITICAL FIX: Flush pending messages queue AFTER server confirms join
      // This guarantees server has registered the connection before replaying transcriptions
      if (pendingMessagesRef.current.length > 0) {
        console.log(`[Message Queue] 📤 Server join confirmed - flushing ${pendingMessagesRef.current.length} pending messages...`);
        const messages = [...pendingMessagesRef.current];
        pendingMessagesRef.current = []; // Clear queue
        
        messages.forEach((msg, index) => {
          const age = Date.now() - msg.timestamp;
          console.log(`[Message Queue] Sending queued message ${index + 1}/${messages.length}: "${msg.text.substring(0, 30)}..." (age: ${age}ms)`);
          if (wsInstance.readyState === WebSocket.OPEN) {
            wsInstance.send(JSON.stringify(msg));
          } else {
            console.warn(`[Message Queue] ⚠️ WebSocket closed before sending queued message ${index + 1}`);
          }
        });
        
        toast({
          title: "Messages Sent",
          description: `${messages.length} queued message(s) delivered successfully`,
          variant: "default",
          duration: 3000,
        });
      }
      
      // Delay notification slightly to avoid overlap with connection toast and queue flush
      // Show different message based on role
      setTimeout(() => {
        toast({
          title: role === "owner" ? "Partner Joined" : "Connected to Room",
          description: role === "owner" 
            ? "Your conversation partner has joined. Click 'Start Conversation' to begin."
            : "You're now connected. Waiting for host to start the conversation...",
        });
      }, 600);
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
      
      // Show upgrade modal when credits are exhausted
      if (exhausted || creditsRemaining <= 0) {
        console.log('[Credits] Credits exhausted, showing upgrade modal');
        setShowUpgradeModal(true);
        return;
      }
      
      // LOW-CREDIT WARNINGS: Only show to HOST (creator/owner), not to partner
      if (role === "creator" || role === "owner") {
        // Warn at 10 minutes (600 seconds)
        if (creditsRemaining <= 600 && creditsRemaining > 580 && !exhausted) {
          toast({
            title: "10 Minutes Remaining",
            description: "You have 10 minutes of translation time left. Consider upgrading to continue uninterrupted.",
            variant: "warning",
          });
        }
        
        // Warn when less than 2 minutes (120 seconds) remaining  
        if (creditsRemaining <= 120 && creditsRemaining > 100 && !exhausted) {
          const minutesText = creditsRemaining < 60 && creditsRemaining > 0 
            ? "less than 1 minute" 
            : `${Math.floor(creditsRemaining / 60)} minutes`;
          toast({
            title: "Low Credits Warning",
            description: `You have ${minutesText} remaining. Consider upgrading your plan.`,
            variant: "warning",
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
    }

    if (message.type === "transcription") {
      const isOwn = message.speaker === role;
      
      // Handle interim transcriptions (partial results)
      if (message.interim === true) {
        if (isOwn) {
          setMyInterimText(message.text);
          
          // AUTO-CLEAR FIX: Clear any existing timeout and set new one
          // If no final transcription arrives within 3 seconds, auto-clear the interim text
          // This prevents UI from freezing on "Transcribing..." when Azure doesn't send final result
          if (myInterimTimeoutRef.current) {
            clearTimeout(myInterimTimeoutRef.current);
          }
          myInterimTimeoutRef.current = setTimeout(() => {
            console.log('[Interim Timeout] ⏰ Auto-clearing myInterimText after 3s (no final transcription received)');
            myInterimTimeoutRef.current = null; // Clear ref before mutating state
            setMyInterimText("");
          }, 3000);
        } else {
          setPartnerInterimText(message.text);
          setPartnerSpeaking(true);
          
          // AUTO-CLEAR FIX: Same for partner
          if (partnerInterimTimeoutRef.current) {
            clearTimeout(partnerInterimTimeoutRef.current);
          }
          partnerInterimTimeoutRef.current = setTimeout(() => {
            console.log('[Interim Timeout] ⏰ Auto-clearing partnerInterimText after 3s (no final transcription received)');
            partnerInterimTimeoutRef.current = null; // Clear ref before mutating state
            setPartnerInterimText("");
          }, 3000);
        }
        return;
      }
      
      // Handle final transcriptions
      if (isOwn) {
        setIsSpeaking(false);
        
        // Clear the auto-clear timeout BEFORE clearing interim text (prevents race conditions)
        if (myInterimTimeoutRef.current) {
          clearTimeout(myInterimTimeoutRef.current);
          myInterimTimeoutRef.current = null;
        }
        
        setMyInterimText(""); // Clear interim text
      } else {
        setPartnerSpeaking(false);
        
        // Clear the auto-clear timeout BEFORE clearing interim text (prevents race conditions)
        if (partnerInterimTimeoutRef.current) {
          clearTimeout(partnerInterimTimeoutRef.current);
          partnerInterimTimeoutRef.current = null;
        }
        
        setPartnerInterimText(""); // Clear interim text
      }
    }

    if (message.type === "translation") {
      const receiveTimestamp = Date.now();
      const isOwn = message.speaker === role;
      const seq = message.seq; // Server-provided sequence number
      
      // DIAGNOSTIC: Log message arrival with precise timestamp
      console.log(`[Translation Received] ⏱️ Timestamp: ${receiveTimestamp}, Seq: ${seq}, MessageId: ${message.messageId}, Speaker: ${message.speaker}, IsOwn: ${isOwn}`);
      console.log(`[Translation Received] 📊 DeduplicationSet size BEFORE: ${processedMessagesRef.current.size}`);
      
      // SEQUENCE-BASED DEDUPLICATION: Save sequence number for partner's messages
      // This prevents duplicate audio on reconnection
      if (!isOwn && seq && roomIdRef.current) {
        saveLastReceivedSeq(roomIdRef.current, seq);
      }
      
      // CRITICAL: Deduplicate based on server-provided messageId
      // This prevents duplicate WebSocket deliveries while allowing legitimate repeated phrases
      const serverMessageId = message.messageId;
      
      if (!serverMessageId) {
        console.error('[Deduplication] ❌ Missing messageId from server - this message may duplicate');
      } else {
        // ATOMIC DEDUPLICATION FIX: Use Set.add() return value to check if already exists
        // This prevents race condition where two messages arrive simultaneously
        const sizeBefore = processedMessagesRef.current.size;
        processedMessagesRef.current.add(serverMessageId);
        const sizeAfter = processedMessagesRef.current.size;
        
        console.log(`[Deduplication] 🔍 Check: sizeBefore=${sizeBefore}, sizeAfter=${sizeAfter}, messageId=${serverMessageId}`);
        
        if (sizeBefore === sizeAfter) {
          // Set size didn't change = item was already in the set = DUPLICATE
          const timeSinceReceive = Date.now() - receiveTimestamp;
          console.warn(`[Deduplication] ⛔ DUPLICATE DETECTED! Skipping already-processed messageId: ${serverMessageId}`);
          console.warn(`[Deduplication] 📊 Detection took: ${timeSinceReceive}ms, DeduplicationSet size: ${processedMessagesRef.current.size}`);
          console.warn(`[Deduplication] 📝 Message text: "${message.originalText.substring(0, 50)}..." → "${message.translatedText.substring(0, 50)}..."`);
          return; // Already processed this exact message
        }
        
        // Successfully added - this is a new message
        console.log(`[Deduplication] ✅ NEW message added to deduplication set. Set size now: ${sizeAfter}`);
        
        // Clean up old entries to prevent memory leak (keep last 200)
        if (processedMessagesRef.current.size > 200) {
          const entries = Array.from(processedMessagesRef.current);
          processedMessagesRef.current = new Set(entries.slice(-200));
          console.log(`[Deduplication] 🧹 Cleaned up old entries. Set size after cleanup: ${processedMessagesRef.current.size}`);
        }
      }
      
      // Use server messageId if available, otherwise fall back to client-generated
      const messageId = serverMessageId || `${message.speaker}-${Date.now()}-${message.originalText.substring(0, 20)}`;
      
      // INCREMENT TRANSLATION COUNTER for monitoring
      translationRequestCounterRef.current += 1;
      console.log(`[Translation] 📝 Translation #${translationRequestCounterRef.current} received - Original: "${message.originalText.substring(0, 30)}...", Translated: "${message.translatedText.substring(0, 30)}..."`);
      
      const newMessage: TranscriptionMessage = {
        id: messageId,
        originalText: message.originalText,
        translatedText: message.translatedText,
        isOwn,
      };

      if (isOwn) {
        setMyMessages(prev => [...prev, newMessage]);
        
        // Clear the auto-clear timeout BEFORE clearing interim text (prevents race conditions)
        if (myInterimTimeoutRef.current) {
          clearTimeout(myInterimTimeoutRef.current);
          myInterimTimeoutRef.current = null;
        }
        
        setMyInterimText(""); // Clear interim when final arrives
        
        console.log(`[Translation] 📤 Added to MY messages (total: ${myMessages.length + 1})`);
      } else {
        setPartnerMessages(prev => [...prev, newMessage]);
        
        // Clear the auto-clear timeout BEFORE clearing interim text (prevents race conditions)
        if (partnerInterimTimeoutRef.current) {
          clearTimeout(partnerInterimTimeoutRef.current);
          partnerInterimTimeoutRef.current = null;
        }
        
        setPartnerInterimText(""); // Clear interim when final arrives
        
        console.log(`[Translation] 📥 Added to PARTNER messages (total: ${partnerMessages.length + 1})`);
        
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
      
      const totalProcessingTime = Date.now() - receiveTimestamp;
      console.log(`[Translation] ⏱️ Total processing time: ${totalProcessingTime}ms`);
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
      // Handle room-not-found errors specially
      if (message.message && message.message.toLowerCase().includes("room not found")) {
        console.error("[Room] Room not found error received");
        
        // OPTION 4: Auto-recreate room for creators only
        if (role === "creator" && !autoRecreateInProgressRef.current && !isReconnectingRef.current) {
          console.log('[Auto-Recreate] Room expired - attempting to recreate for creator');
          autoRecreateInProgressRef.current = true;
          
          // Show toast: recreating
          toast({
            title: "Room Expired",
            description: "Creating a new room with the same settings...",
          });
          
          // Try to load saved settings or use current settings
          const savedSettings = loadRoomFromStorage();
          const recreateSettings = savedSettings || { language, voiceGender, role };
          
          console.log('[Auto-Recreate] Using settings:', recreateSettings);
          
          // Call API to create new room
          fetch('/api/rooms/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              language: recreateSettings.language,
              voiceGender: recreateSettings.voiceGender
            })
          })
          .then(res => {
            if (!res.ok) throw new Error('Failed to create room');
            return res.json();
          })
          .then(data => {
            console.log('[Auto-Recreate] ✅ New room created:', data.roomId);
            
            // Save new room to storage
            saveRoomToStorage({
              roomId: data.roomId,
              language: recreateSettings.language,
              voiceGender: recreateSettings.voiceGender,
              role: 'creator'
            });
            
            // Update URL to new room
            const newUrl = `/room/${data.roomId}?role=creator&language=${recreateSettings.language}&voiceGender=${recreateSettings.voiceGender}`;
            console.log('[Auto-Recreate] Navigating to new room:', newUrl);
            
            // Close old WebSocket
            if (wsInstance.readyState === WebSocket.OPEN || wsInstance.readyState === WebSocket.CONNECTING) {
              wsInstance.close(1000, "Recreating room");
            }
            
            // Navigate to new room - this will trigger a full page reload with new roomId
            window.location.href = newUrl;
            
            // Show success toast (will display after navigation)
            toast({
              title: "New Room Created",
              description: "Share the new link with your partner",
            });
          })
          .catch(error => {
            console.error('[Auto-Recreate] ❌ Failed to recreate room:', error);
            autoRecreateInProgressRef.current = false;
            
            toast({
              title: "Recreation Failed",
              description: "Could not create a new room. Redirecting home...",
              variant: "destructive",
            });
            
            // Close WebSocket
            if (wsInstance.readyState === WebSocket.OPEN || wsInstance.readyState === WebSocket.CONNECTING) {
              wsInstance.close(1000, "Recreation failed");
            }
            
            setTimeout(() => setLocation("/"), 2000);
          });
          
          return; // Don't show generic error toast
        }
        
        // Participants can't recreate - show guidance
        if (role !== "creator") {
          toast({
            title: "Room Expired",
            description: "Please ask the room creator for a new link",
            variant: "destructive",
          });
          
          // Close WebSocket
          if (wsInstance.readyState === WebSocket.OPEN || wsInstance.readyState === WebSocket.CONNECTING) {
            wsInstance.close(1000, "Room not found");
          }
          
          setTimeout(() => setLocation("/"), 2000);
          return;
        }
        
        // Fallback: already recreating or is reconnecting
        console.log('[Auto-Recreate] Skipping - already in progress or reconnecting');
        return;
      }
      
      // Generic error - show toast
      toast({
        title: "Error",
        description: message.message,
        variant: "destructive",
      });
    }
  };

  // Create fresh close handler (no WebSocket closure)
  const createCloseHandler = (wsInstance: WebSocket, connectionStartTime: number) => (event: CloseEvent) => {
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
      readyState: wsInstance.readyState,
      url: wsInstance.url,
      protocol: wsInstance.protocol,
      bufferedAmount: wsInstance.bufferedAmount
    };
    
    console.log('[WebSocket] 🔌 DISCONNECTED (FULL DETAILS):', disconnectLog);
    
    // Check shouldReconnect FIRST before any logic
    if (!shouldReconnectRef.current) {
      console.log('[Auto-Reconnect] Reconnect disabled - not reconnecting');
      setConnectionStatus("disconnected");
      setDisconnectReason(closeReason);
      setDisconnectDetails(`Duration: ${durationStr}. ${customReason || 'No additional details.'}`);
      return;
    }
    
    // Check if this is an intentional disconnect (user clicked End Call)
    const isIntentionalDisconnect = event.code === 1000 || event.code === 1001;
    
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
    
    // Increment counter AFTER determining we need to reconnect
    reconnectAttemptRef.current += 1;
    setReconnectAttempt(reconnectAttemptRef.current); // Update state for UI
    
    // Check BEFORE scheduling (now allows 8 attempts)
    if (reconnectAttemptRef.current > 8) {
      console.error(`[Auto-Reconnect] Max attempts (8) reached - giving up`);
      setConnectionStatus("disconnected");
      setDisconnectReason("Connection Failed");
      setDisconnectDetails(`Failed after ${reconnectAttemptRef.current - 1} attempts. Close code: ${event.code}. ${event.reason || 'No reason provided.'}`);
      isReconnectingRef.current = false;
      
      toast({
        title: "Connection Failed",
        description: `Could not reconnect after ${reconnectAttemptRef.current - 1} tries (Close code: ${event.code}). Please refresh.`,
        variant: "destructive",
        duration: 15000,
      });
      return;
    }
    
    // MOBILE FIX: Aggressive backoff for faster mobile reconnection: 100ms, 200ms, 400ms, 800ms, 1s (max 1s)
    // Faster delays ensure users don't wait long after returning from background
    const delay = Math.min(100 * Math.pow(2, reconnectAttemptRef.current - 1), 1000);
    
    console.log(`[Auto-Reconnect] Attempt ${reconnectAttemptRef.current}/8, delay: ${delay}ms, close code: ${event.code}`);
    
    // Clear reconnecting state so coordinator can proceed
    isReconnectingRef.current = false;
    
    // Use coordinator for serialized reconnection with exponential backoff delay
    reconnectTimeoutRef.current = setTimeout(() => {
      coordinateReconnect(0, 'auto-reconnect')
        .then(() => {
          console.log('[Auto-Reconnect] ✅ Reconnection successful');
        })
        .catch((error) => {
          console.error('[Auto-Reconnect] ❌ Reconnection failed:', error);
          // Will retry via onclose
        });
    }, delay);
  };

  // Create fresh error handler
  const createErrorHandler = (wsInstance: WebSocket, connectionStartTime: number) => (error: Event) => {
    const duration = Math.floor((Date.now() - connectionStartTime) / 1000);
    const errorDetails = {
      type: 'WebSocket Error',
      duration: `${duration}s`,
      readyState: wsInstance.readyState,
      readyStateText: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][wsInstance.readyState],
      url: wsInstance.url,
      timestamp: new Date().toISOString(),
      error: error
    };
    
    console.error('[WebSocket] ❌ ERROR EVENT FIRED:', errorDetails);
    
    // Don't show error UI immediately - let auto-reconnect handle it
    // The onclose handler will trigger reconnection and only show error if all retries fail
    console.log('[WebSocket] Error occurred, auto-reconnect will handle this if needed');
  };

  // Create fresh open handler
  const createOpenHandler = (wsInstance: WebSocket) => () => {
    // DIAGNOSTICS: Log comprehensive connection information
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    const diagnostics = {
      timestamp: new Date().toISOString(),
      url: wsInstance.url,
      protocol: wsInstance.protocol,
      readyState: wsInstance.readyState,
      networkType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink ? `${connection.downlink} Mbps` : 'unknown',
      rtt: connection?.rtt ? `${connection.rtt}ms` : 'unknown',
      saveData: connection?.saveData || false,
      userAgent: navigator.userAgent
    };
    
    console.log('[WebSocket] ✅ Connected successfully:', diagnostics);
    wsRef.current = wsInstance;
    setConnectionStatus("connected");
    reconnectAttemptRef.current = 0; // Reset counter on success
    setReconnectAttempt(0); // Update state for UI
    isReconnectingRef.current = false;
    
    const stableRoomId = roomIdRef.current;
    if (!stableRoomId) {
      console.error('[WebSocket] Cannot join - roomId undefined');
      wsInstance.close(1008, "Missing roomId");
      setLocation("/");
      return;
    }
    
    // Get last received sequence number for catch-up on reconnect
    const lastReceivedSeq = getLastReceivedSeq(stableRoomId);
    
    // CRITICAL: Send join message FIRST to register connection on server
    // Server will respond with participant-joined which triggers queue flush
    wsInstance.send(JSON.stringify({
      type: "join",
      roomId: stableRoomId,
      language,
      voiceGender,
      role,
      lastReceivedSeq, // Server will send missed messages where seq > this value
    }));
    
    console.log(`[Sequence] 📤 Sent join message with lastReceivedSeq=${lastReceivedSeq}`);
    console.log(`[Message Queue] 📝 Waiting for server join acknowledgment before flushing ${pendingMessagesRef.current.length} pending messages...`);
    
    // Save to localStorage for creators
    if (role === "creator") {
      saveRoomToStorage({ roomId: stableRoomId, language, voiceGender, role });
    }

    // Only show "Connected" toast for hosts to avoid overlap with "Partner Joined"
    // Participants will see "Partner Joined" immediately after connecting
    if (role === "owner") {
      toast({
        title: "Connected",
        description: "Waiting for your partner to join...",
      });
    }
    
    // Restart Azure Speech if was running
    if (!isMutedRef.current && azureTokenRef.current) {
      console.log('[Auto-Reconnect] Restarting Azure Speech');
      startConversation();
    }
  };

  // Create WebSocket connection with fresh handlers
  // RACE CONDITION FIX: Wait for wsUrlRef using promise (non-blocking)
  const connectWebSocket = async (): Promise<WebSocket> => {
    // If URL not ready, await the promise (resolved by fetchWsToken)
    if (!wsUrlRef.current) {
      console.log('[WebSocket] ⏳ Waiting for URL to be ready (non-blocking)...');
      
      // Wait for promise with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout waiting for WebSocket URL')), 15000);
      });
      
      try {
        await Promise.race([wsUrlReadyPromise.current, timeoutPromise]);
        console.log('[WebSocket] ✅ URL ready');
      } catch (error) {
        console.error('[WebSocket] ❌ Timeout waiting for WebSocket URL');
        throw error;
      }
    }
    
    if (!wsUrlRef.current) {
      console.error('[WebSocket] ❌ URL still not ready after promise resolved');
      throw new Error('WebSocket URL not ready');
    }
    
    const wsUrl = wsUrlRef.current;
    console.log('[WebSocket] Creating connection to:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    const connectionStartTime = Date.now();
    
    // Attach FRESH handlers (no closures from old WebSocket)
    ws.onopen = createOpenHandler(ws);
    ws.onerror = createErrorHandler(ws, connectionStartTime);
    ws.onmessage = createMessageHandler(ws);
    ws.onclose = createCloseHandler(ws, connectionStartTime);
    
    return ws;
  };

  // MOBILE FIX: Promise-based reconnection coordinator
  // Serializes all reconnect triggers to prevent overlapping WebSocket connections
  // Returns existing promise if reconnection already in progress (queues the request)
  const coordinateReconnect = async (delayMs: number = 0, source: string = "unknown"): Promise<WebSocket> => {
    console.log(`[Reconnect Coordinator] Request from: ${source}, delay: ${delayMs}ms`);
    
    // If reconnection already in progress, return existing promise (queue the request)
    if (reconnectPromiseRef.current) {
      console.log(`[Reconnect Coordinator] Reconnection in progress - queueing request from ${source}`);
      return reconnectPromiseRef.current;
    }
    
    // Create new reconnection promise
    console.log(`[Reconnect Coordinator] Starting new reconnection from ${source}`);
    isReconnectingRef.current = true;
    
    const reconnectPromise = new Promise<WebSocket>(async (resolve, reject) => {
      try {
        // Wait for delay (if any)
        if (delayMs > 0) {
          console.log(`[Reconnect Coordinator] Waiting ${delayMs}ms before reconnecting...`);
          await new Promise(r => setTimeout(r, delayMs));
        }
        
        // Check if reconnect was aborted during delay
        if (!shouldReconnectRef.current) {
          console.log('[Reconnect Coordinator] Reconnect aborted (intentional disconnect)');
          reject(new Error('Reconnect aborted'));
          return;
        }
        
        // Close old WebSocket if exists
        const oldWs = wsRef.current;
        if (oldWs && (oldWs.readyState === WebSocket.OPEN || oldWs.readyState === WebSocket.CONNECTING)) {
          console.log('[Reconnect Coordinator] Closing old WebSocket before creating new one');
          oldWs.close();
        }
        
        // Create new WebSocket (now async, waits for URL internally)
        console.log('[Reconnect Coordinator] Creating new WebSocket connection...');
        const newWs = await connectWebSocket();
        wsRef.current = newWs;
        
        // Wait for connection to open or fail
        const connectionTimeout = 10000; // 10 second timeout
        const connectionPromise = new Promise<WebSocket>((resolveConn, rejectConn) => {
          const timeoutId = setTimeout(() => {
            rejectConn(new Error('Connection timeout'));
          }, connectionTimeout);
          
          newWs.addEventListener('open', () => {
            clearTimeout(timeoutId);
            resolveConn(newWs);
          }, { once: true });
          
          newWs.addEventListener('error', () => {
            clearTimeout(timeoutId);
            rejectConn(new Error('Connection failed'));
          }, { once: true });
        });
        
        const connectedWs = await connectionPromise;
        console.log('[Reconnect Coordinator] ✅ Connection established successfully');
        resolve(connectedWs);
        
      } catch (error) {
        console.error('[Reconnect Coordinator] ❌ Reconnection failed:', error);
        reject(error);
      } finally {
        // Clean up coordinator state
        console.log('[Reconnect Coordinator] Cleaning up coordinator state');
        reconnectPromiseRef.current = null;
        isReconnectingRef.current = false;
      }
    });
    
    // Store promise for subsequent requests
    reconnectPromiseRef.current = reconnectPromise;
    
    return reconnectPromise;
  };

  // MOBILE FIX: Page Visibility API for instant reconnection when app returns from background
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Page Visibility] 👁️ App became visible (resumed from background)');
        
        // SAFETY CHECK: Only reconnect if we should (not after intentional disconnect)
        if (!shouldReconnectRef.current) {
          console.log('[Page Visibility] Reconnect disabled (intentional disconnect) - ignoring visibility change');
          return;
        }
        
        // SAFETY CHECK: Don't create duplicate connections if already reconnecting
        if (isReconnectingRef.current) {
          console.log('[Page Visibility] Already reconnecting - ignoring visibility change');
          return;
        }
        
        // Check if WebSocket is disconnected
        const currentWs = wsRef.current;
        const isDisconnected = !currentWs || currentWs.readyState === WebSocket.CLOSED || currentWs.readyState === WebSocket.CLOSING;
        
        if (isDisconnected) {
          console.log('[Page Visibility] 🔄 WebSocket disconnected, attempting immediate reconnection...');
          
          // Set UI state FIRST before any async operations
          setConnectionStatus("connecting");
          setReconnectAttempt(0); // Reset attempt counter for fresh start
          
          // Clear any existing reconnect timers
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
          
          // Reset reconnection state
          reconnectAttemptRef.current = 0;
          
          // Use coordinator for serialized reconnection (no delay for immediate reconnect)
          coordinateReconnect(0, 'page-visibility')
            .then(() => {
              console.log('[Page Visibility] ✅ Reconnection successful');
            })
            .catch((error) => {
              console.error('[Page Visibility] ❌ Failed to reconnect:', error);
              setConnectionStatus("disconnected");
              setDisconnectReason("Connection Failed");
              setDisconnectDetails("Failed to reconnect after returning from background");
            });
        } else {
          console.log('[Page Visibility] ✅ WebSocket already connected, no action needed');
        }
      } else {
        console.log('[Page Visibility] 🌙 App backgrounded (invisible)');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    console.log('[Page Visibility] Listener installed for mobile background/resume detection');
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      console.log('[Page Visibility] Listener removed');
    };
  }, []); // Empty deps - use refs for current state

  // MOBILE FIX: Network change detection for instant recovery
  // Detects WiFi ↔ Mobile data switches and internet connection loss/restore
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Network] 🌐 Internet connection restored - checking WebSocket');
      
      // Check if WebSocket needs reconnection
      const currentWs = wsRef.current;
      const isDisconnected = !currentWs || currentWs.readyState === WebSocket.CLOSED || currentWs.readyState === WebSocket.CLOSING;
      
      if (isDisconnected && shouldReconnectRef.current) {
        console.log('[Network] 🔄 Reconnecting after internet restoration...');
        setConnectionStatus("connecting");
        
        // Clear existing reconnect timers
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        
        reconnectAttemptRef.current = 0;
        setReconnectAttempt(0);
        
        // Use coordinator for serialized reconnection (no delay for network restore)
        coordinateReconnect(0, 'network-online')
          .then(() => {
            console.log('[Network] ✅ Reconnection successful after internet restoration');
          })
          .catch((error) => {
            console.error('[Network] ❌ Failed to reconnect after internet restoration:', error);
          });
      }
    };
    
    const handleOffline = () => {
      console.log('[Network] 📡 Internet connection lost');
      setConnectionStatus("disconnected");
      setDisconnectReason("No Internet");
      setDisconnectDetails("Your internet connection was lost. Will reconnect automatically when restored.");
    };
    
    // Network Information API - detects network type changes (WiFi ↔ Mobile data)
    const handleNetworkChange = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection) {
        const type = connection.effectiveType || connection.type || 'unknown';
        console.log('[Network] 🔄 Network type changed:', type);
        
        // If WebSocket is connected, it will survive the network switch thanks to tokens
        // If disconnected, the auto-reconnect will handle it
        const currentWs = wsRef.current;
        if (currentWs && currentWs.readyState === WebSocket.OPEN) {
          console.log('[Network] ✅ WebSocket still connected after network change');
        } else {
          console.log('[Network] ⚠️ WebSocket disconnected - auto-reconnect will handle');
        }
      }
    };
    
    // Add listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleNetworkChange);
      console.log('[Network] Network change detection enabled (connection type:', connection.effectiveType || connection.type || 'unknown', ')');
    } else {
      console.log('[Network] Network Information API not available - online/offline events only');
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', handleNetworkChange);
      }
      console.log('[Network] Event listeners removed');
    };
  }, []); // Empty deps - use refs for current state

  useEffect(() => {
    // Use stable roomIdRef for mobile reliability
    const stableRoomId = roomIdRef.current;
    
    if (!stableRoomId) {
      console.error('[WebSocket Setup] roomId is undefined - cannot create WebSocket');
      setLocation("/");
      return;
    }

    let heartbeatInterval: NodeJS.Timeout | null = null;
    
    // Helper function to set up WebSocket and heartbeat
    const setupConnection = async () => {
      try {
        // connectWebSocket is now async and waits for URL to be ready
        const ws = await connectWebSocket();
        wsRef.current = ws;
        
        // Application-level heartbeat to prevent mobile carrier timeout
        // MOBILE FIX: Send ping every 10 seconds to prevent carrier/proxy 15-second idle timeout
        // Mobile carriers often drop idle connections after 15s, so 10s keeps connection alive
        heartbeatInterval = setInterval(() => {
          // CRITICAL FIX: Use wsRef.current instead of captured 'ws' to handle reconnections
          const currentWs = wsRef.current;
          if (currentWs && currentWs.readyState === WebSocket.OPEN) {
            console.log('[Heartbeat] 💓 Sending ping to keep connection alive, readyState:', currentWs.readyState);
            currentWs.send(JSON.stringify({ type: "ping" }));
          } else {
            console.warn('[Heartbeat] ⚠️ Skipping ping - WebSocket not open, readyState:', currentWs?.readyState || 'null');
          }
        }, 10000); // 10 seconds - prevents mobile carrier 15s idle timeout
      } catch (error) {
        console.error('[WebSocket Setup] Failed to create connection:', error);
      }
    };

    // Start connection setup (connectWebSocket now waits for URL internally)
    setupConnection();

    return () => {
      // Clear heartbeat interval
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      
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
      
      // Clear reconnect timeout if pending
      if (reconnectTimeoutRef.current) {
        console.log('[WebSocket Cleanup] Clearing pending reconnect timeout');
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Prevent reconnect on component unmount
      shouldReconnectRef.current = false;
      
      // Use wsRef.current instead of captured ws variable
      const currentWs = wsRef.current;
      if (currentWs) {
        console.log('[WebSocket Cleanup] Component unmounting - cleaning up WebSocket, current readyState:', currentWs.readyState);
        if (currentWs.readyState === WebSocket.OPEN || currentWs.readyState === WebSocket.CONNECTING) {
          console.log('[WebSocket Cleanup] Closing WebSocket during component unmount');
          currentWs.close(1000, "Component unmount");
        } else {
          console.log('[WebSocket Cleanup] WebSocket already closed during unmount, readyState:', currentWs.readyState);
        }
      }
      
      // Clear sequence tracking for this room
      if (roomIdRef.current) {
        clearLastReceivedSeq(roomIdRef.current);
      }
      
      console.log('[WebSocket Cleanup] Cleanup complete');
    };
    // CRITICAL: Do NOT include toast or setLocation - they cause constant re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, language, voiceGender, role]);

  const startConversation = async () => {
    // CRITICAL: Check WebSocket connection state first
    const currentWs = wsRef.current;
    if (!currentWs || currentWs.readyState !== WebSocket.OPEN) {
      console.warn('[Start Conversation] ⚠️ WebSocket not ready, readyState:', currentWs?.readyState || 'null');
      
      // Instead of silently failing, schedule a retry when connection opens
      toast({
        title: "Connecting...",
        description: "Waiting for connection to establish. Will start automatically when ready.",
        variant: "info",
      });
      
      // Wait for WebSocket to be ready (with timeout)
      const maxWait = 15000; // 15 seconds max wait
      const startTime = Date.now();
      
      while ((!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) && (Date.now() - startTime < maxWait)) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Check again after waiting
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.error('[Start Conversation] ❌ Timeout waiting for WebSocket to be ready');
        toast({
          title: "Connection Failed",
          description: "Could not establish connection. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      console.log('[Start Conversation] ✅ WebSocket ready after waiting');
    }
    
    // Check if partner is connected
    if (!partnerConnected) {
      toast({
        title: "Partner Not Connected",
        description: "Please wait for your partner to join before starting the conversation.",
        variant: "info",
      });
      return;
    }

    // Check if quota is already exceeded
    if (quotaExceededRef.current) {
      toast({
        title: "Quota Limit Reached",
        description: "Cannot start conversation - service quota exceeded. Please upgrade your account.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('[Start Conversation] ✅ All checks passed - WebSocket OPEN, partner connected, quota available');
    
    // MOBILE FIX: Unlock audio on first microphone activation
    await unlockAudioForMobile();
    
    try {
      // Reset session ready flag before creating new recognizer
      azureSessionReadyRef.current = false;
      
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
        // Mark session as ready - WebSocket is now connected
        azureSessionReadyRef.current = true;
        console.log('[Azure Speech] ✅ Session ready - WebSocket connected');
      };
      
      recognizer.sessionStopped = (s, e) => {
        console.log('[Azure Speech] Session stopped:', {
          sessionId: e.sessionId,
          timestamp: new Date().toISOString()
        });
        // Mark session as not ready
        azureSessionReadyRef.current = false;
        console.log('[Azure Speech] ⚠️ Session not ready - WebSocket disconnected');
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
              const stableRoomId = roomIdRef.current;
              if (!stableRoomId) {
                console.error('[Speech] Cannot send interim transcription - roomId undefined');
                return;
              }
              
              wsRef.current.send(JSON.stringify({
                type: "transcription",
                roomId: stableRoomId,
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
          
          // CRITICAL DUPLICATE PREVENTION: Cache Azure Speech SDK resultIds
          // Azure fires 'recognized' twice for same utterance: initial final + rescored final (~100ms apart)
          // This prevents rescored duplicates from reaching server and causing duplicate translations
          const resultId = e.result.resultId;
          const now = Date.now();
          const RESULT_ID_TTL = 5000; // 5 second TTL - match server-side dedupe window
          
          // Clean up expired resultIds from cache (older than TTL)
          const expiredIds: string[] = [];
          processedResultIdsRef.current.forEach((timestamp, id) => {
            if (now - timestamp > RESULT_ID_TTL) {
              expiredIds.push(id);
            }
          });
          expiredIds.forEach(id => processedResultIdsRef.current.delete(id));
          if (expiredIds.length > 0) {
            console.log(`[Azure Speech Dedupe] 🧹 Cleaned up ${expiredIds.length} expired resultIds from cache`);
          }
          
          // Check if this resultId was already processed within TTL window
          const lastProcessedTime = processedResultIdsRef.current.get(resultId);
          if (lastProcessedTime !== undefined) {
            const timeSinceLastProcess = now - lastProcessedTime;
            console.warn(`[Azure Speech Dedupe] ⛔ DUPLICATE RESULTID BLOCKED!`);
            console.warn(`[Azure Speech Dedupe] 🔍 ResultId: ${resultId}`);
            console.warn(`[Azure Speech Dedupe] 📝 Text: "${e.result.text}"`);
            console.warn(`[Azure Speech Dedupe] ⏱️ Last processed: ${timeSinceLastProcess}ms ago (TTL: ${RESULT_ID_TTL}ms)`);
            console.warn(`[Azure Speech Dedupe] 💡 This is likely Azure Speech SDK's rescoring mechanism`);
            console.warn(`[Azure Speech Dedupe] ✅ Prevented duplicate from reaching server - no translation cost incurred`);
            return; // Don't send duplicate - Azure already sent this utterance
          }
          
          // Mark resultId as processed with current timestamp
          processedResultIdsRef.current.set(resultId, now);
          console.log(`[Azure Speech Dedupe] ✅ New resultId processed: ${resultId}, cache size: ${processedResultIdsRef.current.size}`);
          
          // Additional cleanup: cap cache size to prevent unbounded growth
          if (processedResultIdsRef.current.size > 100) {
            const entriesToDelete = Array.from(processedResultIdsRef.current.entries())
              .sort((a, b) => a[1] - b[1]) // Sort by timestamp, oldest first
              .slice(0, 50) // Delete oldest 50
              .map(([id]) => id);
            
            entriesToDelete.forEach(id => processedResultIdsRef.current.delete(id));
            console.log(`[Azure Speech Dedupe] 🧹 Emergency cleanup: removed ${entriesToDelete.length} oldest resultIds. New cache size: ${processedResultIdsRef.current.size}`);
          }
          
          // TEMPORAL DEDUPLICATION: Block utterances with duplicate audio offsets AND matching text
          // Azure sometimes sends different resultIds for the same audio segment (rescoring)
          // offset = when utterance starts in audio stream (in ticks, 10M ticks = 1 second)
          // This catches rescores that slip through resultId dedup
          const offset = e.result.offset;
          const duration = e.result.duration;
          const text = e.result.text;
          const OFFSET_TOLERANCE = 1000000; // 100ms in ticks (10,000 ticks = 1ms) - tight tolerance for rescores only
          const OFFSET_TTL = 1000; // 1 second TTL for offset tracking - rescores happen within ~300ms
          
          // Clean up expired offsets from cache
          const expiredOffsetKeys: string[] = [];
          processedOffsetsRef.current.forEach((cacheEntry, cacheKey) => {
            if (now - cacheEntry.timestamp > OFFSET_TTL) {
              expiredOffsetKeys.push(cacheKey);
            }
          });
          expiredOffsetKeys.forEach(key => processedOffsetsRef.current.delete(key));
          if (expiredOffsetKeys.length > 0) {
            console.log(`[Temporal Dedupe] 🧹 Cleaned up ${expiredOffsetKeys.length} expired offset entries from cache`);
          }
          
          // Check if we've seen this offset + text combination recently (within tolerance)
          // Only block if BOTH offset AND exact text match - prevents blocking legitimate new speech
          // Note: Each component instance = one speaker, so cache is auto-scoped per speaker
          let foundDuplicate = false;
          for (const [cacheKey, cacheEntry] of Array.from(processedOffsetsRef.current.entries())) {
            const offsetDiff = Math.abs(offset - cacheEntry.offset);
            const textMatches = cacheEntry.text.toLowerCase().trim() === text.toLowerCase().trim();
            
            // Block only if BOTH offset AND exact text match (case-insensitive, whitespace-normalized)
            // This catches Azure rescoring (same audio segment, different resultId) while allowing:
            // - Different text at same offset = allowed (shouldn't happen in practice)
            // - Same text at different offset = allowed (legitimate repeat)
            if (offsetDiff < OFFSET_TOLERANCE && textMatches) {
              const timeSinceProcessed = now - cacheEntry.timestamp;
              console.warn(`[Temporal Dedupe] ⛔ DUPLICATE BLOCKED (offset + text match)!`);
              console.warn(`[Temporal Dedupe] 🎯 Offset: ${offset} (cached: ${cacheEntry.offset}, diff: ${offsetDiff} ticks)`);
              console.warn(`[Temporal Dedupe] 📝 Text: "${text}" (matches cached text)`);
              console.warn(`[Temporal Dedupe] ⏱️ Last processed: ${timeSinceProcessed}ms ago (TTL: ${OFFSET_TTL}ms)`);
              console.warn(`[Temporal Dedupe] 💡 Same audio segment - different resultId (Azure rescoring variant)`);
              console.warn(`[Temporal Dedupe] ✅ Prevented duplicate from reaching server - no translation cost incurred`);
              foundDuplicate = true;
              break;
            }
          }
          
          if (foundDuplicate) {
            return; // Block duplicate
          }
          
          // Mark this offset + text as processed (use offset as key for uniqueness)
          const offsetKey = `${offset}`;
          processedOffsetsRef.current.set(offsetKey, { offset, text, timestamp: now });
          console.log(`[Temporal Dedupe] ✅ New offset+text processed: offset=${offset}, text="${text.substring(0, 30)}...", cache size: ${processedOffsetsRef.current.size}`);
          
          // Cleanup: cap offset cache size
          if (processedOffsetsRef.current.size > 50) {
            const oldestKeys = Array.from(processedOffsetsRef.current.entries())
              .sort((a, b) => a[1].timestamp - b[1].timestamp)
              .slice(0, 25)
              .map(([key]) => key);
            
            oldestKeys.forEach(key => processedOffsetsRef.current.delete(key));
            console.log(`[Temporal Dedupe] 🧹 Emergency cleanup: removed ${oldestKeys.length} oldest offset entries. New cache size: ${processedOffsetsRef.current.size}`);
          }
          
          const stableRoomId = roomIdRef.current;
          if (!stableRoomId) {
            console.error('[Speech] Cannot send final transcription - roomId undefined');
            return;
          }
          
          const message = {
            type: "transcription",
            roomId: stableRoomId,
            text: e.result.text,
            language,
            interim: false, // Mark as final result
            offset, // Audio offset in ticks for temporal deduplication
            duration, // Audio duration in ticks
            timestamp: Date.now()
          };
          
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            // WebSocket is ready - send immediately
            wsRef.current.send(JSON.stringify(message));
            console.log(`[Speech] ✅ Sent final transcription immediately: "${e.result.text.substring(0, 30)}..."`);
          } else {
            // WebSocket not ready - queue the message with bounded size
            const MAX_QUEUE_SIZE = 20; // Limit queue to prevent memory issues
            const MAX_MESSAGE_AGE = 30000; // 30 seconds max age
            
            // Clean up old messages from queue first
            const now = Date.now();
            pendingMessagesRef.current = pendingMessagesRef.current.filter(msg => {
              const age = now - msg.timestamp;
              return age < MAX_MESSAGE_AGE;
            });
            
            // Add new message if queue isn't full
            if (pendingMessagesRef.current.length < MAX_QUEUE_SIZE) {
              pendingMessagesRef.current.push(message);
              console.warn(`[Speech] ⚠️ WebSocket not ready (state: ${wsRef.current?.readyState || 'null'}), queued message: "${e.result.text.substring(0, 30)}..."`);
              console.warn(`[Speech] 📦 Queue size: ${pendingMessagesRef.current.length}/${MAX_QUEUE_SIZE} pending messages`);
            } else {
              console.error(`[Speech] ❌ Queue full (${MAX_QUEUE_SIZE} messages) - dropping message: "${e.result.text.substring(0, 30)}..."`);
              toast({
                title: "Connection Issue",
                description: "Message queue full. Please wait for connection to restore.",
                variant: "destructive",
                duration: 3000,
              });
            }
          }
        }
      };
      
      // CRITICAL: Add error handlers to prevent recognizer from stopping
      recognizer.canceled = (s, e) => {
        console.error(`[Azure Speech SDK] ❌ Recognition canceled - Reason: ${e.reason}, Details: ${e.errorDetails}`);
        
        // CRITICAL FIX: Only detect quota errors from specific Azure WebSocket error codes
        // WebSocket Close Code 1007 with specific Azure quota error message
        // Do NOT use broad string matching (prevents false positives from connection errors)
        const isQuotaError = e.errorDetails?.includes('WebSocket close code: 1007') && 
                           (e.errorDetails?.includes('Quota') || e.errorDetails?.includes('quota'));
        
        if (isQuotaError) {
          console.error('[Azure Speech SDK] 🚫 QUOTA EXCEEDED (WebSocket 1007) - Stopping all recognition');
          quotaExceededRef.current = true;
          setQuotaExceeded(true);
          setQuotaError('Service quota exceeded. Your account has hit its usage limit.');
          setIsMuted(true);
          
          // Stop the recognizer completely
          if (recognizerRef.current) {
            recognizerRef.current.stopContinuousRecognitionAsync(
              () => {
                console.log('[Azure Speech SDK] Recognition stopped due to quota limit');
                recognizerRef.current?.close();
                recognizerRef.current = null;
              },
              (err) => console.error('[Azure Speech SDK] Error stopping recognizer:', err)
            );
          }
          
          toast({
            title: "Service Quota Limit Reached",
            description: "Speech service quota exceeded. Please upgrade your account or wait for quota reset.",
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
          console.log('[Speech] Recognition started successfully - microphone is now active');
          recognizerRef.current = recognizer;
          isMutedRef.current = false; // Update ref to allow event processing
          setIsMuted(false);
          
          // MOBILE UX FIX: Only set conversation as started AFTER mic permission is granted and recognizer is active
          // This prevents showing the mic controls before permission is granted, eliminating the need for a second click
          setConversationStarted(true);
          
          console.log('[Speech] Conversation started with microphone already active (no second click needed)');
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
        description: "Cannot enable microphone - service quota exceeded. Please upgrade your account.",
        variant: "destructive",
      });
      return;
    }

    // Prevent unmuting if partner hasn't joined yet (silent check - no toast)
    if (isMuted && !partnerConnected) {
      console.log('[Mic] Cannot unmute - partner not connected yet');
      return;
    }
    
    if (!isMuted) {
      // Muting - stop the recognizer completely
      console.log('[Mic] Muting microphone - stopping recognition');
      
      // CRITICAL: Set muted state in ref FIRST to stop event processing immediately
      isMutedRef.current = true;
      setIsMuted(true);
      setIsSpeaking(false); // Clear speaking state immediately
      azureSessionReadyRef.current = false; // Mark Azure session as not ready
      
      // Clear interim text timeouts BEFORE clearing interim text (prevents race conditions)
      if (myInterimTimeoutRef.current) {
        clearTimeout(myInterimTimeoutRef.current);
        myInterimTimeoutRef.current = null;
      }
      
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
    
    // Clear interim text timeouts BEFORE clearing interim text (prevents race conditions)
    if (myInterimTimeoutRef.current) {
      clearTimeout(myInterimTimeoutRef.current);
      myInterimTimeoutRef.current = null;
    }
    if (partnerInterimTimeoutRef.current) {
      clearTimeout(partnerInterimTimeoutRef.current);
      partnerInterimTimeoutRef.current = null;
    }
    
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

  const performActualDisconnect = () => {
    console.log('[End Call] 📞 Performing actual disconnect after rating');
    console.log(`[End Call] 📊 SESSION STATISTICS:`);
    console.log(`  - Total TTS Requests: ${ttsRequestCounterRef.current}`);
    console.log(`  - Total Token Requests: ${tokenRequestCounterRef.current}`);
    console.log(`  - Total Translation Requests: ${translationRequestCounterRef.current}`);
    
    // Prevent auto-reconnect on intentional disconnect
    shouldReconnectRef.current = false;
    
    // Clear saved room settings (intentional disconnect = don't auto-recreate)
    clearRoomFromStorage();
    
    // CLEANUP 1: Stop Azure Speech recognizer immediately to prevent further API calls
    if (recognizerRef.current) {
      console.log('[End Call] Stopping Azure Speech recognizer...');
      recognizerRef.current.stopContinuousRecognitionAsync(
        () => {
          console.log('[End Call] ✅ Speech recognizer stopped successfully');
          recognizerRef.current?.close();
          recognizerRef.current = null;
        },
        (err) => console.error('[End Call] ❌ Error stopping recognizer:', err)
      );
    }
    
    // CLEANUP 2: Clear TTS queue to prevent pending audio synthesis
    if (ttsQueueRef.current.length > 0) {
      console.log(`[End Call] Clearing ${ttsQueueRef.current.length} pending TTS items from queue`);
      ttsQueueRef.current = [];
    }
    
    // CLEANUP 3: Stop any playing audio immediately
    if (currentAudioRef.current) {
      console.log('[End Call] Stopping current audio playback...');
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current.src = '';
    }
    
    // CLEANUP 4: Revoke blob URL to free memory
    if (currentBlobUrlRef.current) {
      console.log('[End Call] Revoking blob URL...');
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
    
    // CLEANUP 5: Clear Azure token cache (will fetch fresh token on next session)
    if (azureTokenRef.current) {
      console.log('[End Call] Clearing Azure token cache');
      azureTokenRef.current = null;
    }
    
    // CLEANUP 6: Reset processing flags
    isProcessingTTSRef.current = false;
    ttsRequestInFlightRef.current = false;
    tokenRequestInFlightRef.current = false;
    
    // CLEANUP 6.5: Reset request counters for next session
    ttsRequestCounterRef.current = 0;
    tokenRequestCounterRef.current = 0;
    translationRequestCounterRef.current = 0;
    
    // CLEANUP 7: Clear message deduplication sets
    spokenMessageIdsRef.current.clear();
    processedMessagesRef.current.clear();
    
    // CLEANUP 8: Stop session timer
    setSessionActive(false);
    
    // CLEANUP 9: Close WebSocket connection
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[End Call] Closing WebSocket connection...');
      wsRef.current.close(1000, "User ended call");
    }
    
    console.log('[End Call] ✅ All cleanup completed - navigating to home');
    setLocation("/");
  };

  const handleEndCall = () => {
    console.log('[End Call] 📞 User clicked End Call - showing rating dialog');
    setShowRatingDialog(true);
  };

  const handleRatingSubmit = async (rating: number, feedback?: string, metadata?: { userAgent?: string; language?: string; voiceGender?: string }): Promise<boolean> => {
    console.log('[Rating] User rated call:', rating, 'stars', feedback ? 'with feedback' : '');
    
    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          roomId,
          rating,
          feedback,
          userAgent: metadata?.userAgent,
          language: metadata?.language,
          voiceGender: metadata?.voiceGender,
        }),
      });

      if (!response.ok) {
        console.error('[Rating] Failed to submit rating');
        toast({
          title: "Rating Failed",
          description: "Could not save your rating. Please try again.",
          variant: "destructive",
        });
        return false; // Keep dialog open on failure
      }
      
      console.log('[Rating] ✅ Rating submitted successfully');
      
      // Success - close dialog and perform actual disconnect
      setShowRatingDialog(false);
      performActualDisconnect();
      return true;
    } catch (error) {
      console.error('[Rating] Error submitting rating:', error);
      toast({
        title: "Rating Failed",
        description: "Could not save your rating. Please try again.",
        variant: "destructive",
      });
      return false; // Keep dialog open on failure
    }
  };

  // Mobile-first share handler with Web Share API fallback
  const handleShareLink = async () => {
    const link = `${window.location.origin}/join/${roomId}`;
    const shareData = {
      title: 'Join my Voztra translation room',
      text: 'Let\'s have a conversation with real-time voice translation!',
      url: link
    };

    // Try Web Share API first (mobile native sharing - no app switching!)
    if (navigator.share && navigator.canShare) {
      try {
        // Check if we can share this data
        if (navigator.canShare(shareData)) {
          console.log('[Share] Using Web Share API (native mobile share)');
          await navigator.share(shareData);
          console.log('[Share] ✅ Share successful via Web Share API');
          toast({
            title: "Shared Successfully",
            description: "Your partner can now join the room",
          });
          return;
        }
      } catch (error: any) {
        // AbortError = user cancelled share sheet (not a real error)
        if (error.name === 'AbortError') {
          console.log('[Share] User cancelled share sheet');
          return; // Don't show error, keep dialog open
        }
        console.error('[Share] Web Share API failed:', error);
        // Fall through to clipboard fallback
      }
    }

    // Fallback: Copy to clipboard (desktop or unsupported browsers)
    try {
      console.log('[Share] Using clipboard fallback');
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link Copied",
        description: "Share this link with your conversation partner",
      });
    } catch (error) {
      console.error('[Share] Clipboard copy failed:', error);
      toast({
        title: "Copy Failed",
        description: "Please manually copy the link above",
        variant: "destructive",
      });
    }
  };

  // Legacy copy-only handler (kept for explicit copy button)
  const handleCopyLink = async () => {
    const link = `${window.location.origin}/join/${roomId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link Copied",
        description: "Share this link with your conversation partner",
      });
    } catch (error) {
      console.error('[Copy] Failed:', error);
      toast({
        title: "Copy Failed",
        description: "Please manually copy the link",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-[100dvh] md:h-screen flex flex-col bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:72px_72px]" />
      
      {/* Header - Compact Mobile, Full Desktop */}
      <header className="border-b border-slate-300/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl relative z-10">
        <div className="container mx-auto px-2 sm:px-6 md:px-12 py-1.5 sm:py-2">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Left: Connection Status & Timer */}
            <div className="flex items-center gap-2 sm:gap-3">
              <ConnectionStatus 
                status={connectionStatus} 
                disconnectReason={disconnectReason}
                disconnectDetails={disconnectDetails}
              />
              
              {/* Session Timer - show when session is active or has elapsed time */}
              {(sessionActive || elapsedSeconds > 0) && (
                <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg ${
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
              
              {/* Minutes Remaining Badge - HOST only, mobile and desktop - Clickable */}
              {(role === "creator" || role === "owner") && subscription && (
                <Link href="/account">
                  <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-primary/10 border border-primary/30 cursor-pointer hover:bg-primary/20 transition-colors">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span className="text-xs sm:text-sm font-bold text-foreground" data-testid="text-minutes-remaining">
                      {Math.floor((subscription.creditsRemaining || 0) / 60)} min
                    </span>
                  </div>
                </Link>
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
            
            {/* Right: End Call - Desktop Only */}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEndCall}
              className="hidden md:flex gap-2"
              data-testid="button-end-call-desktop"
            >
              <PhoneOff className="h-4 w-4" />
              <span className="text-sm">End Call</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Partner Wait Countdown Banner - Only for owners waiting for partner */}
      {waitingCountdown > 0 && !partnerConnected && (role === "creator" || role === "owner") && (
        <div className="bg-muted/50 border-y border-border backdrop-blur-sm relative z-10 animate-in slide-in-from-top duration-500">
          <div className="container mx-auto px-6 md:px-12 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center ring-2 ring-border">
                  <span className="text-foreground font-bold text-lg">{waitingCountdown}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    No One Has Joined Yet
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Redirecting to home page in <span className="font-bold text-foreground">{waitingCountdown} second{waitingCountdown !== 1 ? 's' : ''}</span>. Share your room link to invite someone!
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowShareDialog(true)}
                data-testid="button-share-room"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Link
              </Button>
            </div>
          </div>
        </div>
      )}

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
                  <h3 className="text-sm font-semibold text-destructive mb-1">Service Quota Limit Reached</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Your speech service quota has been exceeded. If you've upgraded your account or changed API keys, click "Try Again" to resume.
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

      {/* Main Content - Mobile: 100% fit to frame, no scrolling */}
      <main className="flex-1 overflow-hidden relative z-10 pb-[90px] md:pb-0">
        <div className="h-full container mx-auto px-2 sm:px-6 md:px-12 py-0.5 sm:py-4 md:py-6">
          <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-0.5 sm:gap-4 max-w-7xl mx-auto">
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

      {/* Footer - Desktop Only (mobile has sticky toolbar instead) */}
      <footer className="hidden md:block border-t border-slate-300/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl relative z-10">
        <div className="container mx-auto px-3 sm:px-6 md:px-12 py-3 sm:py-4 md:py-6">
          {!conversationStarted && connectionStatus === "connected" ? (
            <div className="flex flex-col items-center gap-2 sm:gap-4">
              <Button
                size="lg"
                onClick={startConversation}
                disabled={quotaExceeded || !partnerConnected}
                className="h-12 sm:h-14 md:h-16 px-8 sm:px-10 md:px-12 text-base sm:text-lg bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/25 group disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-start-conversation"
              >
                <Mic className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 group-hover:scale-110 transition-transform" />
                {quotaExceeded ? "Quota Exceeded" : !partnerConnected ? "Waiting for Partner" : "Start Conversation"}
              </Button>
              <p className="text-xs sm:text-sm text-muted-foreground text-center px-4">
                {quotaExceeded 
                  ? "Cannot start - service quota limit reached" 
                  : !partnerConnected
                    ? "Waiting for your partner to join the room..."
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
                disabled={(quotaExceeded && isMuted) || (isMuted && !partnerConnected)}
                className={`h-16 w-16 sm:h-20 sm:w-20 rounded-full shadow-xl ${
                  !isMuted ? "bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-primary/25" : ""
                } ${((quotaExceeded && isMuted) || (isMuted && !partnerConnected)) ? "opacity-50 cursor-not-allowed" : ""}`}
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
                    ? "Service quota reached - upgrade to continue"
                    : isMuted 
                      ? partnerConnected 
                        ? "Click the button to unmute"
                        : "Waiting for partner to join..."
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
            
            {/* OPTION 2: Primary Share button - uses Web Share API on mobile, clipboard on desktop */}
            <Button
              onClick={handleShareLink}
              className="w-full h-14 text-base bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/25"
              data-testid="button-share"
            >
              <Share2 className="mr-2 h-5 w-5" />
              Share with Partner
            </Button>
            
            <Button
              onClick={() => setShowShareDialog(false)}
              variant="outline"
              className="w-full h-11 text-sm"
              data-testid="button-close-dialog"
            >
              <Mic className="mr-2 h-4 w-4" />
              {partnerConnected ? "Start Conversation" : "Got it, I'll share later"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Modal */}
      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />

      {/* Rating Dialog */}
      <RatingDialog 
        open={showRatingDialog} 
        onOpenChange={(open) => {
          setShowRatingDialog(open);
          // If user closes dialog without rating, still disconnect
          if (!open) {
            performActualDisconnect();
          }
        }} 
        onSubmit={handleRatingSubmit}
        language={language}
        voiceGender={voiceGender}
        userAgent={typeof navigator !== 'undefined' ? navigator.userAgent : undefined}
      />

      {/* Mobile Sticky Bottom Toolbar - Compact overlay, doesn't affect layout height */}
      <div className="md:hidden fixed bottom-0 inset-x-0 px-2 pt-1.5 pb-safe z-20">
        <div className="flex flex-col items-center gap-1.5 rounded-t-2xl bg-background/90 dark:bg-slate-900/95 shadow-[0_-8px_30px_rgba(15,23,42,0.35)] backdrop-blur-xl py-2 px-3">
          {!conversationStarted ? (
            <>
              <div className="flex justify-center gap-1.5 w-full">
                <Button
                  size="lg"
                  onClick={startConversation}
                  disabled={connectionStatus !== "connected" || quotaExceeded || !partnerConnected}
                  className="h-12 px-6 text-sm bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex-1 max-w-xs"
                  data-testid="button-start-conversation-mobile"
                >
                  {connectionStatus !== "connected" ? (
                    <>
                      <div className="h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {reconnectAttempt > 0 ? `Reconnecting (${reconnectAttempt}/8)...` : "Connecting..."}
                    </>
                  ) : (
                    <>
                      <Mic className="h-5 w-5 mr-2" />
                      {quotaExceeded ? "Quota Exceeded" : !partnerConnected ? "Waiting for Partner" : "Start Conversation"}
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={handleEndCall}
                  className="h-12 w-12 rounded-full shrink-0"
                  data-testid="button-end-call-mobile"
                >
                  <PhoneOff className="h-5 w-5" />
                </Button>
              </div>
              {connectionStatus !== "connected" && (
                <p className="text-xs text-muted-foreground text-center">
                  Establishing connection to the room...
                </p>
              )}
              {connectionStatus === "connected" && (quotaExceeded || !partnerConnected) && (
                <p className="text-xs text-muted-foreground text-center">
                  {quotaExceeded 
                    ? "Cannot start - service quota limit reached" 
                    : "Waiting for your partner to join the room..."
                  }
                </p>
              )}
            </>
          ) : (
            <div className="flex justify-center gap-1.5 w-full">
              {conversationStarted && (
                <Button
                  size="lg"
                  variant={(quotaExceeded || !partnerConnected) ? "ghost" : (isMuted ? "secondary" : "default")}
                  onClick={toggleMute}
                  disabled={quotaExceeded || !partnerConnected}
                  className={`h-12 w-12 rounded-full shadow-xl ${
                    !isMuted && !quotaExceeded && partnerConnected ? "bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-primary/25" : ""
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  data-testid="button-toggle-mic-mobile"
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
              )}
              <Button
                variant="destructive"
                size="lg"
                onClick={handleEndCall}
                className="gap-2 flex-1 max-w-xs h-12"
                data-testid="button-end-call-mobile"
              >
                <PhoneOff className="h-4 w-4" />
                <span className="text-sm font-semibold">End Call</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
