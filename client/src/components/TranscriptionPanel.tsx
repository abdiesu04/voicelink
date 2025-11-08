import { useEffect, useRef } from "react";
import { Mic, Volume2, Languages, Sparkles } from "lucide-react";
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
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, interimText]);

  return (
    <div
      className={cn(
        "flex flex-col h-full rounded-2xl transition-all duration-300 overflow-hidden",
        "bg-white dark:bg-slate-900 border-2",
        isActive 
          ? isUser 
            ? "border-primary shadow-xl shadow-primary/20" 
            : "border-accent shadow-xl shadow-accent/20"
          : "border-slate-200 dark:border-slate-800 shadow-lg"
      )}
      data-testid={`panel-transcription-${title.toLowerCase()}`}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between px-6 py-4 border-b-2",
        isActive 
          ? isUser 
            ? "bg-gradient-to-r from-primary/10 to-indigo-500/5 border-primary/20" 
            : "bg-gradient-to-r from-accent/10 to-purple-500/5 border-accent/20"
          : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm",
            isUser 
              ? "bg-gradient-to-br from-primary to-indigo-600" 
              : "bg-gradient-to-br from-accent to-purple-600"
          )}>
            {isUser ? (
              <Mic className="h-5 w-5 text-white" />
            ) : (
              <Volume2 className="h-5 w-5 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'}
            </p>
          </div>
        </div>
        
        {isSpeaking && (
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm",
            isUser 
              ? "bg-primary text-white" 
              : "bg-accent text-white"
          )}>
            <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-semibold">Speaking</span>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-6 space-y-6">
          {messages.length === 0 && !interimText ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <div className={cn(
                "h-20 w-20 rounded-2xl flex items-center justify-center mb-4",
                isUser 
                  ? "bg-gradient-to-br from-primary/10 to-indigo-500/5" 
                  : "bg-gradient-to-br from-accent/10 to-purple-500/5"
              )}>
                <Languages className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-base font-medium text-muted-foreground max-w-xs">
                {isUser ? "Your conversation will appear here" : "Partner's conversation will appear here"}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-2">
                Start speaking to begin
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500"
                  data-testid={`message-${message.id}`}
                >
                  {/* Original Message - Large and prominent */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        message.isOwn ? "bg-primary" : "bg-accent"
                      )} />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Original
                      </span>
                    </div>
                    <div className={cn(
                      "p-5 rounded-xl shadow-sm border-2",
                      message.isOwn
                        ? "bg-gradient-to-br from-primary/5 to-indigo-500/5 border-primary/20"
                        : "bg-gradient-to-br from-accent/5 to-purple-500/5 border-accent/20"
                    )}>
                      <p className="text-lg leading-relaxed font-medium text-foreground">
                        {message.originalText}
                      </p>
                    </div>
                  </div>
                  
                  {/* Translation - Slightly smaller but still readable */}
                  <div className="pl-8 space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className={cn(
                        "h-3.5 w-3.5",
                        message.isOwn ? "text-primary" : "text-accent"
                      )} />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Translation
                      </span>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <p className="text-base leading-relaxed text-muted-foreground">
                        {message.translatedText}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Interim Text Display - Live transcription */}
              {interimText && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-2 w-2 rounded-full animate-pulse",
                      isUser ? "bg-primary" : "bg-accent"
                    )} />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Languages className="h-3.5 w-3.5 animate-pulse" />
                      Transcribing...
                    </span>
                  </div>
                  <div className={cn(
                    "p-5 rounded-xl border-2 border-dashed",
                    isUser
                      ? "bg-primary/5 border-primary/30"
                      : "bg-accent/5 border-accent/30"
                  )}>
                    <p className="text-lg leading-relaxed text-muted-foreground italic font-medium">
                      {interimText}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
