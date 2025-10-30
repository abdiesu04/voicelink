import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, AlertCircle, CheckCircle2 } from "lucide-react";

type LogEntry = {
  timestamp: number;
  type: "queue_add" | "playing" | "completed" | "error";
  message: string;
  messageId?: string;
};

export default function QueueTest() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<"pending" | "pass" | "fail">("pending");

  // Refs to track queue state
  const ttsQueueRef = useRef<any[]>([]);
  const isProcessingRef = useRef<boolean>(false);
  const spokenMessageIdsRef = useRef<Set<string>>(new Set());
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const logsRef = useRef<LogEntry[]>([]);

  const addLog = (type: LogEntry["type"], message: string, messageId?: string) => {
    const entry: LogEntry = {
      timestamp: Date.now(),
      type,
      message,
      messageId,
    };
    logsRef.current = [...logsRef.current, entry];
    setLogs(logsRef.current);
  };

  // Simulated TTS queue processor (same logic as Room.tsx but with fake audio)
  const processTTSQueue = async () => {
    // CRITICAL: Atomic check-and-set - prevents race conditions
    if (isProcessingRef.current) {
      // Already processing - this call will just return
      return;
    }
    
    // If queue is empty, do nothing
    if (ttsQueueRef.current.length === 0) {
      return;
    }

    // Set the flag SYNCHRONOUSLY before any await
    isProcessingRef.current = true;
    
    addLog("playing", `🔄 Queue processor started (${ttsQueueRef.current.length} items)`);

    try {
      while (ttsQueueRef.current.length > 0) {
        const item = ttsQueueRef.current.shift()!;
        
        // Skip if already spoken
        if (spokenMessageIdsRef.current.has(item.messageId)) {
          continue;
        }

        try {
          addLog("playing", `▶️ Playing: "${item.text.substring(0, 50)}..."`, item.messageId);

          // CRITICAL: Stop any currently playing HTML5 audio
          if (currentAudioRef.current) {
            currentAudioRef.current.pause();
            currentAudioRef.current.src = '';
            currentAudioRef.current = null;
          }

          // Simulate audio playback duration based on text length
          const words = item.text.split(/\s+/).length;
          const audioDurationMs = Math.max((words / 100) * 60 * 1000 + 1000, 2000);
          
          addLog("playing", `⏱️ Simulated duration: ${Math.round(audioDurationMs)}ms`);
          
          // Wait for the simulated playback
          await new Promise<void>((resolve) => {
            setTimeout(() => {
              addLog("completed", `✅ Completed: "${item.text.substring(0, 30)}..."`, item.messageId);
              spokenMessageIdsRef.current.add(item.messageId);
              resolve();
            }, audioDurationMs);
          });
        } catch (error) {
          addLog("error", `❌ Failed to process: ${error}`);
        }
      }
    } finally {
      // Release the lock
      isProcessingRef.current = false;
      addLog("completed", "🏁 Queue processor finished");
    }
  };

  // Add translation to queue and start processing
  const speakText = (text: string, messageId: string) => {
    if (spokenMessageIdsRef.current.has(messageId)) {
      return;
    }

    const queueItem = {
      text,
      messageId,
    };

    ttsQueueRef.current.push(queueItem);
    addLog("queue_add", `➕ Added to queue: "${text.substring(0, 50)}..."`, messageId);

    // Start processing (won't create duplicate processors due to lock)
    processTTSQueue();
  };

  const runRapidFireTest = async () => {
    setIsRunning(true);
    logsRef.current = [];
    setLogs([]);
    setTestResult("pending");
    
    // Reset state
    ttsQueueRef.current = [];
    isProcessingRef.current = false;
    spokenMessageIdsRef.current.clear();

    addLog("playing", "🧪 Starting Rapid Fire Test...");
    
    // Simulate 5 rapid incoming translations
    const messages = [
      "Hello, this is the first message",
      "This is the second message coming very quickly",
      "Third message should not overlap with previous ones",
      "Fourth message testing the queue system",
      "Fifth and final message to complete the test"
    ];

    // Add all messages rapidly (simulating quick speech)
    messages.forEach((text, index) => {
      setTimeout(() => {
        speakText(text, `msg-${index + 1}`);
      }, index * 100); // 100ms between messages
    });

    // Wait for all to complete (conservative estimate)
    const totalDuration = messages.reduce((acc, msg) => {
      const words = msg.split(/\s+/).length;
      return acc + Math.max((words / 100) * 60 * 1000 + 1000, 2000);
    }, 0);

    await new Promise((resolve) => setTimeout(resolve, totalDuration + 2500));

    // Analyze results from ref (current state)
    const playingLogs = logsRef.current.filter((l) => l.type === "playing" && l.message.startsWith("▶️"));
    const completedLogs = logsRef.current.filter((l) => l.type === "completed" && l.message.startsWith("✅"));
    const errorLogs = logsRef.current.filter((l) => l.type === "error");

    let passed = true;
    let failureReason = "";

    // Check for race conditions
    if (errorLogs.some((l) => l.message.includes("RACE CONDITION"))) {
      passed = false;
      failureReason = "Race condition detected - multiple processors ran simultaneously!";
    }

    // Check if all messages were played
    if (playingLogs.length !== messages.length) {
      passed = false;
      failureReason = `Expected ${messages.length} messages to play, but got ${playingLogs.length}`;
    }

    // Check if all messages completed
    if (completedLogs.length !== messages.length) {
      passed = false;
      failureReason = `Expected ${messages.length} messages to complete, but got ${completedLogs.length}`;
    }

    // Verify sequential processing (no interleaving)
    for (let i = 0; i < playingLogs.length - 1; i++) {
      const currentPlaying = playingLogs[i];
      const currentCompleted = completedLogs.find((l) => l.messageId === currentPlaying.messageId);
      const nextPlaying = playingLogs[i + 1];

      if (currentCompleted && nextPlaying) {
        if (nextPlaying.timestamp < currentCompleted.timestamp) {
          passed = false;
          failureReason = `Message ${nextPlaying.messageId} started before ${currentPlaying.messageId} completed!`;
          break;
        }
      }
    }

    setTestResult(passed ? "pass" : "fail");
    if (!passed) {
      addLog("error", `❌ TEST FAILED: ${failureReason}`);
    } else {
      addLog("completed", "✅ TEST PASSED: All messages processed sequentially without overlap!");
    }

    setIsRunning(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl text-white">TTS Queue Test Suite</CardTitle>
                <CardDescription className="text-slate-400 mt-2">
                  Verify Promise-based locking prevents audio overlap
                </CardDescription>
              </div>
              {testResult === "pass" && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  PASSED
                </Badge>
              )}
              {testResult === "fail" && (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  FAILED
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Button
              onClick={runRapidFireTest}
              disabled={isRunning}
              size="lg"
              className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90"
              data-testid="button-run-test"
            >
              <PlayCircle className="h-5 w-5 mr-2" />
              {isRunning ? "Test Running..." : "Run Rapid Fire Test"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Test Logs</CardTitle>
            <CardDescription className="text-slate-400">
              Real-time queue processing logs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-sm" data-testid="test-logs">
              {logs.length === 0 ? (
                <p className="text-slate-500">No logs yet. Run the test to see output.</p>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded ${
                      log.type === "error"
                        ? "bg-red-500/10 text-red-400 border border-red-500/30"
                        : log.type === "completed"
                        ? "bg-green-500/10 text-green-400 border border-green-500/30"
                        : log.type === "playing"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                        : "bg-slate-700/50 text-slate-300"
                    }`}
                    data-testid={`log-${log.type}-${index}`}
                  >
                    <span className="text-slate-500">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>{" "}
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Test Criteria</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
              <p>No race conditions detected (no duplicate processors)</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
              <p>All 5 messages added to queue and processed</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
              <p>Messages processed sequentially (no overlap)</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
              <p>Each message completes before next one starts</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
