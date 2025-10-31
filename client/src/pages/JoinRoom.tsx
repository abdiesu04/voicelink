import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Loader2, Users2, ArrowRight, Sparkles, Copy, Check, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { VoiceGenderSelector } from "@/components/VoiceGenderSelector";
import { useToast } from "@/hooks/use-toast";
import type { VoiceGender } from "@shared/schema";

export default function JoinRoom() {
  const [, params] = useRoute("/join/:roomId");
  const [, setLocation] = useLocation();
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [selectedVoiceGender, setSelectedVoiceGender] = useState<VoiceGender>("male");
  
  console.log('[JoinRoom] Selected voice gender:', selectedVoiceGender);
  const [isJoining, setIsJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const roomId = params?.roomId;

  useEffect(() => {
    if (!roomId) {
      toast({
        title: "Invalid Room",
        description: "No room ID provided",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [roomId, setLocation, toast]);

  const handleJoinRoom = () => {
    if (!selectedLanguage) {
      toast({
        title: "Language Required",
        description: "Please select your preferred language",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    setTimeout(() => {
      setLocation(`/room/${roomId}?role=participant&language=${selectedLanguage}&voiceGender=${selectedVoiceGender}`);
    }, 500);
  };

  const handleCopyRoomId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dark background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:72px_72px]" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" />
      
      <div className="w-full max-w-2xl relative z-10 pt-20">
        <div className="text-center mb-12 space-y-6 animate-in fade-in slide-in-from-bottom duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-accent/20 to-cyan-500/20 border border-accent/30 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-accent animate-pulse" />
            <span className="text-sm font-semibold text-accent">Join Conversation</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white">
            You've Been Invited
          </h1>
          
          <p className="text-xl text-slate-300 max-w-xl mx-auto">
            Select your language to join the conversation room
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 md:p-12 shadow-2xl animate-in fade-in slide-in-from-bottom duration-700 delay-200">
          <div className="space-y-8">
            {/* Room ID Display */}
            <div className="p-6 bg-slate-900/50 rounded-2xl border border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Room ID</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyRoomId}
                  className="h-8 px-3 text-slate-400 hover:text-white"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-1.5" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="font-mono text-lg text-white break-all" data-testid="text-room-id">
                {roomId}
              </p>
            </div>

            {/* Language Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center ring-2 ring-accent/30">
                  <Users2 className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">My Language</h2>
                  <p className="text-sm text-slate-400">Choose what you'll speak</p>
                </div>
              </div>
              
              <LanguageSelector
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
                disabled={isJoining}
              />
            </div>

            {/* Voice Gender Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center ring-2 ring-accent/30">
                  <Mic className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">My Voice Gender</h2>
                  <p className="text-sm text-slate-400">Your partner will hear this voice</p>
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
              disabled={isJoining || !selectedLanguage}
              className="w-full h-14 text-lg bg-gradient-to-r from-accent to-cyan-600 hover:from-accent/90 hover:to-cyan-600/90 shadow-lg shadow-accent/25 group"
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

        <p className="text-center text-sm text-slate-500 mt-8">
          Make sure your microphone is enabled for the best experience
        </p>
      </div>
    </div>
  );
}
