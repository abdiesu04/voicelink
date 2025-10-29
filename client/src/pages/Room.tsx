import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { Mic, MicOff, PhoneOff, Copy, Check, Share2, Volume2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { TranscriptionPanel } from "@/components/TranscriptionPanel";
import { useToast } from "@/hooks/use-toast";
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

  const roomId = params?.roomId;
  const urlParams = new URLSearchParams(window.location.search);
  const role = urlParams.get("role") || "creator";
  const language = urlParams.get("language") || "en";
  const voiceGender = (urlParams.get("voiceGender") || "female") as "male" | "female";

  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connecting");
  const [isMuted, setIsMuted] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [partnerSpeaking, setPartnerSpeaking] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(role === "creator");
  const [copied, setCopied] = useState(false);
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [partnerLanguage, setPartnerLanguage] = useState<string>("");
  const [partnerVoiceGender, setPartnerVoiceGender] = useState<"male" | "female">("female");
  const [conversationStarted, setConversationStarted] = useState(false);

  const [myMessages, setMyMessages] = useState<TranscriptionMessage[]>([]);
  const [partnerMessages, setPartnerMessages] = useState<TranscriptionMessage[]>([]);
  const [myInterimText, setMyInterimText] = useState<string>("");
  const [partnerInterimText, setPartnerInterimText] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);
  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);
  const azureTokenRef = useRef<{ token: string; region: string } | null>(null);
  const spokenMessageIdsRef = useRef<Set<string>>(new Set());
  const lastInterimSentRef = useRef<number>(0);
  const activeSynthesizerRef = useRef<SpeechSDK.SpeechSynthesizer | null>(null);
  const ttsQueueRef = useRef<Array<{ text: string; languageCode: string; gender: "male" | "female"; messageId: string }>>([]);
  const isProcessingTTSRef = useRef<boolean>(false);

  const myLanguage = SUPPORTED_LANGUAGES.find(l => l.code === language);
  const theirLanguage = SUPPORTED_LANGUAGES.find(l => l.code === partnerLanguage);

  const azureLanguageMap: Record<string, string> = {
    'en': 'en-US', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE',
    'it': 'it-IT', 'pt': 'pt-PT', 'ru': 'ru-RU', 'ja': 'ja-JP',
    'ko': 'ko-KR', 'zh': 'zh-CN', 'ar': 'ar-SA', 'hi': 'hi-IN',
    'nl': 'nl-NL', 'pl': 'pl-PL', 'tr': 'tr-TR',
  };

  // Azure TTS voice names for each language and gender
  const getAzureVoiceName = (languageCode: string, gender: "male" | "female"): string => {
    const voiceMap: Record<string, { male: string, female: string }> = {
      'en': { male: 'en-US-GuyNeural', female: 'en-US-JennyNeural' },
      'es': { male: 'es-ES-AlvaroNeural', female: 'es-ES-ElviraNeural' },
      'fr': { male: 'fr-FR-HenriNeural', female: 'fr-FR-DeniseNeural' },
      'de': { male: 'de-DE-ConradNeural', female: 'de-DE-KatjaNeural' },
      'it': { male: 'it-IT-DiegoNeural', female: 'it-IT-ElsaNeural' },
      'pt': { male: 'pt-PT-DuarteNeural', female: 'pt-PT-RaquelNeural' },
      'ru': { male: 'ru-RU-DmitryNeural', female: 'ru-RU-SvetlanaNeural' },
      'ja': { male: 'ja-JP-KeitaNeural', female: 'ja-JP-NanamiNeural' },
      'ko': { male: 'ko-KR-InJoonNeural', female: 'ko-KR-SunHiNeural' },
      'zh': { male: 'zh-CN-YunxiNeural', female: 'zh-CN-XiaoxiaoNeural' },
      'ar': { male: 'ar-SA-HamedNeural', female: 'ar-SA-ZariyahNeural' },
      'hi': { male: 'hi-IN-MadhurNeural', female: 'hi-IN-SwaraNeural' },
      'nl': { male: 'nl-NL-MaartenNeural', female: 'nl-NL-ColetteNeural' },
      'pl': { male: 'pl-PL-MarekNeural', female: 'pl-PL-ZofiaNeural' },
      'tr': { male: 'tr-TR-AhmetNeural', female: 'tr-TR-EmelNeural' },
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

  // Process the TTS queue - plays one item at a time
  const processTTSQueue = async () => {
    // If already processing or queue is empty, do nothing
    if (isProcessingTTSRef.current || ttsQueueRef.current.length === 0) {
      return;
    }

    isProcessingTTSRef.current = true;

    while (ttsQueueRef.current.length > 0) {
      const item = ttsQueueRef.current.shift()!;
      
      // Skip if already spoken
      if (spokenMessageIdsRef.current.has(item.messageId)) {
        continue;
      }

      try {
        console.log('[TTS Queue] Playing:', item.text.substring(0, 50));

        const { token, region } = await getAzureToken();
        
        const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
        speechConfig.speechSynthesisLanguage = azureLanguageMap[item.languageCode] || 'en-US';
        speechConfig.speechSynthesisVoiceName = getAzureVoiceName(item.languageCode, item.gender);
        
        const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
        const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);
        
        // Store the active synthesizer
        activeSynthesizerRef.current = synthesizer;
        
        // Wait for the audio to complete before processing next item
        await new Promise<void>((resolve, reject) => {
          synthesizer.speakTextAsync(
            item.text,
            (result) => {
              if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
                console.log('[TTS Queue] Audio played successfully');
                // Mark as spoken only after successful playback
                spokenMessageIdsRef.current.add(item.messageId);
              }
              synthesizer.close();
              if (activeSynthesizerRef.current === synthesizer) {
                activeSynthesizerRef.current = null;
              }
              resolve();
            },
            (error) => {
              console.error('[TTS Queue] Error:', error);
              synthesizer.close();
              if (activeSynthesizerRef.current === synthesizer) {
                activeSynthesizerRef.current = null;
              }
              reject(error);
            }
          );
        });
      } catch (error) {
        console.error('[TTS Queue] Failed to speak text:', error);
      }
    }

    isProcessingTTSRef.current = false;
  };

  // Add translation to queue and start processing
  const speakText = (text: string, languageCode: string, gender: "male" | "female", messageId: string) => {
    if (spokenMessageIdsRef.current.has(messageId)) {
      return;
    }

    console.log('[TTS Queue] Adding to queue (queue size: ' + ttsQueueRef.current.length + '):', text.substring(0, 50));
    
    // Add translation to queue - all translations will play in order
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
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
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

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "participant-joined") {
        setPartnerConnected(true);
        setPartnerLanguage(message.language);
        setPartnerVoiceGender(message.voiceGender);
        setShowShareDialog(false);
        toast({
          title: "Partner Joined",
          description: "Your conversation partner has joined the room",
        });
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
        const messageId = `${message.speaker}-${Date.now()}-${message.originalText}`;
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
          speakText(message.translatedText, language, voiceGender, messageId);
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

    ws.onerror = () => {
      setConnectionStatus("disconnected");
      toast({
        title: "Connection Error",
        description: "Failed to connect to the server",
        variant: "destructive",
      });
    };

    ws.onclose = () => {
      setConnectionStatus("disconnected");
    };

    wsRef.current = ws;

    return () => {
      // Clear the TTS queue and stop any playing audio when leaving the room
      ttsQueueRef.current = [];
      isProcessingTTSRef.current = false;
      
      if (activeSynthesizerRef.current) {
        try {
          console.log('[TTS Queue] Stopping audio on component unmount');
          activeSynthesizerRef.current.close();
          activeSynthesizerRef.current = null;
        } catch (error) {
          console.error('[TTS Queue] Error stopping audio on unmount:', error);
        }
      }
      
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [roomId, language, voiceGender, role, toast, setLocation]);

  const startConversation = async () => {
    setConversationStarted(true);
    try {
      const { token, region } = await getAzureToken();
      
      const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
      speechConfig.speechRecognitionLanguage = azureLanguageMap[language] || 'en-US';
      
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
      
      recognizer.recognizing = (s, e) => {
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
      
      recognizer.startContinuousRecognitionAsync();
      recognizerRef.current = recognizer;
      setIsMuted(false);
      
    } catch (error) {
      console.error('Speech recognition error:', error);
      toast({
        title: "Microphone Access Denied",
        description: "Please enable microphone access to use voice features",
        variant: "destructive",
      });
      setIsMuted(true);
    }
  };

  const toggleMute = async () => {
    if (!isMuted) {
      setIsMuted(true);
      if (recognizerRef.current) {
        recognizerRef.current.stopContinuousRecognitionAsync();
        recognizerRef.current.close();
        recognizerRef.current = null;
      }
    } else {
      startConversation();
    }
  };

  const handleEndCall = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
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

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:72px_72px]" />
      
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl relative z-10 pt-20">
        <div className="container mx-auto px-6 md:px-12 py-6">
          <div className="flex items-center justify-between">
            <ConnectionStatus status={connectionStatus} latency={connectionStatus === "connected" ? 45 : undefined} />
            
            {myLanguage && theirLanguage && (
              <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <img 
                    src={`https://flagcdn.com/w40/${myLanguage.countryCode.toLowerCase()}.png`}
                    width="32"
                    height="24"
                    alt={myLanguage.code}
                    className="rounded border border-slate-600"
                  />
                  <div>
                    <div className="text-sm font-bold text-white">{myLanguage.name}</div>
                    <div className="text-xs text-slate-400">You</div>
                  </div>
                </div>
                <div className="h-10 w-px bg-slate-700" />
                <div className="flex items-center gap-3">
                  <img 
                    src={`https://flagcdn.com/w40/${theirLanguage.countryCode.toLowerCase()}.png`}
                    width="32"
                    height="24"
                    alt={theirLanguage.code}
                    className="rounded border border-slate-600"
                  />
                  <div>
                    <div className="text-sm font-bold text-white">{theirLanguage.name}</div>
                    <div className="text-xs text-slate-400">Partner</div>
                  </div>
                </div>
              </div>
            )}

            <Button
              variant="destructive"
              onClick={handleEndCall}
              className="gap-2"
              data-testid="button-end-call"
            >
              <PhoneOff className="h-4 w-4" />
              <span className="hidden sm:inline">End Call</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative z-10">
        <div className="h-full container mx-auto px-6 md:px-12 py-6">
          <div className="h-full grid md:grid-cols-2 gap-4 max-w-7xl mx-auto">
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

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-xl relative z-10">
        <div className="container mx-auto px-6 md:px-12 py-6">
          {!conversationStarted && connectionStatus === "connected" ? (
            <div className="flex flex-col items-center gap-4">
              <Button
                size="lg"
                onClick={startConversation}
                className="h-16 px-12 text-lg bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/25 group"
                data-testid="button-start-conversation"
              >
                <Mic className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />
                Start Conversation
              </Button>
              <p className="text-sm text-slate-400">
                Click to enable your microphone and begin speaking
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-8">
              <Button
                size="lg"
                variant={isMuted ? "secondary" : "default"}
                onClick={toggleMute}
                className={`h-20 w-20 rounded-full shadow-xl ${
                  !isMuted ? "bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-primary/25" : ""
                }`}
                data-testid="button-toggle-mic"
              >
                {isMuted ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
              </Button>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {!isMuted && (
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  )}
                  <span className="font-bold text-lg text-white">
                    {isMuted ? "Microphone Off" : partnerConnected ? "Ready to speak" : "Waiting for partner"}
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  {isMuted ? "Click the button to unmute" : "Click to mute your microphone"}
                </p>
              </div>
            </div>
          )}
        </div>
      </footer>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-lg bg-slate-800/95 border-slate-700/50 backdrop-blur-xl" data-testid="dialog-share-link">
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
              <DialogTitle className="text-3xl text-white">Share Room Link</DialogTitle>
              <DialogDescription className="text-base mt-2 text-slate-300">
                Send this link to your conversation partner to start translating
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="flex gap-2">
              <Input
                readOnly
                value={`${window.location.origin}/join/${roomId}`}
                className="font-mono text-sm bg-slate-900/50 border-slate-700 text-white"
                data-testid="input-share-link"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="shrink-0 border-slate-700 hover:bg-slate-800 text-white"
                data-testid="button-copy-link"
              >
                {copied ? <Check className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4 text-white" />}
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
