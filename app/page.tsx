"use client";
import { useState, useEffect } from "react";
import Header from "./components/Header";
import TabNav, { TabId } from "./components/TabNav";
import CommandCenter from "./components/CommandCenter";
import VPSHealth from "./components/VPSHealth";
import Alerts from "./components/Alerts";
import Projects from "./components/Projects";
import Runbooks from "./components/Runbooks";
import RamiChat from "./components/RamiChat";
export default function Dashboard() {
  const [tab, setTab] = useState<TabId>("command");
  const [alertCount, setAlertCount] = useState(0);
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("/api/alerts");
        if (!res.ok) return;
        const data = await res.json();
        const high = data?.latest?.high ?? 0;
        const warn = data?.latest?.warn ?? 0;
        setAlertCount(high + warn);
      } catch {}
    };
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div style={{ minHeight: "100vh", background: "#080b0f" }}>
      <Header />
      <TabNav active={tab} onSelect={setTab} alertCount={alertCount} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {tab === "command"  && <CommandCenter />}
        {tab === "health"   && <VPSHealth />}
        {tab === "alerts"   && <Alerts />}
        {tab === "projects" && <Projects />}
        {tab === "runbooks" && <Runbooks />}
        {tab === "rami"     && <RamiChat />}
      </main>
      <footer
        className="max-w-7xl mx-auto px-4 sm:px-6 py-4 mt-8 flex items-center justify-between"
        style={{ borderTop: "1px solid #1e2d3d" }}
      >
        <span className="text-xs" style={{ color: "#1e2d3d" }}>
          Ayman Operator Console · v1.2.0
        </span>
        <span className="text-xs" style={{ color: "#1e2d3d" }}>
          Live · VPS connected
        </span>
      </footer>
    </div>
  );
}
