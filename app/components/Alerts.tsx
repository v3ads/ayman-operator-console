"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Info, RefreshCw, Bell } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface AlertCard {
  id: string;
  severity: "critical" | "warn" | "info";
  title: string;
  body: string;
  ts: string;
  ack: boolean;
  service: string;
}

interface AlertsData {
  latest: {
    high: number;
    warn: number;
    ok: number;
    quietHours: boolean;
    emailAction: string;
    whatsappAction: string;
  };
  history: { high: number; warn: number; ok: number }[];
  alerts: AlertCard[];
  fetchedAt: string;
  error?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const C = {
  amber: "#f59e0b",
  green: "#10b981",
  red: "#ef4444",
  yellow: "#eab308",
  blue: "#3b82f6",
  muted: "#94a3b8",
  dim: "#64748b",
  border: "#1e2d3d",
  surface: "#0d1117",
  card: "#0a0f16",
  text: "#e2e8f0",
};

const SEV_CONFIG = {
  critical: { color: C.red, bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", icon: AlertTriangle, label: "CRITICAL" },
  warn: { color: C.yellow, bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.25)", icon: AlertTriangle, label: "WARN" },
  info: { color: C.blue, bg: "rgba(59,130,246,0.06)", border: "rgba(59,130,246,0.2)", icon: Info, label: "INFO" },
};

function AlertItem({ alert }: { alert: AlertCard }) {
  const cfg = SEV_CONFIG[alert.severity];
  const Icon = cfg.icon;
  const ts = new Date(alert.ts);
  const timeStr = ts.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const dateStr = ts.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

  return (
    <div
      className="flex gap-3 px-4 py-3 rounded"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, marginBottom: 8 }}
    >
      <div className="flex-shrink-0 mt-0.5">
        <Icon size={14} style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, letterSpacing: "0.06em" }}>
            {cfg.label}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{alert.title}</span>
          {alert.ack && (
            <span style={{ fontSize: 10, color: C.green, background: "rgba(16,185,129,0.1)", padding: "1px 6px", borderRadius: 3 }}>
              ACK
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 3, lineHeight: 1.5 }}>{alert.body}</div>
        <div className="flex items-center gap-3 mt-1.5" style={{ fontSize: 10, color: C.muted }}>
          <span style={{ fontFamily: "monospace" }}>{dateStr} {timeStr}</span>
          <span>SVC: {alert.service}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Alerts() {
  const [data, setData] = useState<AlertsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "critical" | "warn" | "info">("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/alerts", { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } catch {
      setData({ error: "Failed to fetch alert data" } as AlertsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: C.muted }}>
        <RefreshCw size={16} className="animate-spin mr-2" />
        <span style={{ fontSize: 13 }}>Fetching live alert data…</span>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: C.red }}>
        <AlertTriangle size={16} className="mr-2" />
        <span style={{ fontSize: 13 }}>{data?.error ?? "Unknown error"}</span>
      </div>
    );
  }

  const { latest, alerts, history } = data;
  const filtered = filter === "all" ? alerts : alerts.filter((a) => a.severity === filter);

  // History sparkline data (last 24 runs)
  const maxHigh = Math.max(...history.map((h) => h.high), 1);

  return (
    <div style={{ color: C.text }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <div style={{ fontSize: 11, color: C.muted }}>
          <span style={{ color: C.muted }}>LAST CHECK:</span>{" "}
          <span style={{ color: C.amber, fontFamily: "JetBrains Mono, monospace" }}>
            {new Date(data.fetchedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded"
          style={{ background: C.border, color: C.muted, fontSize: 11, border: `1px solid ${C.dim}`, cursor: "pointer" }}
        >
          <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div style={{ background: C.card, border: `1px solid ${latest.high > 0 ? "rgba(239,68,68,0.4)" : C.border}`, borderRadius: 6, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>HIGH Active</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: latest.high > 0 ? C.red : C.green, fontFamily: "monospace" }}>{latest.high}</div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${latest.warn > 0 ? "rgba(234,179,8,0.3)" : C.border}`, borderRadius: 6, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>WARN Active</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: latest.warn > 0 ? C.yellow : C.green, fontFamily: "monospace" }}>{latest.warn}</div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>OK Checks</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.green, fontFamily: "monospace" }}>{latest.ok}</div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 14px" }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Quiet Hours</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: latest.quietHours ? C.amber : C.muted, fontFamily: "monospace", marginTop: 4 }}>
            {latest.quietHours ? "ACTIVE" : "OFF"}
          </div>
        </div>
      </div>

      {/* Notification channel status */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded" style={{ background: C.card, border: `1px solid ${C.border}`, fontSize: 11 }}>
          <Bell size={11} style={{ color: C.amber }} />
          <span style={{ color: C.muted }}>EMAIL:</span>
          <span style={{ color: C.text }}>{latest.emailAction || "—"}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded" style={{ background: C.card, border: `1px solid ${C.border}`, fontSize: 11 }}>
          <Bell size={11} style={{ color: C.green }} />
          <span style={{ color: C.muted }}>WHATSAPP:</span>
          <span style={{ color: C.text }}>{latest.whatsappAction || "—"}</span>
        </div>
      </div>

      {/* 24h activity sparkline */}
      {history.length > 1 && (
        <div className="mb-5 px-4 py-3 rounded" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
            24h Alert History ({history.length} runs)
          </div>
          <div className="flex items-end gap-0.5" style={{ height: 32 }}>
            {history.map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${Math.max(4, (h.high / maxHigh) * 32)}px`,
                  background: h.high > 0 ? C.red : h.warn > 0 ? C.yellow : C.green,
                  borderRadius: 1,
                  opacity: 0.7,
                  minWidth: 2,
                }}
                title={`HIGH: ${h.high}, WARN: ${h.warn}, OK: ${h.ok}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1" style={{ fontSize: 9, color: C.muted }}>
            <span>24h ago</span>
            <span>now</span>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4">
        {(["all", "critical", "warn", "info"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              fontSize: 10,
              padding: "4px 10px",
              borderRadius: 4,
              border: `1px solid ${filter === f ? C.amber : C.border}`,
              background: filter === f ? "rgba(245,158,11,0.1)" : "transparent",
              color: filter === f ? C.amber : C.muted,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Alert cards */}
      {filtered.length === 0 ? (
        <div className="flex items-center justify-center py-12" style={{ color: C.muted, fontSize: 13 }}>
          <CheckCircle size={16} className="mr-2" style={{ color: C.green }} />
          No alerts in this category
        </div>
      ) : (
        filtered.map((alert) => <AlertItem key={alert.id} alert={alert} />)
      )}
    </div>
  );
}
