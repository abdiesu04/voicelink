import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
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
            <CardTitle>Create Translation Room</CardTitle>
            <CardDescription>
              Select your language to start a new conversation room
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="language">Your Language</Label>
              <LanguageSelector
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
                disabled={createRoomMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Choose the language you'll be speaking in
              </p>
            </div>

            <Button
              onClick={handleCreateRoom}
              disabled={createRoomMutation.isPending || !selectedLanguage}
              className="w-full hover-elevate active-elevate-2"
              data-testid="button-create"
            >
              {createRoomMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Room...
                </>
              ) : (
                "Create Room"
              )}
            </Button>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center">
                After creating your room, you'll receive a shareable link to send to your conversation partner
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
