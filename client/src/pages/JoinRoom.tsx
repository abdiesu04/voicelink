import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Loader2, Users, Mic, CheckCircle } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center p-6 md:p-8 bg-gradient-to-br from-background via-background to-accent/5">
      <div className="w-full max-w-lg space-y-6">
        <Link href="/">
          <Button 
            variant="ghost" 
            className="gap-2 hover-elevate active-elevate-2" 
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <Card className="border-border/50 shadow-xl">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center ring-1 ring-accent/20">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-medium text-primary">Joining</span>
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl">Join Translation Room</CardTitle>
              <CardDescription className="text-base mt-2">
                Select your language to join the conversation
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Room ID</Label>
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50 font-mono text-sm break-all" data-testid="text-room-id">
                {roomId}
              </div>
              <p className="text-sm text-muted-foreground">
                You've been invited to join this conversation room
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="language" className="text-sm font-semibold">Your Language</Label>
              <LanguageSelector
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
                disabled={isJoining}
              />
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Mic className="h-3.5 w-3.5" />
                Choose the language you'll be speaking in
              </p>
            </div>

            <Button
              onClick={handleJoinRoom}
              disabled={isJoining || !selectedLanguage}
              className="w-full h-12 text-base hover-elevate active-elevate-2"
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

            <div className="pt-6 border-t space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Make sure your microphone is enabled for the best experience
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  You'll be able to start speaking once you join the room
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <p className="text-center text-sm text-muted-foreground">
          Powered by Azure AI for enterprise-grade translation
        </p>
      </div>
    </div>
  );
}
