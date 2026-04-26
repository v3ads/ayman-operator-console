"use client";
import { Terminal, Server, Bell, FolderKanban, BookOpen, Bot } from "lucide-react";
const TABS = [
  { id: "command",  label: "Command",  shortLabel: "CMD",  icon: Terminal },
  { id: "health",   label: "VPS Health", shortLabel: "VPS", icon: Server },
  { id: "alerts",   label: "Alerts",   shortLabel: "ALRT", icon: Bell },
  { id: "projects", label: "Projects", shortLabel: "PROJ", icon: FolderKanban },
  { id: "runbooks", label: "Runbooks", shortLabel: "RBK",  icon: BookOpen },
  { id: "rami",     label: "Rami",     shortLabel: "RAMI", icon: Bot },
] as const;
export type TabId = (typeof TABS)[number]["id"];
interface TabNavProps {
  active: TabId;
  onSelect: (id: TabId) => void;
  alertCount?: number;
}
export default function TabNav({ active, onSelect, alertCount = 0 }: TabNavProps) {
  return (
    <nav
      style={{
        background: "#0d1117",
        borderBottom: "1px solid #1e2d3d",
      }}
      className="sticky top-[49px] z-40"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-6">
        <div className="flex items-end gap-0">
          {TABS.map((tab) => {
            const isActive = tab.id === active;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onSelect(tab.id)}
                className="relative flex items-center gap-1.5 px-3 sm:px-5 py-3 text-xs transition-all duration-150 cursor-pointer group"
                style={{
                  color: isActive ? "#f59e0b" : "#64748b",
                  borderBottom: isActive ? "2px solid #f59e0b" : "2px solid transparent",
                  background: isActive ? "rgba(245,158,11,0.05)" : "transparent",
                  letterSpacing: "0.06em",
                }}
              >
                <Icon
                  size={13}
                  style={{ color: isActive ? "#f59e0b" : "#334155" }}
                  className="group-hover:text-amber-500 transition-colors"
                />
                <span className="hidden sm:inline uppercase font-500">{tab.label}</span>
                <span className="sm:hidden uppercase font-500 text-[10px]">{tab.shortLabel}</span>
                {/* Alert badge */}
                {tab.id === "alerts" && alertCount > 0 && (
                  <span
                    className="absolute top-1.5 right-1 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-700"
                    style={{ background: "#ef4444", color: "#fff" }}
                  >
                    {alertCount}
                  </span>
                )}
                {/* Hover underline */}
                {!isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform duration-150 origin-left"
                    style={{ background: "#2a3f55" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
export { TABS };
