import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Globe2, ArrowRight, Sparkles, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/LanguageSelector";
import { VoiceGenderSelector } from "@/components/VoiceGenderSelector";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { VoiceGender } from "@shared/schema";

export default function CreateRoom() {
  const [, setLocation] = useLocation();
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [selectedVoiceGender, setSelectedVoiceGender] = useState<VoiceGender>("female");
  
  console.log('[CreateRoom] Selected voice gender:', selectedVoiceGender);
  const { toast } = useToast();

  const createRoomMutation = useMutation({
    mutationFn: async () => {
      console.log('[CreateRoom] Creating room with voice gender:', selectedVoiceGender);
      const response = await apiRequest("POST", "/api/rooms/create", { 
        language: selectedLanguage,
        voiceGender: selectedVoiceGender
      });
      return await response.json();
    },
    onSuccess: (data: any) => {
      console.log('[CreateRoom] Navigating to room with voiceGender:', selectedVoiceGender);
      setLocation(`/room/${data.roomId}?role=creator&language=${selectedLanguage}&voiceGender=${selectedVoiceGender}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create room. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateRoom = () => {
    if (!selectedLanguage) {
      toast({
        title: "Language Required",
        description: "Please select your preferred language",
        variant: "destructive",
      });
      return;
    }
    createRoomMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dark background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:72px_72px]" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      
      <div className="w-full max-w-2xl relative z-10 pt-20">
        <div className="text-center mb-12 space-y-6 animate-in fade-in slide-in-from-bottom duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-indigo-500/20 border border-primary/30 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-semibold text-primary">Step 1 of 2</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white">
            Choose Your Language
          </h1>
          
          <p className="text-xl text-slate-300 max-w-xl mx-auto">
            Select the language you'll be speaking in during the conversation
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 md:p-12 shadow-2xl animate-in fade-in slide-in-from-bottom duration-700 delay-200">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/30">
                  <Globe2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">My Language</h2>
                  <p className="text-sm text-slate-400">47 languages supported</p>
                </div>
              </div>
              
              <LanguageSelector
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
                disabled={createRoomMutation.isPending}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/30">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">My Voice Gender</h2>
                  <p className="text-sm text-slate-400">Your partner will hear this voice</p>
                </div>
              </div>
              
              <VoiceGenderSelector
                value={selectedVoiceGender}
                onValueChange={setSelectedVoiceGender}
                disabled={createRoomMutation.isPending}
              />
            </div>

            <Button
              onClick={handleCreateRoom}
              disabled={createRoomMutation.isPending || !selectedLanguage}
              className="w-full h-14 text-lg bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/25 group"
              data-testid="button-create"
            >
              {createRoomMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Room...
                </>
              ) : (
                <>
                  Create Translation Room
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-8">
          After creating, you'll get a link to share with your conversation partner
        </p>
      </div>
    </div>
  );
}
