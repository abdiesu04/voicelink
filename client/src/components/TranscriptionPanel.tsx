import { useEffect, useRef } from "react";
import { Mic, Volume2 } from "lucide-react";
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
  const isUser = title === "You";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      className={cn(
        "flex flex-col h-full rounded-2xl transition-all duration-300 overflow-hidden",
        "bg-card border-2",
        isActive 
          ? isUser 
            ? "border-primary shadow-xl shadow-primary/10 ring-2 ring-primary/20" 
            : "border-accent shadow-xl shadow-accent/10 ring-2 ring-accent/20"
          : "border-border/50"
      )}
      data-testid={`panel-transcription-${title.toLowerCase()}`}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between p-6 border-b",
        isUser ? "bg-gradient-to-r from-primary/5 to-transparent" : "bg-gradient-to-r from-accent/5 to-transparent"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center ring-1",
            isUser 
              ? "bg-primary/10 ring-primary/20" 
              : "bg-accent/10 ring-accent/20"
          )}>
            {isUser ? (
              <Mic className={cn("h-5 w-5", isUser ? "text-primary" : "text-accent")} />
            ) : (
              <Volume2 className={cn("h-5 w-5", isUser ? "text-primary" : "text-accent")} />
            )}
          </div>
          <h3 className="text-xl font-semibold">{title}</h3>
        </div>
        
        {isSpeaking && (
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border",
            isUser 
              ? "bg-primary/10 border-primary/20 text-primary" 
              : "bg-accent/10 border-accent/20 text-accent"
          )}>
            <div className={cn(
              "h-2 w-2 rounded-full animate-pulse",
              isUser ? "bg-primary" : "bg-accent"
            )} />
            <span className="text-xs font-semibold uppercase tracking-wide">Speaking</span>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className={cn(
              "h-20 w-20 rounded-2xl flex items-center justify-center mb-6 ring-1",
              isUser 
                ? "bg-primary/5 ring-primary/10" 
                : "bg-accent/5 ring-accent/10"
            )}>
              <Mic className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Waiting for conversation to start...
            </p>
            <p className="text-xs text-muted-foreground/60 mt-2">
              {isUser ? "Your messages will appear here" : "Partner's messages will appear here"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
                data-testid={`message-${message.id}`}
              >
                {/* Original Text */}
                <div
                  className={cn(
                    "p-4 rounded-xl border backdrop-blur-sm",
                    message.isOwn
                      ? "bg-primary/10 border-primary/20"
                      : "bg-accent/10 border-accent/20"
                  )}
                >
                  <p className="text-base leading-relaxed font-medium">
                    {message.originalText}
                  </p>
                </div>
                
                {/* Translation */}
                <div className={cn(
                  "pl-6 border-l-4 rounded-l-sm",
                  message.isOwn ? "border-primary/40" : "border-accent/40"
                )}>
                  <p className="text-sm text-muted-foreground italic leading-relaxed">
                    {message.translatedText}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      
      {/* Footer Stats */}
      <div className="px-6 py-3 border-t bg-muted/20">
        <p className="text-xs text-muted-foreground text-center">
          {messages.length} {messages.length === 1 ? 'message' : 'messages'}
        </p>
      </div>
    </div>
  );
}
