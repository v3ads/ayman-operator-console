"use client";

import { projects } from "../data/mock";
import Card from "./Card";
import StatusBadge from "./StatusBadge";
import { GitBranch, Clock, Code2 } from "lucide-react";

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const LANG_COLOR: Record<string, string> = {
  Python:     "#3b82f6",
  TypeScript: "#f59e0b",
  Go:         "#10b981",
};

export default function Projects() {
  const healthy = projects.filter((p) => p.status === "healthy").length;

  return (
    <div className="animate-slideIn space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total",    value: projects.length,                                        color: "#e2e8f0" },
          { label: "Healthy",  value: healthy,                                                color: "#10b981" },
          { label: "Degraded", value: projects.filter(p => p.status === "degraded").length,   color: "#f59e0b" },
          { label: "Paused",   value: projects.filter(p => p.status === "paused").length,     color: "#94a3b8" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg p-4"
            style={{ background: "#0f1623", border: "1px solid #1e2d3d" }}
          >
            <div className="text-2xl font-700" style={{ color: s.color, fontFamily: "'Syne',sans-serif" }}>
              {s.value}
            </div>
            <div className="text-[10px] uppercase tracking-widest mt-1" style={{ color: "#94a3b8" }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Project cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((p) => {
          const taskPct = Math.round((p.tasks.done / p.tasks.total) * 100);
          const barColor =
            p.status === "healthy"  ? "linear-gradient(90deg,#065f46,#10b981)"
            : p.status === "degraded" ? "linear-gradient(90deg,#b45309,#f59e0b)"
            : "linear-gradient(90deg,#1e2d3d,#334155)";

          return (
            <div
              key={p.id}
              className="rounded-lg p-5 space-y-4 transition-all duration-150"
              style={{
                background: "#0f1623",
                border: "1px solid #1e2d3d",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLDivElement).style.borderColor = "#2a3f55")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLDivElement).style.borderColor = "#1e2d3d")
              }
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div
                    className="font-700 text-base"
                    style={{ color: "#e2e8f0", fontFamily: "'Syne',sans-serif" }}
                  >
                    {p.name}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                    {p.description}
                  </div>
                </div>
                <StatusBadge status={p.status as "healthy" | "degraded" | "paused"} pulse />
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap gap-3 text-[11px]" style={{ color: "#94a3b8" }}>
                <span className="flex items-center gap-1">
                  <Code2 size={11} style={{ color: LANG_COLOR[p.lang] ?? "#64748b" }} />
                  <span style={{ color: LANG_COLOR[p.lang] ?? "#64748b" }}>{p.lang}</span>
                </span>
                <span className="flex items-center gap-1">
                  <GitBranch size={11} />
                  {p.branch}
                </span>
                <code className="text-[10px]" style={{ color: "#94a3b8" }}>
                  {p.commit}
                </code>
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {relTime(p.lastDeploy)}
                </span>
              </div>

              {/* Task progress */}
              <div>
                <div className="flex justify-between text-[10px] mb-1.5">
                  <span className="uppercase tracking-widest" style={{ color: "#94a3b8" }}>Tasks</span>
                  <span style={{ color: "#94a3b8" }}>{p.tasks.done} / {p.tasks.total}</span>
                </div>
                <div className="h-1 rounded-full" style={{ background: "#1e2d3d" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${taskPct}%`, background: barColor }}
                  />
                </div>
                <div className="text-right text-[10px] mt-0.5" style={{ color: "#94a3b8" }}>
                  {taskPct}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
