"use client";

import { useState } from "react";
import { alerts as initialAlerts } from "../data/mock";
import Card from "./Card";
import StatusBadge from "./StatusBadge";
import { Check, AlertTriangle, Info, Zap } from "lucide-react";

const SEVERITY_ICON: Record<string, React.ReactNode> = {
  critical: <Zap size={14} />,
  warn:     <AlertTriangle size={14} />,
  info:     <Info size={14} />,
};

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Alerts() {
  const [list, setList] = useState(initialAlerts);
  const [filter, setFilter] = useState<"all" | "unack">("unack");

  const ack = (id: string) =>
    setList((prev) => prev.map((a) => (a.id === id ? { ...a, ack: true } : a)));

  const ackAll = () => setList((prev) => prev.map((a) => ({ ...a, ack: true })));

  const shown = filter === "all" ? list : list.filter((a) => !a.ack);
  const unackCount = list.filter((a) => !a.ack).length;

  return (
    <div className="animate-slideIn space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Critical", count: list.filter(a => a.severity === "critical").length, color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
          { label: "Warnings", count: list.filter(a => a.severity === "warn").length,     color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
          { label: "Info",     count: list.filter(a => a.severity === "info").length,      color: "#3b82f6", bg: "rgba(59,130,246,0.08)" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg p-4 text-center"
            style={{ background: s.bg, border: `1px solid ${s.color}22` }}
          >
            <div className="text-2xl font-700" style={{ color: s.color, fontFamily: "'Syne',sans-serif" }}>
              {s.count}
            </div>
            <div className="text-[10px] uppercase tracking-widest mt-1" style={{ color: s.color, opacity: 0.7 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Alerts list */}
      <Card
        title="Alert Feed"
        subtitle={`${unackCount} unacknowledged`}
        action={
          <div className="flex items-center gap-2">
            {/* Filter toggle */}
            <div className="flex rounded overflow-hidden" style={{ border: "1px solid #1e2d3d" }}>
              {(["unack", "all"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="px-2 py-1 text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                  style={{
                    background: filter === f ? "#1e2d3d" : "transparent",
                    color: filter === f ? "#f59e0b" : "#334155",
                  }}
                >
                  {f === "unack" ? "Active" : "All"}
                </button>
              ))}
            </div>
            {unackCount > 0 && (
              <button
                onClick={ackAll}
                className="text-[10px] uppercase tracking-wider px-2 py-1 rounded transition-colors cursor-pointer"
                style={{ color: "#64748b", border: "1px solid #1e2d3d" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#f59e0b")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
              >
                Ack All
              </button>
            )}
          </div>
        }
      >
        {shown.length === 0 ? (
          <div className="p-12 text-center">
            <Check size={24} style={{ color: "#10b981", margin: "0 auto 8px" }} />
            <div className="text-xs" style={{ color: "#64748b" }}>All clear — no active alerts</div>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "#1a2433" }}>
            {shown.map((alert) => (
              <div
                key={alert.id}
                className="px-4 py-4 flex gap-4 transition-colors hover:bg-[#131a22]"
                style={{ opacity: alert.ack ? 0.5 : 1 }}
              >
                {/* Severity icon */}
                <div
                  className="mt-0.5 shrink-0"
                  style={{
                    color:
                      alert.severity === "critical" ? "#ef4444"
                      : alert.severity === "warn" ? "#f59e0b"
                      : "#3b82f6",
                  }}
                >
                  {SEVERITY_ICON[alert.severity]}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="text-xs font-600" style={{ color: "#e2e8f0" }}>
                      {alert.title}
                    </span>
                    <StatusBadge status={alert.severity as "critical" | "warn" | "info"} />
                    <code
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: "#1e2d3d", color: "#64748b" }}
                    >
                      {alert.service}
                    </code>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
                    {alert.body}
                  </p>
                  <div className="text-[10px]" style={{ color: "#334155" }}>
                    {relTime(alert.ts)}
                  </div>
                </div>

                {/* Ack button */}
                {!alert.ack && (
                  <button
                    onClick={() => ack(alert.id)}
                    className="shrink-0 mt-0.5 transition-colors cursor-pointer"
                    style={{ color: "#334155" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#10b981")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#334155")}
                    title="Acknowledge"
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
