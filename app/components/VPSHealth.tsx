"use client";

import { vpsHealth, services, cpuHistory, ramHistory } from "../data/mock";
import Card from "./Card";
import StatusBadge from "./StatusBadge";

function MiniGraph({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values);
  const h = 36;
  const w = 120;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => `${i * step},${h - (v / max) * h}`).join(" ");

  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        points={pts}
        opacity="0.8"
      />
      {/* Area fill */}
      <polyline
        fill={color}
        fillOpacity="0.08"
        stroke="none"
        points={`0,${h} ${pts} ${(values.length - 1) * step},${h}`}
      />
    </svg>
  );
}

function GaugeBar({
  label,
  pct,
  detail,
  color = "amber",
}: {
  label: string;
  pct: number;
  detail: string;
  color?: "amber" | "green" | "red";
}) {
  const barBg =
    color === "amber"
      ? "linear-gradient(90deg,#b45309,#f59e0b)"
      : color === "red"
      ? "linear-gradient(90deg,#7f1d1d,#ef4444)"
      : "linear-gradient(90deg,#065f46,#10b981)";

  return (
    <div>
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[10px] uppercase tracking-widest" style={{ color: "#64748b" }}>
          {label}
        </span>
        <span className="text-xs" style={{ color: "#e2e8f0" }}>
          {detail}
        </span>
      </div>
      <div
        className="h-1.5 w-full rounded-full"
        style={{ background: "#1e2d3d" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: barBg,
            boxShadow: `0 0 6px ${color === "amber" ? "rgba(245,158,11,0.3)" : color === "red" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
            transition: "width 0.5s ease",
          }}
        />
      </div>
      <div className="text-right text-[10px] mt-0.5" style={{ color: "#334155" }}>
        {pct}%
      </div>
    </div>
  );
}

export default function VPSHealth() {
  return (
    <div className="animate-slideIn space-y-4">
      {/* Top metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "CPU",  value: `${vpsHealth.cpu.pct}%`,      sub: `${vpsHealth.cpu.cores} cores · ${vpsHealth.cpu.mhz} MHz`, color: "#f59e0b" },
          { label: "RAM",  value: `${vpsHealth.ram.usedGb} GB`, sub: `of ${vpsHealth.ram.totalGb} GB · ${vpsHealth.ram.pct}%`, color: "#3b82f6" },
          { label: "DISK", value: `${vpsHealth.disk.usedGb} GB`,sub: `of ${vpsHealth.disk.totalGb} GB · ${vpsHealth.disk.pct}%`, color: "#10b981" },
          { label: "TEMP", value: vpsHealth.temp,               sub: `Load ${vpsHealth.load[0]} · ${vpsHealth.load[1]} · ${vpsHealth.load[2]}`, color: "#e2e8f0" },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-lg p-4"
            style={{ background: "#0f1623", border: "1px solid #1e2d3d" }}
          >
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "#64748b" }}>
              {m.label}
            </div>
            <div className="text-2xl font-700" style={{ color: m.color, fontFamily: "'Syne',sans-serif" }}>
              {m.value}
            </div>
            <div className="text-[10px] mt-1" style={{ color: "#334155" }}>
              {m.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Resource bars */}
        <Card title="Resource Usage">
          <div className="p-4 space-y-5">
            <GaugeBar label="CPU"  pct={vpsHealth.cpu.pct}  detail={`${vpsHealth.cpu.pct}% used`} color="amber" />
            <GaugeBar label="RAM"  pct={vpsHealth.ram.pct}  detail={`${vpsHealth.ram.usedGb} / ${vpsHealth.ram.totalGb} GB`} color="amber" />
            <GaugeBar label="DISK" pct={vpsHealth.disk.pct} detail={`${vpsHealth.disk.usedGb} / ${vpsHealth.disk.totalGb} GB`} color="green" />
            <GaugeBar label="SWAP" pct={vpsHealth.swap.pct} detail={`${vpsHealth.swap.usedGb} / ${vpsHealth.swap.totalGb} GB`} color="green" />
          </div>
        </Card>

        {/* Mini charts */}
        <Card title="10-Sample Trend">
          <div className="p-4 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase tracking-widest" style={{ color: "#64748b" }}>CPU %</span>
                <span className="text-xs" style={{ color: "#f59e0b" }}>now {cpuHistory[cpuHistory.length - 1]}%</span>
              </div>
              <MiniGraph values={cpuHistory} color="#f59e0b" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] uppercase tracking-widest" style={{ color: "#64748b" }}>RAM %</span>
                <span className="text-xs" style={{ color: "#3b82f6" }}>now {ramHistory[ramHistory.length - 1]}%</span>
              </div>
              <MiniGraph values={ramHistory} color="#3b82f6" />
            </div>
            <div className="flex gap-6">
              <div>
                <div className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "#64748b" }}>NET IN</div>
                <div className="text-sm" style={{ color: "#10b981" }}>{vpsHealth.netIn}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: "#64748b" }}>NET OUT</div>
                <div className="text-sm" style={{ color: "#10b981" }}>{vpsHealth.netOut}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Services */}
      <Card title="Services" subtitle={`${services.filter(s => s.status === "online").length}/${services.length} running`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid #1e2d3d" }}>
                {["Service", "Status", "PID", "Memory", "Restarts"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2 text-[10px] uppercase tracking-widest font-500"
                    style={{ color: "#334155" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.map((svc) => (
                <tr
                  key={svc.name}
                  className="hover:bg-[#131a22] transition-colors"
                  style={{ borderBottom: "1px solid #1a2433" }}
                >
                  <td className="px-4 py-2.5">
                    <code style={{ color: "#e2e8f0" }}>{svc.name}</code>
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={svc.status as "online" | "warn"} pulse />
                  </td>
                  <td className="px-4 py-2.5" style={{ color: "#64748b" }}>{svc.pid}</td>
                  <td className="px-4 py-2.5" style={{ color: "#94a3b8" }}>{svc.memory}</td>
                  <td className="px-4 py-2.5">
                    <span style={{ color: svc.restarts > 1 ? "#ef4444" : svc.restarts === 1 ? "#f59e0b" : "#334155" }}>
                      {svc.restarts}×
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
