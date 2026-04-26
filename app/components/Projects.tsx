"use client";
import { useEffect, useState } from "react";
import { GitBranch, GitCommit, AlertCircle, Star, ExternalLink } from "lucide-react";

interface Commit {
  sha: string;
  message: string;
  date: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: "healthy" | "degraded" | "paused";
  language: string;
  branch: string;
  openIssues: number;
  stars: number;
  updatedAt: string;
  daysSinceUpdate: number;
  lastCommit: Commit | null;
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f7df1e",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Unknown: "#64748b",
};

const STATUS_COLORS = {
  healthy: { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)", text: "#10b981", label: "HEALTHY" },
  degraded: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", text: "#f59e0b", label: "DEGRADED" },
  paused: { bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.3)", text: "#94a3b8", label: "PAUSED" },
};

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / (86400 * 30))}mo ago`;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string>("");

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setProjects(d.projects || []);
        setFetchedAt(d.fetchedAt || "");
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const counts = {
    healthy: projects.filter((p) => p.status === "healthy").length,
    degraded: projects.filter((p) => p.status === "degraded").length,
    paused: projects.filter((p) => p.status === "paused").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: "#94a3b8", fontSize: 13 }}>
        Loading repositories…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20" style={{ color: "#ef4444", fontSize: 13 }}>
        Failed to load: {error}
      </div>
    );
  }

  return (
    <div className="animate-slideIn space-y-5">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {(["healthy", "degraded", "paused"] as const).map((s) => (
          <div
            key={s}
            className="rounded-lg p-4"
            style={{ background: "#0f1623", border: "1px solid #1e2d3d" }}
          >
            <div className="text-2xl font-bold" style={{ color: STATUS_COLORS[s].text, fontFamily: "'Syne',sans-serif" }}>
              {counts[s]}
            </div>
            <div className="text-[10px] uppercase tracking-widest mt-1" style={{ color: "#64748b" }}>
              {s}
            </div>
          </div>
        ))}
      </div>

      {/* Project cards */}
      <div className="grid grid-cols-1 gap-4">
        {projects.map((p) => {
          const sc = STATUS_COLORS[p.status];
          const langColor = LANG_COLORS[p.language] || LANG_COLORS.Unknown;
          return (
            <div
              key={p.id}
              className="rounded-lg p-4 space-y-3 transition-all duration-150"
              style={{ background: "#0f1623", border: "1px solid #1e2d3d" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "#2a3f55")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "#1e2d3d")}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-bold text-sm"
                      style={{ color: "#e2e8f0", fontFamily: "'Syne',sans-serif" }}
                    >
                      {p.name}
                    </span>
                    <a
                      href={`https://github.com/v3ads/${p.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#64748b" }}
                    >
                      <ExternalLink size={11} />
                    </a>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#94a3b8", fontFamily: "monospace" }}>
                    {p.description}
                  </div>
                </div>
                <div
                  className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider flex-shrink-0"
                  style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}
                >
                  <span
                    style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: sc.text, display: "inline-block", flexShrink: 0,
                    }}
                  />
                  {sc.label}
                </div>
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 text-[11px]" style={{ color: "#94a3b8" }}>
                {/* Language */}
                <span className="flex items-center gap-1">
                  <span
                    style={{ width: 8, height: 8, borderRadius: "50%", background: langColor, display: "inline-block" }}
                  />
                  <span style={{ color: langColor }}>{p.language}</span>
                </span>
                {/* Branch */}
                <span className="flex items-center gap-1">
                  <GitBranch size={10} />
                  {p.branch}
                </span>
                {/* Commit */}
                {p.lastCommit && (
                  <span className="flex items-center gap-1" style={{ fontFamily: "monospace" }}>
                    <GitCommit size={10} />
                    {p.lastCommit.sha}
                  </span>
                )}
                {/* Time */}
                <span style={{ color: "#64748b" }}>{timeAgo(p.updatedAt)}</span>
                {/* Open issues */}
                {p.openIssues > 0 && (
                  <span className="flex items-center gap-1" style={{ color: "#f59e0b" }}>
                    <AlertCircle size={10} />
                    {p.openIssues} issue{p.openIssues !== 1 ? "s" : ""}
                  </span>
                )}
                {/* Stars */}
                {p.stars > 0 && (
                  <span className="flex items-center gap-1" style={{ color: "#f59e0b" }}>
                    <Star size={10} />
                    {p.stars}
                  </span>
                )}
              </div>

              {/* Last commit message */}
              {p.lastCommit && (
                <div
                  className="text-[11px] px-2 py-1.5 rounded"
                  style={{
                    background: "#080b0f",
                    border: "1px solid #1e2d3d",
                    color: "#94a3b8",
                    fontFamily: "monospace",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ color: "#64748b" }}>{p.lastCommit.date} </span>
                  {p.lastCommit.message}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {fetchedAt && (
        <div className="text-center text-[10px]" style={{ color: "#64748b" }}>
          Live from GitHub · refreshed {timeAgo(fetchedAt)}
        </div>
      )}
    </div>
  );
}
