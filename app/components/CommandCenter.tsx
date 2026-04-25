"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Terminal, ChevronRight, Activity, RefreshCw, Cpu, HardDrive,
  BarChart2, RotateCw, Trash2, Wifi, WifiOff, Loader2
} from "lucide-react";
import Card from "./Card";
import StatusBadge from "./StatusBadge";
// ── Config ───────────────────────────────────────────────────────────────────
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "wss://hermes.ramihost.cloud/ws";
const WS_TOKEN = process.env.NEXT_PUBLIC_WS_TOKEN ?? "ws-ayman-2026-secure";
// ── Quick commands ────────────────────────────────────────────────────────────
const quickCommands = [
  { label: "System Status",    cmd: "uptime && free -h && df -h /",       icon: "Activity"  },
  { label: "Docker PS",        cmd: "sudo docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'", icon: "BarChart2" },
  { label: "Hermes Logs",      cmd: "sudo docker logs --tail 30 hermes-agent-0rp3-hermes-gateway-1 2>&1", icon: "Terminal" },
  { label: "Alert Status",     cmd: "cat /opt/hermes-workspaces/alert-state.json | python3 -m json.tool", icon: "Activity" },
  { label: "Disk Usage",       cmd: "df -h && du -sh /opt/hermes-workspaces/*", icon: "HardDrive" },
  { label: "CPU/RAM",          cmd: "top -bn1 | head -20",                icon: "Cpu"       },
  { label: "Restart Hermes",   cmd: "cd /docker/hermes-agent-0rp3 && sudo docker compose restart", icon: "RotateCw" },
  { label: "Clear Screen",     cmd: "clear",                              icon: "Trash2"    },
];
const ICON_MAP: Record<string, React.ReactNode> = {
  Activity:  <Activity size={13} />,
  Terminal:  <Terminal size={13} />,
  Cpu:       <Cpu size={13} />,
  HardDrive: <HardDrive size={13} />,
  BarChart2: <BarChart2 size={13} />,
  RotateCw:  <RotateCw size={13} />,
  Trash2:    <Trash2 size={13} />,
};
// ── Types ─────────────────────────────────────────────────────────────────────
type ConnState = "connecting" | "connected" | "disconnected" | "error";
interface LogEntry {
  id: number;
  cmd: string;
  output: string;
  ts: string;
  status: "ok" | "err" | "running";
  duration?: string;
}
// ── ANSI strip helper ─────────────────────────────────────────────────────────
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*[mGKHF]/g, "").replace(/\r/g, "");
}
// ── Component ─────────────────────────────────────────────────────────────────
export default function CommandCenter() {
  const [input, setInput] = useState("");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [connState, setConnState] = useState<ConnState>("disconnected");
  const [currentOutput, setCurrentOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const entryIdRef = useRef(0);
  const currentCmdRef = useRef<string>("");
  const startTimeRef = useRef<number>(0);
  const outputBufRef = useRef<string>("");
  const isRunningRef = useRef(false);
  // Keep isRunningRef in sync with isRunning state
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);
  // ── WebSocket connect ──────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState <= 1) return;
    setConnState("connecting");
    const url = `${WS_URL}/?token=${encodeURIComponent(WS_TOKEN)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onopen = () => {
      setConnState("connected");
    };
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === "ready") {
          setConnState("connected");
        } else if (msg.type === "output") {
          const clean = stripAnsi(msg.data);
          outputBufRef.current += clean;
          setCurrentOutput(outputBufRef.current);
          // Auto-scroll
          requestAnimationFrame(() => {
            if (outputRef.current) {
              outputRef.current.scrollTop = outputRef.current.scrollHeight;
            }
          });
        } else if (msg.type === "done") {
          // Hermes finished responding — add to history
          const duration = ((Date.now() - startTimeRef.current) / 1000).toFixed(1) + "s";
          const finalOutput = outputBufRef.current.trim();
          const cmd = currentCmdRef.current;
          const ts = new Date().toLocaleTimeString("en-GB", { hour12: false });
          const id = ++entryIdRef.current;
          setLog(prev => [{
            id,
            cmd,
            output: finalOutput,
            ts,
            status: "ok",
            duration,
          }, ...prev.slice(0, 49)]);
          setIsRunning(false);
          isRunningRef.current = false;
        } else if (msg.type === "error") {
          setConnState("error");
          setIsRunning(false);
          isRunningRef.current = false;
        }
      } catch {}
    };
    ws.onerror = () => setConnState("error");
    ws.onclose = () => {
      setConnState("disconnected");
      setIsRunning(false);
      isRunningRef.current = false;
    };
  }, []);
  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);
  // ── Send message to Hermes AI ─────────────────────────────────────────────
  const run = useCallback((cmd: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connect();
      return;
    }
    if (isRunningRef.current) return;
    currentCmdRef.current = cmd;
    startTimeRef.current = Date.now();
    outputBufRef.current = "";
    setCurrentOutput("");
    setIsRunning(true);
    isRunningRef.current = true;
    // Show command in input field briefly
    setInput(cmd);
    // Send message to Hermes AI (no newline needed — server handles it)
    wsRef.current.send(JSON.stringify({ type: "input", data: cmd }));
    // Clear input after sending
    setTimeout(() => setInput(""), 300);
    // Safety timeout after 120s (Hermes can take a while for complex tasks)
    setTimeout(() => {
      if (isRunningRef.current) {
        setIsRunning(false);
        isRunningRef.current = false;
      }
    }, 120000);
  }, [connect]);
  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) run(input.trim());
  };
  // ── Connection indicator ───────────────────────────────────────────────────
  const connColor = {
    connected:    "#10b981",
    connecting:   "#f59e0b",
    disconnected: "#64748b",
    error:        "#ef4444",
  }[connState];
  const connLabel = {
    connected:    "Connected",
    connecting:   "Connecting…",
    disconnected: "Disconnected",
    error:        "Error",
  }[connState];
  return (
    <div className="animate-slideIn grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* ── Left: Quick Commands + Input ── */}
      <div className="lg:col-span-1 space-y-4">
        {/* Connection status */}
        <div
          className="flex items-center justify-between px-3 py-2 rounded"
          style={{ background: "#0a0f16", border: "1px solid #1e2d3d" }}
        >
          <div className="flex items-center gap-2">
            {connState === "connecting" ? (
              <Loader2 size={12} style={{ color: connColor }} className="animate-spin" />
            ) : connState === "connected" ? (
              <Wifi size={12} style={{ color: connColor }} />
            ) : (
              <WifiOff size={12} style={{ color: connColor }} />
            )}
            <span style={{ fontSize: 11, color: connColor }}>{connLabel}</span>
          </div>
          {connState !== "connected" && connState !== "connecting" && (
            <button
              onClick={connect}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors"
              style={{ background: "#131a22", color: "#f59e0b", border: "1px solid #1e2d3d" }}
            >
              <RefreshCw size={10} /> Reconnect
            </button>
          )}
        </div>
        <Card title="Quick Commands" subtitle="Click to ask Rami">
          <div className="p-3 grid grid-cols-1 gap-2">
            {quickCommands.map((q) => (
              <button
                key={q.cmd}
                onClick={() => run(q.cmd)}
                disabled={connState !== "connected" || isRunning}
                className="flex items-center gap-3 px-3 py-2.5 rounded text-left transition-all duration-150 group cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#131a22", border: "1px solid #1e2d3d", color: "#94a3b8" }}
                onMouseEnter={(e) => {
                  if (connState === "connected" && !isRunning) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#f59e0b";
                    (e.currentTarget as HTMLButtonElement).style.color = "#f59e0b";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e2d3d";
                  (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
                }}
              >
                <span style={{ color: "#f59e0b" }}>{ICON_MAP[q.icon]}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-600">{q.label}</div>
                  <div className="text-[10px] truncate" style={{ color: "#334155" }}>{q.cmd}</div>
                </div>
                <ChevronRight size={11} style={{ color: "#334155" }} />
              </button>
            ))}
          </div>
        </Card>
        {/* Manual input */}
        <Card title="Chat with Rami">
          <div className="p-3">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded"
              style={{ background: "#080b0f", border: `1px solid ${connState === "connected" ? "#1e2d3d" : "#334155"}` }}
            >
              <Terminal size={12} style={{ color: "#f59e0b", flexShrink: 0 }} />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={connState === "connected" ? "Ask Rami anything…" : "Not connected…"}
                disabled={connState !== "connected" || isRunning}
                className="flex-1 bg-transparent text-xs outline-none placeholder-slate-700 disabled:opacity-50"
                style={{ color: "#e2e8f0", fontFamily: "inherit" }}
              />
              {isRunning && <Loader2 size={11} style={{ color: "#f59e0b" }} className="animate-spin shrink-0" />}
            </div>
            <p className="text-[10px] mt-2" style={{ color: "#334155" }}>
              Press Enter to send · {connLabel}
            </p>
          </div>
        </Card>
      </div>
      {/* ── Right: Live Output + History ── */}
      <div className="lg:col-span-2 space-y-4">
        {/* Live output */}
        {(isRunning || currentOutput) && (
          <Card
            title="Live Output"
            subtitle={isRunning ? `Rami is responding…` : "Last response"}mdRef.current}` : "Last command"}
          >
            <div
              ref={outputRef}
              className="p-3 overflow-auto"
              style={{ maxHeight: 320, background: "#080b0f", borderRadius: 4 }}
            >
              <pre
                className="text-[11px] whitespace-pre-wrap"
                style={{ color: "#10b981", fontFamily: "inherit", margin: 0 }}
              >
                {currentOutput || " "}
              </pre>
              {isRunning && (
                <span
                  className="inline-block w-2 h-3 ml-0.5 animate-pulse"
                  style={{ background: "#f59e0b", verticalAlign: "middle" }}
                />
              )}
            </div>
          </Card>
        )}
        {/* Command history */}
        {log.length > 0 && (
          <Card title="Command History" subtitle="This session">
            <div className="divide-y" style={{ borderColor: "#1e2d3d" }}>
              {log.map((entry) => (
                <div key={entry.id} className="px-4 py-3 hover:bg-[#131a22] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] w-14 shrink-0" style={{ color: "#334155" }}>
                      {entry.ts}
                    </span>
                    <code className="flex-1 text-xs truncate" style={{ color: "#94a3b8" }}>
                      {entry.cmd}
                    </code>
                    <span className="text-[10px] shrink-0" style={{ color: "#334155" }}>
                      {entry.duration}
                    </span>
                    <StatusBadge status={entry.status as "ok" | "err" | "warn"} />
                  </div>
                  {entry.output && (
                    <pre
                      className="mt-2 text-[10px] whitespace-pre-wrap rounded px-2 py-1.5"
                      style={{ background: "#080b0f", color: "#64748b", border: "1px solid #1e2d3d", maxHeight: 120, overflow: "auto" }}
                    >
                      {entry.output.slice(0, 800)}{entry.output.length > 800 ? "\n…" : ""}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
        {/* Empty state */}
        {!isRunning && !currentOutput && log.length === 0 && (
          <Card title="Live Output" subtitle="Session only · resets on reload">
            <div className="p-6 text-center" style={{ color: "#334155" }}>
              <Terminal size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">
                {connState === "connected"
                  ? "Run a command to see output here"
                  : "Connect to the VPS to run commands"}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
