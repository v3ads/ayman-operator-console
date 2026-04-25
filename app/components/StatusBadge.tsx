type StatusType = "online" | "warn" | "degraded" | "paused" | "err" | "ok" | "healthy" | "critical" | "info";

const CONFIG: Record<StatusType, { dot: string; text: string; bg: string; label: string }> = {
  online:   { dot: "#10b981", text: "#10b981", bg: "rgba(16,185,129,0.08)",  label: "ONLINE" },
  healthy:  { dot: "#10b981", text: "#10b981", bg: "rgba(16,185,129,0.08)",  label: "HEALTHY" },
  ok:       { dot: "#10b981", text: "#10b981", bg: "rgba(16,185,129,0.08)",  label: "OK" },
  warn:     { dot: "#f59e0b", text: "#f59e0b", bg: "rgba(245,158,11,0.08)",  label: "WARN" },
  degraded: { dot: "#f59e0b", text: "#f59e0b", bg: "rgba(245,158,11,0.08)",  label: "DEGRADED" },
  paused:   { dot: "#64748b", text: "#64748b", bg: "rgba(100,116,139,0.08)", label: "PAUSED" },
  err:      { dot: "#ef4444", text: "#ef4444", bg: "rgba(239,68,68,0.08)",   label: "ERROR" },
  critical: { dot: "#ef4444", text: "#ef4444", bg: "rgba(239,68,68,0.08)",   label: "CRITICAL" },
  info:     { dot: "#3b82f6", text: "#3b82f6", bg: "rgba(59,130,246,0.08)",  label: "INFO" },
};

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  pulse?: boolean;
}

export default function StatusBadge({ status, label, pulse }: StatusBadgeProps) {
  const cfg = CONFIG[status] ?? CONFIG.info;
  const pulseClass = status === "online" || status === "healthy" ? "status-online"
    : status === "err" || status === "critical" ? "status-alert"
    : status === "warn" || status === "degraded" ? "status-warn"
    : "";

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-600 uppercase tracking-wider"
      style={{ background: cfg.bg, color: cfg.text, letterSpacing: "0.08em" }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${pulse ? pulseClass : ""}`}
        style={{ background: cfg.dot }}
      />
      {label ?? cfg.label}
    </span>
  );
}
