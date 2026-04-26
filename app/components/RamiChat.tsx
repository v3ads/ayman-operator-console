"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Send, Wifi, WifiOff, Loader2, RefreshCw, Bot, User } from "lucide-react";
import Card from "./Card";
// ── Config ───────────────────────────────────────────────────────────────────
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "wss://hermes.ramihost.cloud/ws";
const WS_TOKEN = process.env.NEXT_PUBLIC_WS_TOKEN ?? "ws-ayman-2026-secure";
// ── Types ─────────────────────────────────────────────────────────────────────
type ConnState = "connecting" | "connected" | "disconnected" | "error";
interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  ts: string;
  streaming?: boolean;
}
// ── Component ─────────────────────────────────────────────────────────────────
export default function RamiChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connState, setConnState] = useState<ConnState>("disconnected");
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const msgIdRef = useRef(0);
  const streamBufRef = useRef("");
  const isStreamingRef = useRef(false);
  useEffect(() => { isStreamingRef.current = isStreaming; }, [isStreaming]);
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };
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
          // Streaming token from Rami
          streamBufRef.current += msg.data;
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === "assistant" && last.streaming) {
              return [...prev.slice(0, -1), { ...last, content: streamBufRef.current }];
            }
            return prev;
          });
          scrollToBottom();
        } else if (msg.type === "done") {
          // Finalise the streaming message
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last && last.role === "assistant" && last.streaming) {
              return [...prev.slice(0, -1), { ...last, content: streamBufRef.current, streaming: false }];
            }
            return prev;
          });
          setIsStreaming(false);
          isStreamingRef.current = false;
          scrollToBottom();
        } else if (msg.type === "error") {
          setConnState("error");
          setIsStreaming(false);
          isStreamingRef.current = false;
        }
      } catch {}
    };
    ws.onerror = () => setConnState("error");
    ws.onclose = () => {
      setConnState("disconnected");
      setIsStreaming(false);
      isStreamingRef.current = false;
    };
  }, []);
  useEffect(() => {
    connect();
    return () => { wsRef.current?.close(); };
  }, [connect]);
  // ── Send message to Rami ──────────────────────────────────────────────────
  const sendMessage = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) { connect(); return; }
    if (isStreamingRef.current || !text.trim()) return;
    const ts = new Date().toLocaleTimeString("en-GB", { hour12: false });
    // Add user message
    setMessages(prev => [...prev, { id: ++msgIdRef.current, role: "user", content: text, ts }]);
    // Add placeholder for assistant response
    streamBufRef.current = "";
    setMessages(prev => [...prev, { id: ++msgIdRef.current, role: "assistant", content: "", ts, streaming: true }]);
    setIsStreaming(true);
    isStreamingRef.current = true;
    scrollToBottom();
    // Send as chat message (type: "chat") — server routes to Hermes
    wsRef.current.send(JSON.stringify({ type: "chat", data: text }));
    // Safety timeout
    setTimeout(() => {
      if (isStreamingRef.current) {
        setIsStreaming(false);
        isStreamingRef.current = false;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.streaming) return [...prev.slice(0, -1), { ...last, content: last.content || "[Timeout — no response]", streaming: false }];
          return prev;
        });
      }
    }, 120000);
  }, [connect]);
  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      sendMessage(input.trim());
      setInput("");
    }
  };
  const handleSend = () => {
    if (input.trim()) { sendMessage(input.trim()); setInput(""); }
  };
  const connColor = { connected: "#10b981", connecting: "#f59e0b", disconnected: "#64748b", error: "#ef4444" }[connState];
  const connLabel = { connected: "Connected", connecting: "Connecting…", disconnected: "Disconnected", error: "Error" }[connState];
  return (
    <div className="animate-slideIn max-w-3xl mx-auto space-y-4">
      {/* Connection status bar */}
      <div className="flex items-center justify-between px-3 py-2 rounded" style={{ background: "#0a0f16", border: "1px solid #1e2d3d" }}>
        <div className="flex items-center gap-2">
          {connState === "connecting" ? (
            <Loader2 size={12} style={{ color: connColor }} className="animate-spin" />
          ) : connState === "connected" ? (
            <Wifi size={12} style={{ color: connColor }} />
          ) : (
            <WifiOff size={12} style={{ color: connColor }} />
          )}
          <span style={{ fontSize: 11, color: connColor }}>Rami · {connLabel}</span>
        </div>
        {connState !== "connected" && connState !== "connecting" && (
          <button onClick={connect} className="flex items-center gap-1 px-2 py-1 rounded text-[10px]" style={{ background: "#131a22", color: "#f59e0b", border: "1px solid #1e2d3d" }}>
            <RefreshCw size={10} /> Reconnect
          </button>
        )}
      </div>
      {/* Chat messages */}
      <Card title="Chat with Rami" subtitle="AI operator assistant">
        <div className="flex flex-col" style={{ minHeight: 400 }}>
          <div className="flex-1 overflow-auto p-4 space-y-4" style={{ maxHeight: 520 }}>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-48 text-center" style={{ color: "#94a3b8" }}>
                <Bot size={32} className="mb-3 opacity-30" />
                <p className="text-xs">Ask Rami anything about the VPS, containers, or projects.</p>
                <p className="text-[10px] mt-1 opacity-60">Rami can run commands, check logs, and help you manage the server.</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: msg.role === "user" ? "#1e2d3d" : "#0a1628", border: `1px solid ${msg.role === "user" ? "#64748b" : "#f59e0b33"}` }}
                >
                  {msg.role === "user" ? (
                    <User size={12} style={{ color: "#94a3b8" }} />
                  ) : (
                    <Bot size={12} style={{ color: "#f59e0b" }} />
                  )}
                </div>
                {/* Bubble */}
                <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className="px-3 py-2 rounded-lg text-xs leading-relaxed"
                    style={{
                      background: msg.role === "user" ? "#1e2d3d" : "#0a1628",
                      border: `1px solid ${msg.role === "user" ? "#64748b" : "#1e2d3d"}`,
                      color: msg.role === "user" ? "#e2e8f0" : "#94a3b8",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {msg.content || (msg.streaming ? "" : "…")}
                    {msg.streaming && (
                      <span className="inline-block w-1.5 h-3 ml-0.5 animate-pulse align-middle" style={{ background: "#f59e0b" }} />
                    )}
                  </div>
                  <span className="text-[9px]" style={{ color: "#94a3b8" }}>{msg.ts}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {/* Input bar */}
          <div className="p-3 border-t" style={{ borderColor: "#1e2d3d" }}>
            <div className="flex items-center gap-2">
              <div
                className="flex-1 flex items-center gap-2 px-3 py-2 rounded"
                style={{ background: "#080b0f", border: `1px solid ${connState === "connected" ? "#1e2d3d" : "#64748b"}` }}
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={connState === "connected" ? "Ask Rami anything…" : "Not connected…"}
                  disabled={connState !== "connected" || isStreaming}
                  className="flex-1 bg-transparent text-xs outline-none placeholder-slate-500 disabled:opacity-50"
                  style={{ color: "#e2e8f0", fontFamily: "inherit" }}
                />
                {isStreaming && <Loader2 size={11} style={{ color: "#f59e0b" }} className="animate-spin shrink-0" />}
              </div>
              <button
                onClick={handleSend}
                disabled={connState !== "connected" || isStreaming || !input.trim()}
                className="flex items-center justify-center w-8 h-8 rounded transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#f59e0b", color: "#080b0f" }}
              >
                <Send size={13} />
              </button>
            </div>
            <p className="text-[10px] mt-1.5" style={{ color: "#94a3b8" }}>Press Enter or tap send · {connLabel}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
