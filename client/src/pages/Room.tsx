import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { Mic, MicOff, PhoneOff, Copy, Check, Settings } from "lucide-react";
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
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [partnerSpeaking, setPartnerSpeaking] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(role === "creator");
  const [copied, setCopied] = useState(false);
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [partnerLanguage, setPartnerLanguage] = useState<string>("");

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

  const startMicrophone = async () => {
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
      startMicrophone();
    }
  };

  useEffect(() => {
    if (connectionStatus === 'connected' && isMuted) {
      startMicrophone();
    }
  }, [connectionStatus]);

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
    <div className="h-screen flex flex-col bg-background">
      <header className="h-16 border-b flex items-center justify-between px-4 md:px-8">
        <ConnectionStatus status={connectionStatus} latency={connectionStatus === "connected" ? 45 : undefined} />
        
        <div className="flex items-center gap-2 text-sm font-medium">
          {myLanguage && theirLanguage ? (
            <>
              <span className="text-lg">{myLanguage.flag}</span>
              <span>{myLanguage.name}</span>
              <span className="text-muted-foreground">↔</span>
              <span className="text-lg">{theirLanguage.flag}</span>
              <span>{theirLanguage.name}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Waiting for partner...</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="hover-elevate active-elevate-2"
            data-testid="button-settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
          <Button
            variant="destructive"
            onClick={handleEndCall}
            className="gap-2 hover-elevate active-elevate-2"
            data-testid="button-end-call"
          >
            <PhoneOff className="h-4 w-4" />
            <span className="hidden sm:inline">End</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden p-4 md:p-8">
        <div className="h-full grid md:grid-cols-2 gap-4 md:gap-8">
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

      <footer className="h-20 border-t flex items-center justify-center gap-4 px-4">
        <Button
          size="lg"
          variant={isMuted ? "secondary" : "default"}
          onClick={toggleMute}
          className="h-14 w-14 rounded-full hover-elevate active-elevate-2"
          data-testid="button-toggle-mic"
        >
          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </Button>
        <div className="text-sm text-center">
          <div className="font-medium">
            {isMuted ? "Microphone Off" : partnerConnected ? "Ready to speak" : "Waiting for partner"}
          </div>
          <div className="text-xs text-muted-foreground">
            {isMuted ? "Click to unmute" : "Click to mute"}
          </div>
        </div>
      </footer>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent data-testid="dialog-share-link">
          <DialogHeader>
            <DialogTitle>Share Room Link</DialogTitle>
            <DialogDescription>
              Send this link to your conversation partner to start translating
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Room Link</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/join/${roomId}`}
                  className="font-mono text-sm"
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
            </div>
            <Button
              onClick={() => setShowShareDialog(false)}
              className="w-full hover-elevate active-elevate-2"
              data-testid="button-start-conversation"
            >
              Start Conversation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
