"use client";

import { useState } from "react";
import Header from "./components/Header";
import TabNav, { TabId } from "./components/TabNav";
import CommandCenter from "./components/CommandCenter";
import VPSHealth from "./components/VPSHealth";
import Alerts from "./components/Alerts";
import Projects from "./components/Projects";
import Runbooks from "./components/Runbooks";
import { alerts } from "./data/mock";

export default function Dashboard() {
  const [tab, setTab] = useState<TabId>("command");

  const unackAlerts = alerts.filter((a) => !a.ack).length;

  return (
    <div style={{ minHeight: "100vh", background: "#080b0f" }}>
      <Header />
      <TabNav active={tab} onSelect={setTab} alertCount={unackAlerts} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {tab === "command"  && <CommandCenter />}
        {tab === "health"   && <VPSHealth />}
        {tab === "alerts"   && <Alerts />}
        {tab === "projects" && <Projects />}
        {tab === "runbooks" && <Runbooks />}
      </main>

      <footer
        className="max-w-7xl mx-auto px-4 sm:px-6 py-4 mt-8 flex items-center justify-between"
        style={{ borderTop: "1px solid #1e2d3d" }}
      >
        <span className="text-xs" style={{ color: "#1e2d3d" }}>
          Ayman Operator Console · v1.0.0
        </span>
        <span className="text-xs" style={{ color: "#1e2d3d" }}>
          UI Shell · No backend · Mock data only
        </span>
      </footer>
    </div>
  );
}
