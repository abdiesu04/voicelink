import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Globe2, ArrowRight, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { VoiceGenderSelector } from "@/components/VoiceGenderSelector";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RequireAuth, useAuth } from "@/lib/auth";
import type { VoiceGender } from "@shared/schema";

function CreateRoomContent() {
  const [, setLocation] = useLocation();
  const { subscription } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [selectedVoiceGender, setSelectedVoiceGender] = useState<VoiceGender | undefined>(undefined);
  const { toast } = useToast();

  const createRoomMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/rooms/create", { 
        language: selectedLanguage,
        voiceGender: selectedVoiceGender
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Room created!",
        description: "Your translation room is ready. Share the link with your conversation partner.",
        variant: "success",
      });
      setLocation(`/room/${data.roomId}?role=creator&language=${selectedLanguage}&voiceGender=${selectedVoiceGender}`);
    },
    onError: (error: any) => {
      toast({
        title: "Unable to create room",
        description: "Please try again or contact support if the problem continues.",
        variant: "destructive",
      });
    },
  });

  const handleCreateRoom = () => {
    // Check if user has credits remaining
    if (!subscription || subscription.creditsRemaining <= 0) {
      toast({
        title: "Out of minutes",
        description: "Upgrade your plan to continue translating.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedLanguage) {
      toast({
        title: "Language required",
        description: "Please select your language to continue.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedVoiceGender) {
      toast({
        title: "Voice selection required",
        description: "Please choose your voice preference to continue.",
        variant: "destructive",
      });
      return;
    }
    createRoomMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 pt-20 sm:pt-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:72px_72px]" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />

      <div className="w-full max-w-5xl relative z-10 pt-2 sm:pt-16">
        {/* Compact Header */}
        <div className="text-center mb-6 sm:mb-8 space-y-2 sm:space-y-3 animate-in fade-in slide-in-from-bottom duration-700">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
            Create Translation Room
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto px-4">
            Choose your language and voice, then share the link with your conversation partner
          </p>
        </div>

        {/* Main Card - Responsive Layout */}
        <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-300/50 dark:border-slate-700/50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl animate-in fade-in slide-in-from-bottom duration-700 delay-200">
          
          {/* Grid Layout: Stack on mobile, side-by-side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-10 mb-4 sm:mb-6 lg:mb-10">
            
            {/* Language Selection */}
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/30 flex-shrink-0">
                  <Globe2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">My Language</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">47 languages supported</p>
                </div>
              </div>
              
              <LanguageSelector
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
                disabled={createRoomMutation.isPending}
              />
            </div>

            {/* Voice Gender Selection */}
            <div className="space-y-3 sm:space-y-4 lg:space-y-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/30 flex-shrink-0">
                  <Mic className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">My Voice Gender</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Your partner will hear this voice</p>
                </div>
              </div>
              
              <VoiceGenderSelector
                value={selectedVoiceGender}
                onValueChange={setSelectedVoiceGender}
                disabled={createRoomMutation.isPending}
              />
            </div>
          </div>

          {/* Create Button */}
          <Button
            onClick={handleCreateRoom}
            disabled={createRoomMutation.isPending || !selectedLanguage || !selectedVoiceGender || !subscription || subscription.creditsRemaining <= 0}
            className="w-full h-12 sm:h-14 text-base sm:text-lg bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/25 group disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-create"
          >
            {createRoomMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                Creating Room...
              </>
            ) : subscription && subscription.creditsRemaining <= 0 ? (
              <>
                No Credits Remaining - Upgrade Plan
              </>
            ) : (
              <>
                Create Translation Room
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>

          {/* Credits Warning */}
          {subscription && subscription.creditsRemaining <= 0 && (
            <div className="mt-4 p-3 sm:p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
              <p className="text-xs sm:text-sm text-center text-destructive font-medium">
                ⚠️ You have 0 minutes remaining. Please upgrade your plan to start a translation session.
              </p>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-4 sm:mt-6 px-4">
          {subscription && subscription.creditsRemaining <= 0 
            ? "Upgrade your plan to get more translation minutes"
            : "You'll receive a shareable link to invite your conversation partner"
          }
        </p>
      </div>
    </div>
  );
}

export default function CreateRoom() {
  return (
    <RequireAuth>
      <CreateRoomContent />
    </RequireAuth>
  );
}
