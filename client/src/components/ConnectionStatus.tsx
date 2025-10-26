import { Signal, SignalHigh, SignalLow, SignalMedium } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ConnectionStatusProps {
  status: "connected" | "connecting" | "disconnected";
  latency?: number;
}

export function ConnectionStatus({ status, latency }: ConnectionStatusProps) {
  const getStatusColor = () => {
    if (status === "connected") return "bg-status-online";
    if (status === "connecting") return "bg-status-away";
    return "bg-status-busy";
  };

  const getStatusText = () => {
    if (status === "connected") return "Connected";
    if (status === "connecting") return "Connecting...";
    return "Disconnected";
  };

  const getSignalIcon = () => {
    if (!latency || status !== "connected") return <Signal className="h-3 w-3" />;
    if (latency < 100) return <SignalHigh className="h-3 w-3" />;
    if (latency < 300) return <SignalMedium className="h-3 w-3" />;
    return <SignalLow className="h-3 w-3" />;
  };

  return (
    <div className="flex items-center gap-2" data-testid="status-connection">
      <div className={`h-2 w-2 rounded-full ${getStatusColor()}`} />
      <span className="text-sm font-medium">{getStatusText()}</span>
      {status === "connected" && latency && (
        <Badge variant="secondary" className="gap-1 text-xs">
          {getSignalIcon()}
          <span>{latency}ms</span>
        </Badge>
      )}
    </div>
  );
}
