import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { Mic, MicOff, PhoneOff, Copy, Check, Settings, Share2, ArrowLeftRight } from "lucide-react";
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
import { Label } from "@/components/ui/label";
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

  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connecting");
  const [isMuted, setIsMuted] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [partnerSpeaking, setPartnerSpeaking] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(role === "creator");
  const [copied, setCopied] = useState(false);
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [partnerLanguage, setPartnerLanguage] = useState<string>("");
  const [conversationStarted, setConversationStarted] = useState(false);

  const [myMessages, setMyMessages] = useState<TranscriptionMessage[]>([]);
  const [partnerMessages, setPartnerMessages] = useState<TranscriptionMessage[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);
  const azureTokenRef = useRef<{ token: string; region: string } | null>(null);
  const spokenMessageIdsRef = useRef<Set<string>>(new Set());

  const myLanguage = SUPPORTED_LANGUAGES.find(l => l.code === language);
  const theirLanguage = SUPPORTED_LANGUAGES.find(l => l.code === partnerLanguage);

  const azureLanguageMap: Record<string, string> = {
    'en': 'en-US', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE',
    'it': 'it-IT', 'pt': 'pt-PT', 'ru': 'ru-RU', 'ja': 'ja-JP',
    'ko': 'ko-KR', 'zh': 'zh-CN', 'ar': 'ar-SA', 'hi': 'hi-IN',
    'nl': 'nl-NL', 'pl': 'pl-PL', 'tr': 'tr-TR',
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

  const speakText = async (text: string, languageCode: string, messageId: string) => {
    if (spokenMessageIdsRef.current.has(messageId)) {
      return;
    }
    
    spokenMessageIdsRef.current.add(messageId);
    
    try {
      const { token, region } = await getAzureToken();
      
      const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
      speechConfig.speechSynthesisLanguage = azureLanguageMap[languageCode] || 'en-US';
      
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
      const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);
      
      synthesizer.speakTextAsync(
        text,
        (result) => {
          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            console.log('[TTS] Audio played successfully');
          }
          synthesizer.close();
        },
        (error) => {
          console.error('[TTS] Error:', error);
          synthesizer.close();
        }
      );
    } catch (error) {
      console.error('[TTS] Failed to speak text:', error);
    }
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
        setShowShareDialog(false);
        toast({
          title: "Partner Joined",
          description: "Your conversation partner has joined the room",
        });
      }

      if (message.type === "transcription") {
        const isOwn = message.speaker === role;
        if (isOwn) {
          setIsSpeaking(false);
        } else {
          setPartnerSpeaking(false);
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
        } else {
          setPartnerMessages(prev => [...prev, newMessage]);
          speakText(message.translatedText, language, messageId);
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
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [roomId, language, role, toast, setLocation]);

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
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000" />
      
      {/* Header */}
      <header className="h-20 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between px-6 md:px-12 relative z-10 pt-20">
        <div className="flex items-center gap-4">
          <ConnectionStatus status={connectionStatus} latency={connectionStatus === "connected" ? 45 : undefined} />
        </div>
        
        <div className="flex items-center gap-3">
          {myLanguage && theirLanguage ? (
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-slate-700">
              <div className="flex items-center gap-2">
                <img 
                  src={`https://flagcdn.com/w40/${myLanguage.countryCode.toLowerCase()}.png`}
                  width="28"
                  height="21"
                  alt={myLanguage.code}
                  className="rounded border border-slate-600"
                />
                <span className="font-semibold text-sm text-white">{myLanguage.name}</span>
              </div>
              <ArrowLeftRight className="h-4 w-4 text-slate-400" />
              <div className="flex items-center gap-2">
                <img 
                  src={`https://flagcdn.com/w40/${theirLanguage.countryCode.toLowerCase()}.png`}
                  width="28"
                  height="21"
                  alt={theirLanguage.code}
                  className="rounded border border-slate-600"
                />
                <span className="font-semibold text-sm text-white">{theirLanguage.name}</span>
              </div>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700">
              <span className="text-sm text-slate-400">Waiting for partner...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-300 hover:text-white border-slate-700 hover:bg-slate-800/50"
            data-testid="button-settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
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
      </header>

      {/* Main Translation Panels */}
      <main className="flex-1 overflow-hidden p-6 md:p-12 relative z-10">
        <div className="h-full grid md:grid-cols-2 gap-6 md:gap-8 max-w-7xl mx-auto">
          <TranscriptionPanel
            title="You"
            isActive={isSpeaking}
            messages={myMessages}
            isSpeaking={isSpeaking}
          />
          <TranscriptionPanel
            title="Partner"
            isActive={partnerSpeaking}
            messages={partnerMessages}
            isSpeaking={partnerSpeaking}
          />
        </div>
      </main>

      {/* Footer Controls */}
      <footer className="h-24 border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-xl flex items-center justify-center gap-6 px-6 relative z-10">
        {!conversationStarted && connectionStatus === "connected" ? (
          <div className="flex flex-col items-center gap-3">
            <Button
              size="lg"
              onClick={startConversation}
              className="h-14 px-10 text-base bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/25"
              data-testid="button-start-conversation"
            >
              <Mic className="h-5 w-5 mr-2" />
              Start Conversation
            </Button>
            <p className="text-xs text-slate-400">
              Click to enable microphone and begin speaking
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-6">
            <Button
              size="lg"
              variant={isMuted ? "secondary" : "default"}
              onClick={toggleMute}
              className={`h-16 w-16 rounded-full shadow-lg ${
                !isMuted ? "bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-primary/25" : ""
              }`}
              data-testid="button-toggle-mic"
            >
              {isMuted ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
            </Button>
            <div className="text-center">
              <div className="font-semibold text-base text-white">
                {isMuted ? "Microphone Off" : partnerConnected ? "Ready to speak" : "Waiting for partner"}
              </div>
              <div className="text-sm text-slate-400">
                {isMuted ? "Click to unmute" : "Click to mute"}
              </div>
            </div>
          </div>
        )}
      </footer>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-share-link">
          <DialogHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                <Share2 className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div>
              <DialogTitle className="text-2xl">Share Room Link</DialogTitle>
              <DialogDescription className="text-base mt-2">
                Send this link to your conversation partner to start translating
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Room Link</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/join/${roomId}`}
                  className="font-mono text-sm bg-muted/50"
                  data-testid="input-share-link"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="shrink-0 hover-elevate active-elevate-2"
                  data-testid="button-copy-link"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {copied ? "Link copied to clipboard!" : "Click to copy the link"}
              </p>
            </div>
            <Button
              onClick={() => setShowShareDialog(false)}
              className="w-full h-12 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/25"
              data-testid="button-start-conversation"
            >
              <Mic className="mr-2 h-5 w-5" />
              Start Conversation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
