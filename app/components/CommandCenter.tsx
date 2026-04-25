"use client";

import { useState } from "react";
import { recentCommands, quickCommands } from "../data/mock";
import Card from "./Card";
import StatusBadge from "./StatusBadge";
import { Play, ChevronRight, RefreshCw, FileText, BarChart2, RotateCw, Trash2, Terminal } from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  RefreshCw: <RefreshCw size={13} />,
  Play:      <Play size={13} />,
  FileText:  <FileText size={13} />,
  BarChart2: <BarChart2 size={13} />,
  RotateCw:  <RotateCw size={13} />,
  Trash2:    <Trash2 size={13} />,
};

export default function CommandCenter() {
  const [input, setInput] = useState("");
  const [log, setLog] = useState<Array<{ cmd: string; output: string; ts: string }>>([]);

  const run = (cmd: string) => {
    const ts = new Date().toLocaleTimeString("en-GB", { hour12: false });
    const output = `[${ts}] ▶ ${cmd}\n→ Command queued (no backend connected yet)`;
    setLog((prev) => [{ cmd, output, ts }, ...prev]);
    setInput("");
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) run(input.trim());
  };

  return (
    <div className="animate-slideIn grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Quick Commands */}
      <div className="lg:col-span-1 space-y-4">
        <Card title="Quick Commands" subtitle="Click to enqueue">
          <div className="p-3 grid grid-cols-1 gap-2">
            {quickCommands.map((q) => (
              <button
                key={q.cmd}
                onClick={() => run(q.cmd)}
                className="flex items-center gap-3 px-3 py-2.5 rounded text-left transition-all duration-150 group cursor-pointer"
                style={{
                  background: "#131a22",
                  border: "1px solid #1e2d3d",
                  color: "#94a3b8",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#f59e0b";
                  (e.currentTarget as HTMLButtonElement).style.color = "#f59e0b";
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
        <Card title="Terminal Input">
          <div className="p-3">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded"
              style={{ background: "#080b0f", border: "1px solid #1e2d3d" }}
            >
              <Terminal size={12} style={{ color: "#f59e0b", flexShrink: 0 }} />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="hermes ..."
                className="flex-1 bg-transparent text-xs outline-none placeholder-slate-700"
                style={{ color: "#e2e8f0", fontFamily: "inherit" }}
              />
            </div>
            <p className="text-[10px] mt-2" style={{ color: "#334155" }}>
              Press Enter to queue · No backend connected
            </p>
          </div>
        </Card>
      </div>

      {/* Command Log */}
      <div className="lg:col-span-2 space-y-4">
        {/* Live output */}
        {log.length > 0 && (
          <Card title="Live Output" subtitle="Session only · resets on reload">
            <div className="p-3 space-y-2">
              {log.map((entry, i) => (
                <div
                  key={i}
                  className="p-2 rounded text-[11px] whitespace-pre-wrap"
                  style={{ background: "#080b0f", border: "1px solid #1e2d3d", color: "#10b981", fontFamily: "inherit" }}
                >
                  {entry.output}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* History */}
        <Card title="Recent Commands" subtitle="Last 24 hours">
          <div className="divide-y" style={{ borderColor: "#1e2d3d" }}>
            {recentCommands.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[#131a22] transition-colors"
              >
                <span className="text-[10px] w-14 shrink-0" style={{ color: "#334155" }}>
                  {c.ts}
                </span>
                <code
                  className="flex-1 text-xs truncate"
                  style={{ color: "#94a3b8" }}
                >
                  {c.cmd}
                </code>
                <span className="text-[10px] shrink-0" style={{ color: "#334155" }}>
                  {c.duration}
                </span>
                <StatusBadge
                  status={c.status as "ok" | "err" | "warn"}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
