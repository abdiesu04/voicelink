import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Loader2, Users2, ArrowRight, Sparkles, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { VoiceGenderSelector } from "@/components/VoiceGenderSelector";
import { useToast } from "@/hooks/use-toast";
import type { VoiceGender } from "@shared/schema";

export default function JoinRoom() {
  const [, params] = useRoute("/join/:roomId");
  const [, setLocation] = useLocation();
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [selectedVoiceGender, setSelectedVoiceGender] = useState<VoiceGender | undefined>(undefined);
  
  console.log('[JoinRoom] Selected voice gender:', selectedVoiceGender);
  const [isJoining, setIsJoining] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [roomExists, setRoomExists] = useState(false);
  const { toast } = useToast();

  const roomId = params?.roomId;

  // Validate room exists
  useEffect(() => {
    const validateRoom = async () => {
      if (!roomId) {
        toast({
          title: "Invalid Room",
          description: "No room ID provided",
          variant: "destructive",
        });
        setLocation("/");
        return;
      }

      try {
        const response = await fetch(`/api/rooms/${roomId}`);
        
        if (response.status === 404) {
          toast({
            title: "Room Not Found",
            description: "This room has expired or doesn't exist. Please ask for a new invitation link.",
            variant: "destructive",
          });
          setTimeout(() => setLocation("/"), 2000);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to validate room");
        }

        setRoomExists(true);
      } catch (error) {
        console.error("[JoinRoom] Room validation error:", error);
        toast({
          title: "Room Validation Failed",
          description: "Unable to verify room. It may have expired.",
          variant: "destructive",
        });
        setTimeout(() => setLocation("/"), 2000);
      } finally {
        setIsValidating(false);
      }
    };

    validateRoom();
  }, [roomId, setLocation, toast]);

  const handleJoinRoom = () => {
    if (!roomExists) {
      toast({
        title: "Room Not Available",
        description: "This room is no longer available.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedLanguage) {
      toast({
        title: "Language Required",
        description: "Please select your preferred language",
        variant: "destructive",
      });
      return;
    }

    if (!selectedVoiceGender) {
      toast({
        title: "Voice Gender Required",
        description: "Please select your voice gender preference",
        variant: "destructive",
      });
      return;
    }

    console.log('[JoinRoom] Joining room with voice gender:', selectedVoiceGender);
    setIsJoining(true);
    setTimeout(() => {
      console.log('[JoinRoom] Navigating to room with voiceGender:', selectedVoiceGender);
      setLocation(`/room/${roomId}?role=participant&language=${selectedLanguage}&voiceGender=${selectedVoiceGender}`);
    }, 500);
  };

  // Show loading while validating room
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Validating room...</p>
        </div>
      </div>
    );
  }

  // Don't render join form if room doesn't exist
  if (!roomExists) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:72px_72px]" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" />
      
      <div className="w-full max-w-2xl relative z-10">
        <div className="text-center mb-8 space-y-3 animate-in fade-in slide-in-from-bottom duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-accent/20 to-cyan-500/20 border border-accent/30 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-accent animate-pulse" />
            <span className="text-sm font-semibold text-accent">Join Conversation</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
            You've Been Invited
          </h1>
          
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
            Select your language to join the conversation room
          </p>
        </div>

        <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-300/50 dark:border-slate-700/50 rounded-3xl p-6 md:p-8 shadow-2xl animate-in fade-in slide-in-from-bottom duration-700 delay-200">
          <div className="space-y-6">
            {/* Language Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center ring-2 ring-accent/30">
                  <Users2 className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">My Language</h2>
                  <p className="text-sm text-muted-foreground">Choose what you'll speak</p>
                </div>
              </div>
              
              <LanguageSelector
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
                disabled={isJoining}
              />
            </div>

            {/* Voice Gender Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center ring-2 ring-accent/30">
                  <Mic className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">My Voice Gender</h2>
                  <p className="text-sm text-muted-foreground">Your partner will hear this voice</p>
                </div>
              </div>
              
              <VoiceGenderSelector
                value={selectedVoiceGender}
                onValueChange={setSelectedVoiceGender}
                disabled={isJoining}
              />
            </div>

            <Button
              onClick={handleJoinRoom}
              disabled={isJoining || !selectedLanguage || !selectedVoiceGender || !roomExists}
              className="w-full h-12 text-base bg-gradient-to-r from-accent to-cyan-600 hover:from-accent/90 hover:to-cyan-600/90 shadow-lg shadow-accent/25 group disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-join"
            >
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Joining Room...
                </>
              ) : (
                <>
                  Join Conversation
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Make sure your microphone is enabled for the best experience
        </p>
      </div>
    </div>
  );
}
