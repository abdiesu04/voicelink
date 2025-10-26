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
        "bg-slate-900/50 backdrop-blur-sm border-2",
        isActive 
          ? isUser 
            ? "border-primary shadow-xl shadow-primary/20" 
            : "border-accent shadow-xl shadow-accent/20"
          : "border-slate-800/50"
      )}
      data-testid={`panel-transcription-${title.toLowerCase()}`}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between p-6 border-b border-slate-800/50",
        isUser ? "bg-primary/5" : "bg-accent/5"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center",
            isUser 
              ? "bg-primary/20 ring-1 ring-primary/30" 
              : "bg-accent/20 ring-1 ring-accent/30"
          )}>
            {isUser ? (
              <Mic className={cn("h-5 w-5", "text-primary")} />
            ) : (
              <Volume2 className={cn("h-5 w-5", "text-accent")} />
            )}
          </div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
        </div>
        
        {isSpeaking && (
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full border",
            isUser 
              ? "bg-primary/20 border-primary/30 text-primary" 
              : "bg-accent/20 border-accent/30 text-accent"
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
                ? "bg-primary/10 ring-primary/20" 
                : "bg-accent/10 ring-accent/20"
            )}>
              <Mic className="h-10 w-10 text-slate-600" />
            </div>
            <p className="text-sm text-slate-400 font-medium">
              Waiting for conversation to start...
            </p>
            <p className="text-xs text-slate-600 mt-2">
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
                      ? "bg-primary/10 border-primary/30"
                      : "bg-accent/10 border-accent/30"
                  )}
                >
                  <p className="text-base leading-relaxed font-medium text-white">
                    {message.originalText}
                  </p>
                </div>
                
                {/* Translation */}
                <div className={cn(
                  "pl-6 border-l-4 rounded-l-sm",
                  message.isOwn ? "border-primary/50" : "border-accent/50"
                )}>
                  <p className="text-sm text-slate-400 italic leading-relaxed">
                    {message.translatedText}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      
      {/* Footer Stats */}
      <div className="px-6 py-3 border-t border-slate-800/50 bg-slate-950/50">
        <p className="text-xs text-slate-500 text-center">
          {messages.length} {messages.length === 1 ? 'message' : 'messages'}
        </p>
      </div>
    </div>
  );
}
