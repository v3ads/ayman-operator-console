"use client";

import { useState } from "react";
import { runbooks } from "../data/mock";
import Card from "./Card";
import { ChevronDown, ChevronRight, BookOpen } from "lucide-react";

export default function Runbooks() {
  const [open, setOpen] = useState<string | null>(runbooks[0].id);
  const [search, setSearch] = useState("");

  const filtered = runbooks.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.tags.some((t) => t.includes(q))
    );
  });

  return (
    <div className="animate-slideIn space-y-4">
      {/* Search */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-lg"
        style={{ background: "#0f1623", border: "1px solid #1e2d3d" }}
      >
        <BookOpen size={14} style={{ color: "#94a3b8", flexShrink: 0 }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search runbooks…"
          className="flex-1 bg-transparent text-xs outline-none placeholder-slate-500"
          style={{ color: "#e2e8f0", fontFamily: "inherit" }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="text-xs cursor-pointer"
            style={{ color: "#94a3b8" }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Accordion */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-xs" style={{ color: "#94a3b8" }}>
            No runbooks match "{search}"
          </div>
        )}
        {filtered.map((rb) => {
          const isOpen = open === rb.id;
          return (
            <div
              key={rb.id}
              className="rounded-lg overflow-hidden transition-all duration-150"
              style={{
                background: "#0f1623",
                border: `1px solid ${isOpen ? "#2a3f55" : "#1e2d3d"}`,
              }}
            >
              {/* Accordion header */}
              <button
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer transition-colors"
                style={{ background: isOpen ? "#131a22" : "transparent" }}
                onClick={() => setOpen(isOpen ? null : rb.id)}
              >
                <span style={{ color: "#f59e0b", flexShrink: 0 }}>
                  {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </span>
                <span className="flex-1 text-xs font-600" style={{ color: "#e2e8f0" }}>
                  {rb.title}
                </span>
                <div className="flex gap-1.5">
                  {rb.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider"
                      style={{ background: "#1e2d3d", color: "#94a3b8" }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </button>

              {/* Accordion body */}
              {isOpen && (
                <div
                  className="px-4 pb-5 pt-1"
                  style={{ borderTop: "1px solid #1a2433" }}
                >
                  <ol className="space-y-3 mt-3">
                    {rb.steps.map((step, i) => {
                      // Split on backtick code spans
                      const parts = step.split(/(`[^`]+`)/g);
                      return (
                        <li key={i} className="flex gap-3">
                          <span
                            className="text-[10px] font-700 mt-0.5 shrink-0 w-4 text-right"
                            style={{ color: "#f59e0b" }}
                          >
                            {i + 1}.
                          </span>
                          <span className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
                            {parts.map((part, pi) =>
                              part.startsWith("`") ? (
                                <code
                                  key={pi}
                                  className="px-1 rounded"
                                  style={{
                                    background: "#080b0f",
                                    color: "#10b981",
                                    border: "1px solid #1e2d3d",
                                    fontSize: "11px",
                                  }}
                                >
                                  {part.slice(1, -1)}
                                </code>
                              ) : (
                                <span key={pi}>{part}</span>
                              )
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
