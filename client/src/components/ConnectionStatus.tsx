import { Signal, SignalHigh, SignalLow, SignalMedium } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ConnectionStatusProps {
  status: "connected" | "connecting" | "disconnected";
  latency?: number;
  disconnectReason?: string;
  disconnectDetails?: string;
}

export function ConnectionStatus({ status, latency, disconnectReason, disconnectDetails }: ConnectionStatusProps) {
  const getStatusConfig = () => {
    if (status === "connected") {
      return {
        color: "bg-success",
        ringColor: "ring-success/20",
        bgColor: "bg-success/10",
        textColor: "text-success",
        borderColor: "border-success/20",
        text: "Connected",
      };
    }
    if (status === "connecting") {
      return {
        color: "bg-warning",
        ringColor: "ring-warning/20",
        bgColor: "bg-warning/10",
        textColor: "text-warning",
        borderColor: "border-warning/20",
        text: "Connecting...",
      };
    }
    return {
      color: "bg-destructive",
      ringColor: "ring-destructive/20",
      bgColor: "bg-destructive/10",
      textColor: "text-destructive",
      borderColor: "border-destructive/20",
      text: disconnectReason || "Disconnected",
    };
  };

  const getSignalIcon = () => {
    if (!latency || status !== "connected") return <Signal className="h-3.5 w-3.5" />;
    if (latency < 100) return <SignalHigh className="h-3.5 w-3.5 text-success" />;
    if (latency < 300) return <SignalMedium className="h-3.5 w-3.5 text-warning" />;
    return <SignalLow className="h-3.5 w-3.5 text-destructive" />;
  };

  const config = getStatusConfig();

  return (
    <div className="flex flex-col gap-1.5" data-testid="status-connection">
      <div className={cn(
        "flex items-center gap-3 px-4 py-2 rounded-xl border ring-1",
        config.bgColor,
        config.borderColor,
        config.ringColor
      )}>
        <div className="relative">
          <div className={cn(
            "h-3 w-3 rounded-full",
            config.color,
            status === "connecting" && "animate-pulse"
          )} />
          {status === "connected" && (
            <div className={cn(
              "absolute inset-0 h-3 w-3 rounded-full animate-ping",
              config.color,
              "opacity-75"
            )} />
          )}
        </div>
        <span className={cn("text-sm font-semibold", config.textColor)}>
          {config.text}
        </span>
      </div>
      
      {status === "disconnected" && disconnectDetails && (
        <div className={cn(
          "px-4 py-1.5 rounded-lg text-xs",
          "bg-destructive/5 text-destructive/80 border border-destructive/10"
        )}>
          {disconnectDetails}
        </div>
      )}
      
      {status === "connected" && latency && (
        <Badge 
          variant="secondary" 
          className="gap-2 px-3 py-1.5 text-xs font-semibold hover-elevate"
        >
          {getSignalIcon()}
          <span>{latency}ms</span>
        </Badge>
      )}
    </div>
  );
}
