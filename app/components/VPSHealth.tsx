"use client";
import { useEffect, useState } from "react";
import { Server, Cpu, HardDrive, Container, Shield, Globe, RefreshCw, AlertTriangle } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface VpsData {
  host: { hostname: string; os: string; kernel: string; uptime: string; publicIp: string; auditTime: string };
  cpu: { cores: number; load1: number; load5: number; load15: number };
  ram: { totalMb: number; usedMb: number; pct: number };
  disk: { total: string; used: string; pct: number };
  docker: {
    containers: { name: string; status: string; uptime: string; image: string }[];
    stats: Record<string, { cpu: string; mem: string }>;
  };
  services: { ssh: string; traefik: string; failedUnits: number };
  ssl: { domain: string; expiry: string; status: string; days: number }[];
  security: {
    securityUpdates: number;
    totalUpdates: number;
    permitRoot: string;
    passwordAuth: string;
    bannedNow: number;
    bannedTotal: number;
    topOffenders: { count: number; ip: string }[];
  };
  summary: { ok: string[]; warn: string[]; crit: string[] };
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

function pctColor(pct: number) {
  if (pct >= 90) return C.red;
  if (pct >= 70) return C.yellow;
  return C.green;
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ background: C.border, borderRadius: 2, height: 4, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, background: color, height: "100%", borderRadius: 2, transition: "width 0.5s ease" }} />
    </div>
  );
}

