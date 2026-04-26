"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Terminal, ChevronRight, Activity, RefreshCw, Cpu, HardDrive,
  BarChart2, RotateCw, Square, Wifi, WifiOff, Loader2, MessageCircle, Globe
} from "lucide-react";
import Card from "./Card";
import StatusBadge from "./StatusBadge";
// ── Config ───────────────────────────────────────────────────────────────────
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "wss://hermes.ramihost.cloud/ws";
const WS_TOKEN = process.env.NEXT_PUBLIC_WS_TOKEN ?? "ws-ayman-2026-secure";
// ── Quick commands ────────────────────────────────────────────────────────────
const quickCommands = [
  { label: "System Status",         cmd: "uptime && free -h && df -h /",       icon: "Activity",  group: "system" },
  { label: "Docker PS",             cmd: "docker ps --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'", icon: "BarChart2", group: "system" },
  { label: "Hermes Logs",           cmd: "docker logs --tail 50 hermes-agent-0rp3-hermes-gateway-1 2>&1", icon: "Terminal",  group: "system" },
  { label: "Disk Usage",            cmd: "df -h && du -sh /opt/hermes-workspaces/*", icon: "HardDrive", group: "system" },
  { label: "CPU / RAM",             cmd: "top -bn1 | head -20",                icon: "Cpu",       group: "system" },
  { label: "Restart Hermes Web",    cmd: "docker restart hermes-agent-0rp3-hermes-agent-1",   icon: "RotateCw",  group: "hermes" },
  { label: "Stop Hermes Web",       cmd: "docker stop hermes-agent-0rp3-hermes-agent-1",     icon: "StopWeb",   group: "hermes" },
  { label: "Restart Hermes WA",     cmd: "docker restart hermes-agent-0rp3-hermes-gateway-1", icon: "RotateCwWA", group: "hermes" },
  { label: "Stop Hermes WA",        cmd: "docker stop hermes-agent-0rp3-hermes-gateway-1",   icon: "StopWA",    group: "hermes" },
];
const ICON_MAP: Record<string, React.ReactNode> = {
  Activity:   <Activity size={13} />,
  Terminal:   <Terminal size={13} />,
  Cpu:        <Cpu size={13} />,
  HardDrive:  <HardDrive size={13} />,
  BarChart2:  <BarChart2 size={13} />,
  RotateCw:   <RotateCw size={13} />,
  StopWeb:    <Square size={13} />,
  RotateCwWA: <MessageCircle size={13} />,
  StopWA:     <Square size={13} />,
};
const GROUP_COLOR: Record<string, string> = {
  system: "#f59e0b",
  hermes: "#10b981",
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
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  // ── WebSocket connect ──────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState <= 1) return;
    setConnState("connecting");
    const url = `${WS_URL}/?token=${encodeURIComponent(WS_TOKEN)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onopen = () => setConnState("connected");
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === "ready") {
          setConnState("connected");
        } else if (msg.type === "output") {
          const clean = stripAnsi(msg.data);
          outputBufRef.current += clean;
          setCurrentOutput(outputBufRef.current);
          requestAnimationFrame(() => {
            if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
          });
        } else if (msg.type === "done") {
          const duration = ((Date.now() - startTimeRef.current) / 1000).toFixed(1) + "s";
          const finalOutput = outputBufRef.current.trim();
          const cmd = currentCmdRef.current;
          const ts = new Date().toLocaleTimeString("en-GB", { hour12: false });
          const id = ++entryIdRef.current;
          setLog(prev => [{ id, cmd, output: finalOutput, ts, status: "ok", duration }, ...prev.slice(0, 49)]);
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
    return () => { wsRef.current?.close(); };
  }, [connect]);
  // ── Run a shell command ───────────────────────────────────────────────────
  const run = useCallback((cmd: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) { connect(); return; }
    if (isRunningRef.current) return;
    currentCmdRef.current = cmd;
    startTimeRef.current = Date.now();
    outputBufRef.current = "";
    setCurrentOutput("");
    setIsRunning(true);
    isRunningRef.current = true;
    setInput(cmd);
    // Send as shell command
    wsRef.current.send(JSON.stringify({ type: "input", data: cmd }));
    setTimeout(() => setInput(""), 300);
    setTimeout(() => {
      if (isRunningRef.current) { setIsRunning(false); isRunningRef.current = false; }
    }, 60000);
  }, [connect]);
  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) run(input.trim());
  };
  const connColor = { connected: "#10b981", connecting: "#f59e0b", disconnected: "#64748b", error: "#ef4444" }[connState];
  const connLabel = { connected: "Connected", connecting: "Connecting…", disconnected: "Disconnected", error: "Error" }[connState];
  return (
    <div className="animate-slideIn grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* ── Left: Quick Commands + Input ── */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center justify-between px-3 py-2 rounded" style={{ background: "#0a0f16", border: "1px solid #1e2d3d" }}>
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
            <button onClick={connect} className="flex items-center gap-1 px-2 py-1 rounded text-[10px]" style={{ background: "#131a22", color: "#f59e0b", border: "1px solid #1e2d3d" }}>
              <RefreshCw size={10} /> Reconnect
            </button>
          )}
        </div>
        <Card title="Quick Commands" subtitle="Click to execute">
          <div className="p-3 grid grid-cols-1 gap-2">
            {quickCommands.map((q) => (
              <button
                key={q.label}
                onClick={() => run(q.cmd)}
                disabled={isRunning || connState !== "connected"}
                className="flex items-center gap-3 px-3 py-2.5 rounded text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#0a0f16", border: "1px solid #1e2d3d", color: "#94a3b8" }}
                onMouseEnter={(e) => {
                  if (!isRunning && connState === "connected") {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#f59e0b";
                    (e.currentTarget as HTMLButtonElement).style.color = "#e2e8f0";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e2d3d";
                  (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
                }}
              >
                <span style={{ color: GROUP_COLOR[q.group] ?? "#f59e0b" }}>{ICON_MAP[q.icon]}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-600">{q.label}</div>
                  <div className="text-[10px] truncate" style={{ color: "#334155" }}>{q.cmd}</div>
                </div>
                <ChevronRight size={11} style={{ color: "#334155" }} />
              </button>
            ))}
          </div>
        </Card>
        {/* Terminal Input */}
        <Card title="Terminal Input">
          <div className="p-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded" style={{ background: "#080b0f", border: `1px solid ${connState === "connected" ? "#1e2d3d" : "#334155"}` }}>
              <Terminal size={12} style={{ color: "#f59e0b", flexShrink: 0 }} />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={connState === "connected" ? "hermes ..." : "Not connected…"}
                disabled={connState !== "connected" || isRunning}
                className="flex-1 bg-transparent text-xs outline-none placeholder-slate-700 disabled:opacity-50"
                style={{ color: "#e2e8f0", fontFamily: "inherit" }}
              />
              {isRunning && <Loader2 size={11} style={{ color: "#f59e0b" }} className="animate-spin shrink-0" />}
            </div>
            <p className="text-[10px] mt-2" style={{ color: "#334155" }}>Press Enter to execute · {connLabel}</p>
          </div>
        </Card>
      </div>
      {/* ── Right: Live Output + History ── */}
      <div className="lg:col-span-2 space-y-4">
        {(isRunning || currentOutput) && (
          <Card title="Live Output" subtitle={isRunning ? "Running…" : "Last command"}>
            <div ref={outputRef} className="p-3 overflow-auto" style={{ maxHeight: 320, background: "#080b0f", borderRadius: 4 }}>
              <pre className="text-[11px] whitespace-pre-wrap" style={{ color: "#10b981", fontFamily: "inherit", margin: 0 }}>
                {currentOutput || " "}
              </pre>
              {isRunning && <span className="inline-block w-2 h-3 ml-0.5 animate-pulse" style={{ background: "#f59e0b", verticalAlign: "middle" }} />}
            </div>
          </Card>
        )}
        {log.length > 0 && (
          <Card title="Command History" subtitle="This session">
            <div className="divide-y" style={{ borderColor: "#1e2d3d" }}>
              {log.map((entry) => (
                <div key={entry.id} className="px-4 py-3 hover:bg-[#131a22] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] w-14 shrink-0" style={{ color: "#334155" }}>{entry.ts}</span>
                    <code className="flex-1 text-xs truncate" style={{ color: "#94a3b8" }}>{entry.cmd}</code>
                    <span className="text-[10px] shrink-0" style={{ color: "#334155" }}>{entry.duration}</span>
                    <StatusBadge status={entry.status as "ok" | "err" | "warn"} />
                  </div>
                  {entry.output && (
                    <pre className="mt-2 text-[10px] whitespace-pre-wrap rounded px-2 py-1.5" style={{ background: "#080b0f", color: "#64748b", border: "1px solid #1e2d3d", maxHeight: 120, overflow: "auto" }}>
                      {entry.output.slice(0, 800)}{entry.output.length > 800 ? "\n…" : ""}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}
        {!isRunning && !currentOutput && log.length === 0 && (
          <Card title="Live Output" subtitle="Session only · resets on reload">
            <div className="p-6 text-center" style={{ color: "#334155" }}>
              <Terminal size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs">{connState === "connected" ? "Run a command to see output here" : "Connect to the VPS to run commands"}</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
