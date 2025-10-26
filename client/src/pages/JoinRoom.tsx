import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Loader2, Users, Mic, CheckCircle, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useToast } from "@/hooks/use-toast";

export default function JoinRoom() {
  const [, params] = useRoute("/join/:roomId");
  const [, setLocation] = useLocation();
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isJoining, setIsJoining] = useState(false);
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
      setLocation(`/room/${roomId}?role=participant&language=${selectedLanguage}`);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 md:p-8 relative overflow-hidden">
      {/* Dark background matching hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:72px_72px]" />
      
      {/* Floating orbs */}
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" />
      
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
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center ring-2 ring-accent/30">
                <Users className="h-7 w-7 text-accent" />
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-indigo-500/20 border border-primary/30">
                <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                <span className="text-xs font-semibold text-primary">Ready to Join</span>
              </div>
            </div>
            <div>
              <CardTitle className="text-3xl text-white">Join Translation Room</CardTitle>
              <CardDescription className="text-base mt-2 text-slate-300">
                Select your language to join the conversation
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-white">Room ID</Label>
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 font-mono text-sm break-all text-slate-200" data-testid="text-room-id">
                {roomId}
              </div>
              <p className="text-sm text-slate-400">
                You've been invited to join this conversation room
              </p>
            </div>

            <div className="space-y-4">
              <Label htmlFor="language" className="text-sm font-semibold text-white">Your Language</Label>
              <LanguageSelector
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
                disabled={isJoining}
              />
              <p className="text-sm text-slate-400 flex items-center gap-2">
                <Mic className="h-3.5 w-3.5" />
                Choose the language you'll be speaking in
              </p>
            </div>

            <Button
              onClick={handleJoinRoom}
              disabled={isJoining || !selectedLanguage}
              className="w-full h-12 text-base bg-gradient-to-r from-accent to-cyan-600 hover:from-accent/90 hover:to-cyan-600/90 shadow-lg shadow-accent/25"
              data-testid="button-join"
            >
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Joining Room...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-5 w-5" />
                  Join Conversation
                </>
              )}
            </Button>

            <div className="pt-6 border-t border-slate-700 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-300">
                  Make sure your microphone is enabled for the best experience
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-300">
                  You'll be able to start speaking once you join the room
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
