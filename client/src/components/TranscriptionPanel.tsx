import { useEffect, useRef } from "react";
import { Mic } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TranscriptionMessage {
  id: string;
  originalText: string;
  translatedText: string;
  isOwn: boolean;
}

interface TranscriptionPanelProps {
  title: string;
  isActive: boolean;
  messages: TranscriptionMessage[];
  isSpeaking?: boolean;
}

export function TranscriptionPanel({
  title,
  isActive,
  messages,
  isSpeaking = false,
}: TranscriptionPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      className={cn(
        "flex flex-col h-full border rounded-lg transition-all duration-300",
        isActive && "border-primary shadow-lg"
      )}
      data-testid={`panel-transcription-${title.toLowerCase()}`}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold">{title}</h3>
        {isSpeaking && (
          <div className="flex items-center gap-2 text-primary animate-pulse">
            <Mic className="h-4 w-4" />
            <span className="text-sm font-medium">Speaking...</span>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Mic className="h-12 w-12 mb-4 opacity-20" />
            <p className="text-sm">Waiting for conversation to start...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className="space-y-2"
                data-testid={`message-${message.id}`}
              >
                <div
                  className={cn(
                    "p-3 rounded-lg",
                    message.isOwn ? "bg-primary/10" : "bg-muted"
                  )}
                >
                  <p className="text-base">{message.originalText}</p>
                </div>
                <div className="pl-4 border-l-2 border-muted">
                  <p className="text-sm text-muted-foreground italic">
                    {message.translatedText}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
