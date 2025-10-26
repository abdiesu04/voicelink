import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Globe, Mic, CheckCircle } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center p-6 md:p-8 bg-gradient-to-br from-background via-background to-primary/5">
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
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-medium text-success">Ready</span>
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl">Create Translation Room</CardTitle>
              <CardDescription className="text-base mt-2">
                Select your language to start a new conversation room
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8">
            <div className="space-y-3">
              <Label htmlFor="language" className="text-sm font-semibold">Your Language</Label>
              <LanguageSelector
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
                disabled={createRoomMutation.isPending}
              />
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Mic className="h-3.5 w-3.5" />
                Choose the language you'll be speaking in
              </p>
            </div>

            <Button
              onClick={handleCreateRoom}
              disabled={createRoomMutation.isPending || !selectedLanguage}
              className="w-full h-12 text-base hover-elevate active-elevate-2"
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

            <div className="pt-6 border-t space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  After creating your room, you'll receive a shareable link to send to your conversation partner
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Your partner can speak in any of our 15+ supported languages
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
