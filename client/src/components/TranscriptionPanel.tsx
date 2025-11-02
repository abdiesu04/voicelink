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
  interimText?: string;
}

export function TranscriptionPanel({
  title,
  isActive,
  messages,
  isSpeaking = false,
  interimText = "",
}: TranscriptionPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUser = title === "You";

  useEffect(() => {
    if (scrollRef.current) {
      // ScrollArea creates a viewport div that is the actual scrollable container
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, interimText]);

  return (
    <div
      className={cn(
        "flex flex-col h-full rounded-xl sm:rounded-2xl transition-all duration-300 overflow-hidden",
        "bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm border",
        isActive 
          ? isUser 
            ? "border-primary/50 shadow-lg shadow-primary/10" 
            : "border-accent/50 shadow-lg shadow-accent/10"
          : "border-slate-300/30 dark:border-slate-800/30"
      )}
      data-testid={`panel-transcription-${title.toLowerCase()}`}
    >
      {/* Header - Mobile Optimized */}
      <div className={cn(
        "flex items-center justify-between px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 border-b border-slate-300/30 dark:border-slate-800/30"
      )}>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={cn(
            "h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center flex-shrink-0",
            isUser 
              ? "bg-primary/10" 
              : "bg-accent/10"
          )}>
            {isUser ? (
              <Mic className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", "text-primary")} />
            ) : (
              <Volume2 className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", "text-accent")} />
            )}
          </div>
          <span className="text-sm sm:text-base font-medium text-foreground">{title}</span>
        </div>
        
        {isSpeaking && (
          <div className={cn(
            "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full",
            isUser 
              ? "bg-primary/10 text-primary" 
              : "bg-accent/10 text-accent"
          )}>
            <div className={cn(
              "h-1.5 w-1.5 rounded-full animate-pulse",
              isUser ? "bg-primary" : "bg-accent"
            )} />
            <span className="text-[10px] sm:text-xs font-medium">Speaking</span>
          </div>
        )}
      </div>

      {/* Messages Area - Mobile Optimized */}
      <ScrollArea className="flex-1 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6" ref={scrollRef}>
        {messages.length === 0 && !interimText ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className={cn(
              "h-12 w-12 sm:h-16 sm:w-16 rounded-xl flex items-center justify-center mb-3 sm:mb-4",
              isUser 
                ? "bg-primary/5" 
                : "bg-accent/5"
            )}>
              <Languages className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              {isUser ? "Your conversation will appear here" : "Partner's conversation will appear here"}
            </p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className="space-y-2 sm:space-y-3 animate-in fade-in slide-in-from-bottom-1 duration-300"
                data-testid={`message-${message.id}`}
              >
                {/* Original Message */}
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className={cn(
                      "h-1 w-1 rounded-full",
                      message.isOwn ? "bg-primary" : "bg-accent"
                    )} />
                    <span className="text-[10px] sm:text-xs text-slate-600 uppercase tracking-wider font-medium">
                      Original
                    </span>
                  </div>
                  <div className={cn(
                    "p-3 sm:p-4 rounded-lg sm:rounded-xl",
                    message.isOwn
                      ? "bg-primary/5 border border-primary/10"
                      : "bg-accent/5 border border-accent/10"
                  )}>
                    <p className="text-sm sm:text-base md:text-lg leading-relaxed text-foreground">
                      {message.originalText}
                    </p>
                  </div>
                </div>
                
                {/* Translation */}
                <div className="pl-4 sm:pl-6 space-y-1.5 sm:space-y-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Languages className="h-3 w-3 text-slate-600" />
                    <span className="text-[10px] sm:text-xs text-slate-600 uppercase tracking-wider font-medium">
                      Translation
                    </span>
                  </div>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                    {message.translatedText}
                  </p>
                </div>

                {/* Divider between messages */}
                {index < messages.length - 1 && (
                  <div className="pt-3 sm:pt-4">
                    <div className="h-px bg-border" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Interim Text Display */}
            {interimText && (
              <div className="space-y-1.5 sm:space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className={cn(
                    "h-1.5 w-1.5 rounded-full animate-pulse",
                    isUser ? "bg-primary" : "bg-accent"
                  )} />
                  <span className="text-[10px] sm:text-xs text-slate-600 uppercase tracking-wider font-medium flex items-center gap-1">
                    <Languages className="h-3 w-3 animate-pulse" />
                    Transcribing...
                  </span>
                </div>
                <div className={cn(
                  "p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-dashed",
                  isUser
                    ? "bg-primary/5 border-primary/20"
                    : "bg-accent/5 border-accent/20"
                )}>
                  <p className="text-sm sm:text-base md:text-lg leading-relaxed text-muted-foreground italic">
                    {interimText}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
