import { useEffect, useRef } from "react";
import { Mic, Volume2, Languages } from "lucide-react";
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
        "bg-slate-900/30 backdrop-blur-sm border",
        isActive 
          ? isUser 
            ? "border-primary/50 shadow-lg shadow-primary/10" 
            : "border-accent/50 shadow-lg shadow-accent/10"
          : "border-slate-800/30"
      )}
      data-testid={`panel-transcription-${title.toLowerCase()}`}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between px-6 py-4 border-b border-slate-800/30"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center",
            isUser 
              ? "bg-primary/10" 
              : "bg-accent/10"
          )}>
            {isUser ? (
              <Mic className={cn("h-4 w-4", "text-primary")} />
            ) : (
              <Volume2 className={cn("h-4 w-4", "text-accent")} />
            )}
          </div>
          <span className="text-sm font-medium text-slate-300">{title}</span>
        </div>
        
        {isSpeaking && (
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full",
            isUser 
              ? "bg-primary/10 text-primary" 
              : "bg-accent/10 text-accent"
          )}>
            <div className={cn(
              "h-1.5 w-1.5 rounded-full animate-pulse",
              isUser ? "bg-primary" : "bg-accent"
            )} />
            <span className="text-xs font-medium">Speaking</span>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-6 py-6" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className={cn(
              "h-16 w-16 rounded-xl flex items-center justify-center mb-4",
              isUser 
                ? "bg-primary/5" 
                : "bg-accent/5"
            )}>
              <Languages className="h-8 w-8 text-slate-700" />
            </div>
            <p className="text-sm text-slate-500 font-medium">
              {isUser ? "Your conversation will appear here" : "Partner's conversation will appear here"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300"
                data-testid={`message-${message.id}`}
              >
                {/* Original Message */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-1 w-1 rounded-full",
                      message.isOwn ? "bg-primary" : "bg-accent"
                    )} />
                    <span className="text-xs text-slate-600 uppercase tracking-wider font-medium">
                      Original
                    </span>
                  </div>
                  <div className={cn(
                    "p-4 rounded-xl",
                    message.isOwn
                      ? "bg-primary/5 border border-primary/10"
                      : "bg-accent/5 border border-accent/10"
                  )}>
                    <p className="text-base leading-relaxed text-white">
                      {message.originalText}
                    </p>
                  </div>
                </div>
                
                {/* Translation */}
                <div className="pl-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <Languages className="h-3 w-3 text-slate-600" />
                    <span className="text-xs text-slate-600 uppercase tracking-wider font-medium">
                      Translation
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-400">
                    {message.translatedText}
                  </p>
                </div>

                {/* Divider between messages */}
                {index < messages.length - 1 && (
                  <div className="pt-4">
                    <div className="h-px bg-slate-800/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
