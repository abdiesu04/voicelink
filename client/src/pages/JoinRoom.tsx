import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Link href="/">
          <Button variant="ghost" className="gap-2 hover-elevate active-elevate-2" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Join Translation Room</CardTitle>
            <CardDescription>
              Select your language to join the conversation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Room ID</Label>
              <div className="p-3 rounded-lg bg-muted font-mono text-sm" data-testid="text-room-id">
                {roomId}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Your Language</Label>
              <LanguageSelector
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
                disabled={isJoining}
              />
              <p className="text-xs text-muted-foreground">
                Choose the language you'll be speaking in
              </p>
            </div>

            <Button
              onClick={handleJoinRoom}
              disabled={isJoining || !selectedLanguage}
              className="w-full hover-elevate active-elevate-2"
              data-testid="button-join"
            >
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining Room...
                </>
              ) : (
                "Join Conversation"
              )}
            </Button>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center">
                Make sure your microphone is enabled for the best experience
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
