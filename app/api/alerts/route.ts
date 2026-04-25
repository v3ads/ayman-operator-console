import { NextResponse } from "next/server";
import { Client } from "ssh2";

export const runtime = "nodejs";
export const revalidate = 60;

function parseAlertLog(logRaw: string, stateRaw: string) {
  // Parse state JSON
  let state: Record<string, unknown> = {};
  try { state = JSON.parse(stateRaw); } catch {}

  // Parse log entries — each run produces a block of lines
  const blocks = logRaw.trim().split(/\n(?=HIGH alerts:|OK checks:)/);
  const runs: {
    timestamp?: string;
    high: number;
    warn: number;
    ok: number;
    quietHours: boolean;
    emailAction: string;
    whatsappAction: string;
    highAlerts: string[];
    warnAlerts: string[];
  }[] = [];

  for (const block of blocks) {
    const lines = block.split("\n");
    const high = parseInt(lines.find((l) => l.startsWith("HIGH alerts:"))?.split(":")[1]?.trim() ?? "0");
    const warn = parseInt(lines.find((l) => l.startsWith("WARN alerts:"))?.split(":")[1]?.trim() ?? "0");
    const ok = parseInt(lines.find((l) => l.startsWith("OK checks:"))?.split(":")[1]?.trim() ?? "0");
    const quietHours = lines.find((l) => l.startsWith("Quiet hours:"))?.includes("True") ?? false;
    const emailAction = lines.find((l) => l.startsWith("Email:"))?.split(":").slice(1).join(":").trim() ?? "";
    const whatsappAction = lines.find((l) => l.startsWith("WhatsApp:"))?.split(":").slice(1).join(":").trim() ?? "";
    const highAlerts = lines.filter((l) => l.startsWith("  HIGH:")).map((l) => l.replace(/^\s+HIGH:\s*/, ""));
    const warnAlerts = lines.filter((l) => l.startsWith("  WARN:")).map((l) => l.replace(/^\s+WARN:\s*/, ""));

    runs.push({ high, warn, ok, quietHours, emailAction, whatsappAction, highAlerts, warnAlerts });
  }

  // Latest run
  const latest = runs[runs.length - 1] ?? { high: 0, warn: 0, ok: 0, quietHours: false, emailAction: "", whatsappAction: "", highAlerts: [], warnAlerts: [] };

  // Build alert cards from latest run
  const alertCards: {
    id: string;
    severity: "critical" | "warn" | "info";
    title: string;
    body: string;
    ts: string;
    ack: boolean;
    service: string;
  }[] = [];

  latest.highAlerts.forEach((msg, i) => {
    alertCards.push({
      id: `high-${i}`,
      severity: "critical",
      title: msg.split(":")[0]?.trim() ?? msg,
      body: msg,
      ts: new Date().toISOString(),
      ack: false,
      service: "system",
    });
  });

  latest.warnAlerts.forEach((msg, i) => {
    alertCards.push({
      id: `warn-${i}`,
      severity: "warn",
      title: msg.split(":")[0]?.trim() ?? msg,
      body: msg,
      ts: new Date().toISOString(),
      ack: false,
      service: "system",
    });
  });

  if (alertCards.length === 0) {
    alertCards.push({
      id: "ok-0",
      severity: "info",
      title: "All systems nominal",
      body: `${latest.ok} checks passed. No HIGH or WARN alerts active.`,
      ts: new Date().toISOString(),
      ack: true,
      service: "system",
    });
  }

  return {
    latest,
    history: runs.slice(-24), // last 24 runs (24h)
    alerts: alertCards,
    state,
    fetchedAt: new Date().toISOString(),
  };
}

export async function GET() {
  const sshKey = process.env.VPS_SSH_KEY;
  const sshHost = process.env.VPS_HOST ?? "2.24.220.78";
  const sshUser = process.env.VPS_USER ?? "ayman";

  if (!sshKey) {
    return NextResponse.json({ error: "VPS_SSH_KEY not configured" }, { status: 500 });
  }

  return new Promise<NextResponse>((resolve) => {
    const conn = new Client();
    let logOutput = "";
    let stateOutput = "";

    conn.on("ready", () => {
      // Read both files in one exec
      conn.exec(
        "cat /opt/hermes-workspaces/vps-alert.log 2>/dev/null; echo '---STATE---'; cat /opt/hermes-workspaces/alert-state.json 2>/dev/null",
        (err, stream) => {
          if (err) {
            conn.end();
            return resolve(NextResponse.json({ error: err.message }, { status: 500 }));
          }
          let raw = "";
          stream.on("data", (d: Buffer) => { raw += d.toString(); });
          stream.stderr.on("data", () => {});
          stream.on("close", () => {
            conn.end();
            const parts = raw.split("---STATE---");
            logOutput = parts[0] ?? "";
            stateOutput = parts[1]?.trim() ?? "{}";
            try {
              const parsed = parseAlertLog(logOutput, stateOutput);
              resolve(NextResponse.json(parsed));
            } catch (e) {
              resolve(NextResponse.json({ error: "Parse error", raw }, { status: 500 }));
            }
          });
        }
      );
    });

    conn.on("error", (err) => {
      resolve(NextResponse.json({ error: err.message }, { status: 500 }));
    });

    conn.connect({
      host: sshHost,
      port: 22,
      username: sshUser,
      privateKey: sshKey.replace(/\\n/g, "\n"),
    });
  });
}
