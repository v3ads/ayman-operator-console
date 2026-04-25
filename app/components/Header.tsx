"use client";

import { operatorMeta } from "../data/mock";
import { Cpu, Wifi, Clock } from "lucide-react";
import { useEffect, useState } from "react";

export default function Header() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-GB", { hour12: false }));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header
      style={{
        background: "linear-gradient(180deg, #0d1117 0%, #080b0f 100%)",
        borderBottom: "1px solid #1e2d3d",
      }}
      className="sticky top-0 z-50"
    >
      {/* Top accent line */}
      <div
        style={{
          height: "2px",
          background: "linear-gradient(90deg, transparent, #f59e0b 30%, #f59e0b 70%, transparent)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Left: Logo + Operator */}
        <div className="flex items-center gap-3">
          {/* Status dot */}
          <span
            className="status-online inline-block w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: "#10b981" }}
          />

          <div>
            <div className="font-display font-700 text-sm sm:text-base leading-none" style={{ color: "#f59e0b", letterSpacing: "0.05em" }}>
              AYMAN OPERATOR
            </div>
            <div
              className="text-xs mt-0.5 hidden sm:block"
              style={{ color: "#64748b", letterSpacing: "0.08em" }}
            >
              {operatorMeta.name} · {operatorMeta.version} · {operatorMeta.region}
            </div>
          </div>
        </div>

        {/* Right: Meta chips */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Chip icon={<Cpu size={11} />} label={`UPTIME`} value={operatorMeta.uptime} />
          <Chip icon={<Wifi size={11} />} label="STATUS" value="ONLINE" valueColor="#10b981" />
          <Chip icon={<Clock size={11} />} label="LOCAL" value={time || "──:──:──"} />
        </div>
      </div>
    </header>
  );
}

function Chip({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      className="hidden sm:flex flex-col items-end"
      style={{ color: "#64748b" }}
    >
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest" style={{ color: "#334155" }}>
        {icon}
        {label}
      </div>
      <div className="text-xs font-600" style={{ color: valueColor || "#e2e8f0" }}>
        {value}
      </div>
    </div>
  );
}