function MetricCard({ icon, label, value, sub, pct }: { icon: React.ReactNode; label: string; value: string; sub?: string; pct?: number }) {
  const color = pct !== undefined ? pctColor(pct) : C.green;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "12px 14px" }}>
      <div className="flex items-center gap-2 mb-2" style={{ color: C.muted }}>
        {icon}
        <span style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: pct !== undefined ? color : C.text, fontFamily: "JetBrains Mono, monospace" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>}
      {pct !== undefined && (
        <div className="mt-2">
          <Bar pct={pct} color={color} />
        </div>
      )}
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3" style={{ color: C.amber }}>
      {icon}
      <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>{title}</span>
    </div>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: ok ? C.green : C.red,
        flexShrink: 0,
      }}
    />
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function VPSHealth() {
  const [data, setData] = useState<VpsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vps", { cache: "no-store" });
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch {
      setData({ error: "Failed to fetch VPS data" } as VpsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000); // auto-refresh every 60s
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: C.muted }}>
        <RefreshCw size={16} className="animate-spin mr-2" />
        <span style={{ fontSize: 13 }}>Fetching live VPS data…</span>
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

  const { host, cpu, ram, disk, docker, services, ssl, security, summary } = data;
  const loadColor = cpu.load1 > cpu.cores * 0.8 ? C.red : cpu.load1 > cpu.cores * 0.5 ? C.yellow : C.green;

  return (
    <div style={{ color: C.text }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <div style={{ fontSize: 11, color: C.muted }}>
          <span style={{ color: C.muted }}>LAST AUDIT:</span>{" "}
          <span style={{ color: C.amber, fontFamily: "JetBrains Mono, monospace" }}>{host.auditTime}</span>
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

      {/* Host identity strip */}
      <div
        className="flex flex-wrap gap-4 mb-5 px-4 py-3 rounded"
        style={{ background: C.card, border: `1px solid ${C.border}`, fontSize: 12 }}
      >
        <span><span style={{ color: C.muted }}>HOST</span> <span style={{ color: C.amber, fontFamily: "monospace" }}>{host.hostname}</span></span>
        <span><span style={{ color: C.muted }}>OS</span> <span style={{ color: C.text }}>{host.os}</span></span>
        <span><span style={{ color: C.muted }}>KERNEL</span> <span style={{ color: C.text }}>{host.kernel}</span></span>
        <span><span style={{ color: C.muted }}>UPTIME</span> <span style={{ color: C.green }}>{host.uptime}</span></span>
        <span><span style={{ color: C.muted }}>IP</span> <span style={{ color: C.text, fontFamily: "monospace" }}>{host.publicIp}</span></span>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        {summary.crit.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", fontSize: 11, color: C.red }}>
            <AlertTriangle size={11} /> {summary.crit.length} CRITICAL
          </div>
        )}
        {summary.warn.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded" style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", fontSize: 11, color: C.yellow }}>
            <AlertTriangle size={11} /> {summary.warn.length} WARN
          </div>
        )}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", fontSize: 11, color: C.green }}>
          ✓ {summary.ok.length} OK
        </div>
      </div>

      {/* CPU / RAM / Disk metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <MetricCard
          icon={<Cpu size={12} />}
          label="CPU Load"
          value={cpu.load1.toFixed(2)}
          sub={`${cpu.cores} cores · 5m: ${cpu.load5} · 15m: ${cpu.load15}`}
          pct={Math.round((cpu.load1 / cpu.cores) * 100)}
        />
        <MetricCard
          icon={<Server size={12} />}
          label="RAM"
          value={`${ram.pct}%`}
          sub={`${ram.usedMb} MB / ${ram.totalMb} MB`}
          pct={ram.pct}
        />
        <MetricCard
          icon={<HardDrive size={12} />}
          label="Disk (/)"
          value={`${disk.pct}%`}
          sub={`${disk.used} used of ${disk.total}`}
          pct={disk.pct}
        />
        <MetricCard
          icon={<Container size={12} />}
          label="Containers"
          value={`${docker.containers.length}`}
          sub="running"
        />
      </div>

      {/* Docker containers */}
      <div className="mb-6">
        <SectionTitle icon={<Container size={13} />} title="Docker Containers" />
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
          {docker.containers.map((c, i) => {
            const stats = docker.stats[c.name];
            const shortName = c.name.replace("hermes-agent-0rp3-", "").replace("-1", "");
            return (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-2.5"
                style={{
                  borderBottom: i < docker.containers.length - 1 ? `1px solid ${C.border}` : "none",
                  background: i % 2 === 0 ? C.card : "transparent",
                  fontSize: 12,
                }}
              >
                <div className="flex items-center gap-2">
                  <StatusDot ok={c.status === "running"} />
                  <span style={{ color: C.text, fontFamily: "JetBrains Mono, monospace", fontSize: 11 }}>{shortName}</span>
                </div>
                <div className="flex items-center gap-4" style={{ color: C.muted }}>
                  {stats && (
                    <>
                      <span style={{ fontFamily: "monospace", fontSize: 11 }}>CPU {stats.cpu}</span>
                      <span style={{ fontFamily: "monospace", fontSize: 11 }}>MEM {stats.mem}</span>
                    </>
                  )}
                  <span style={{ fontSize: 10, color: C.muted }}>{c.uptime}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SSL Certificates */}
      <div className="mb-6">
        <SectionTitle icon={<Globe size={13} />} title="SSL Certificates" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ssl.map((cert, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2 rounded"
              style={{ background: C.card, border: `1px solid ${C.border}`, fontSize: 11 }}
            >
              <div className="flex items-center gap-2">
                <StatusDot ok={cert.days > 14} />
                <span style={{ color: C.text, fontFamily: "monospace" }}>{cert.domain}</span>
              </div>
              <span style={{ color: cert.days > 30 ? C.green : cert.days > 14 ? C.yellow : C.red }}>
                {cert.days}d
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="mb-6">
        <SectionTitle icon={<Shield size={13} />} title="Security" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Sec Updates</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: security.securityUpdates > 0 ? C.red : C.green, fontFamily: "monospace" }}>
              {security.securityUpdates}
            </div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Banned Now</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: security.bannedNow > 0 ? C.yellow : C.green, fontFamily: "monospace" }}>
              {security.bannedNow}
            </div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Root Login</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: security.permitRoot === "no" ? C.green : C.red, fontFamily: "monospace" }}>
              {security.permitRoot === "no" ? "DISABLED" : "ENABLED"}
            </div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Password Auth</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: security.passwordAuth === "no" ? C.green : C.red, fontFamily: "monospace" }}>
              {security.passwordAuth === "no" ? "DISABLED" : "ENABLED"}
            </div>
          </div>
        </div>
        {security.topOffenders.length > 0 && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 14px" }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Top SSH Offenders (24h)</div>
            <div className="flex flex-wrap gap-2">
              {security.topOffenders.map((o, i) => (
                <span key={i} style={{ fontFamily: "monospace", fontSize: 11, color: C.muted }}>
                  <span style={{ color: C.red }}>{o.count}×</span> {o.ip}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* OK checks */}
      {summary.ok.length > 0 && (
        <div>
          <SectionTitle icon={<Shield size={13} />} title={`All Clear — ${summary.ok.length} Checks Passed`} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {summary.ok.map((check, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.1)", fontSize: 11, color: C.muted }}>
                <span style={{ color: C.green }}>✓</span> {check}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
