import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Globe, Mic, CheckCircle, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function CreateRoom() {
  const [, setLocation] = useLocation();
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const { toast } = useToast();

  const createRoomMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/rooms/create", { language: selectedLanguage });
      return await response.json();
    },
    onSuccess: (data: any) => {
      setLocation(`/room/${data.roomId}?role=creator&language=${selectedLanguage}`);
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
    <div className="min-h-screen flex items-center justify-center p-6 md:p-8 relative overflow-hidden">
      {/* Dark background matching hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:72px_72px]" />
      
      {/* Floating orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      
      <div className="w-full max-w-lg space-y-6 relative z-10 pt-20">
        <Link href="/">
          <Button 
            variant="ghost" 
            className="gap-2 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-800/50" 
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <Card className="border-slate-700/50 bg-slate-800/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex items-center justify-between">
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/30">
                <Globe className="h-7 w-7 text-primary" />
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-success/20 to-emerald-500/20 border border-success/30">
                <Sparkles className="h-3.5 w-3.5 text-success animate-pulse" />
                <span className="text-xs font-semibold text-success">Ready to Create</span>
              </div>
            </div>
            <div>
              <CardTitle className="text-3xl text-white">Create Translation Room</CardTitle>
              <CardDescription className="text-base mt-2 text-slate-300">
                Select your language to start a new conversation room
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <Label htmlFor="language" className="text-sm font-semibold text-white">Your Language</Label>
              <LanguageSelector
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
                disabled={createRoomMutation.isPending}
              />
              <p className="text-sm text-slate-400 flex items-center gap-2">
                <Mic className="h-3.5 w-3.5" />
                Choose the language you'll be speaking in
              </p>
            </div>

            <Button
              onClick={handleCreateRoom}
              disabled={createRoomMutation.isPending || !selectedLanguage}
              className="w-full h-12 text-base bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 shadow-lg shadow-primary/25"
              data-testid="button-create"
            >
              {createRoomMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Room...
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-5 w-5" />
                  Create Room
                </>
              )}
            </Button>

            <div className="pt-6 border-t border-slate-700 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-300">
                  After creating your room, you'll receive a shareable link to send to your conversation partner
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-300">
                  Your partner can speak in any of our 15+ supported languages
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <p className="text-center text-sm text-slate-400">
          Powered by Azure AI for enterprise-grade translation
        </p>
      </div>
    </div>
  );
}
