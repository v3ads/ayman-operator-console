import { NextResponse } from "next/server";
import { Client } from "ssh2";

export const runtime = "nodejs";
export const revalidate = 60; // cache for 60s

function parseAuditReport(raw: string) {
  const lines = raw.split("\n");

  const get = (label: string) => {
    const line = lines.find((l) => l.includes(label));
    return line ? line.split(":").slice(1).join(":").trim() : "";
  };

  // ── Host ────────────────────────────────────────────────────────────────────
  const hostname = get("Hostname");
  const os = get("OS");
  const kernel = get("Kernel");
  const uptime = get("Uptime").replace(/^up\s+/, "");
  const publicIp = get("Public IP");
  const auditTime = get("Date/Time");

  // ── CPU / RAM / Disk ────────────────────────────────────────────────────────
  const cpuCores = get("CPU Cores");
  const loadRaw = get("Load (1/5/15m)");
  const [load1, load5, load15] = loadRaw.split(/\s+/).filter(Boolean);
  const ramTotal = get("RAM Total").replace(" MB", "");
  const ramUsed = get("RAM Used");
  const ramUsedPct = parseInt(ramUsed.match(/\((\d+)%\)/)?.[1] ?? "0");
  const ramUsedMb = parseInt(ramUsed.match(/^(\d+)/)?.[1] ?? "0");

  // Disk: grab the root partition line
  const diskLine = lines.find((l) => /\/dev\/sda1\s/.test(l));
  let diskTotal = "", diskUsed = "", diskPct = 0;
  if (diskLine) {
    const parts = diskLine.trim().split(/\s+/);
    diskTotal = parts[1] ?? "";
    diskUsed = parts[2] ?? "";
    diskPct = parseInt(parts[4]?.replace("%", "") ?? "0");
  }

  // ── Docker ──────────────────────────────────────────────────────────────────
  const dockerSection = raw.split("3. DOCKER")[1]?.split("4. SERVICES")[0] ?? "";
  const containerLines = dockerSection
    .split("\n")
    .filter((l) => /hermes|traefik|frosty|trusting/.test(l) && l.includes("Up"));

  const containers = containerLines.map((l) => {
    const parts = l.trim().split(/\s{2,}/);
    return {
      name: parts[0]?.trim() ?? "",
      status: "running",
      uptime: parts.slice(1, -1).join(" ").trim(),
      image: parts[parts.length - 1]?.trim() ?? "",
    };
  });

  // Container resource usage
  const resourceSection = raw.split("Container resource usage")[1]?.split("4. SERVICES")[0] ?? "";
  const resourceLines = resourceSection
    .split("\n")
    .filter((l) => l.includes("CPU=") && l.includes("MEM="));

  const containerStats: Record<string, { cpu: string; mem: string }> = {};
  for (const l of resourceLines) {
    const m = l.match(/^(\S+)\s+CPU=([\d.]+%)\s+MEM=([\d.]+\w+)/);
    if (m) containerStats[m[1]] = { cpu: m[2], mem: m[3] };
  }

  // ── Services ────────────────────────────────────────────────────────────────
  const sshStatus = get("SSH service").includes("active") ? "active" : "inactive";
  const traefikStatus = get("Traefik").includes("Up") ? "active" : "inactive";
  const failedUnits = lines.some((l) => l.includes("(none)") && lines.indexOf(l) > lines.findIndex((x) => x.includes("Failed systemd")))
    ? 0
    : lines.filter((l) => l.includes("failed")).length;

  // ── SSL ─────────────────────────────────────────────────────────────────────
  const sslSection = raw.split("6. SSL CERTIFICATES")[1]?.split("7. SECURITY")[0] ?? "";
  const sslDomains: { domain: string; expiry: string; status: string; days: number }[] = [];
  const domainMatches = [...sslSection.matchAll(/Domain:\s+(\S+)/g)];
  const expiryMatches = [...sslSection.matchAll(/Expiry date:\s+(\S+)/g)];
  const statusMatches = [...sslSection.matchAll(/Status:\s+(.+)/g)];
  for (let i = 0; i < domainMatches.length; i++) {
    const statusStr = statusMatches[i]?.[1]?.trim() ?? "";
    const days = parseInt(statusStr.match(/(\d+) days/)?.[1] ?? "0");
    sslDomains.push({
      domain: domainMatches[i][1],
      expiry: expiryMatches[i]?.[1] ?? "",
      status: statusStr,
      days,
    });
  }

  // ── Security ────────────────────────────────────────────────────────────────
  const secUpdates = parseInt(get("Security updates available").match(/\d+/)?.[0] ?? "0");
  const totalUpdates = parseInt(get("Total updates available").match(/\d+/)?.[0] ?? "0");
  const permitRoot = get("PermitRootLogin");
  const passwordAuth = get("PasswordAuthentication");

  // SSH offenders
  const offenderSection = raw.split("Top SSH offenders")[1]?.split("8. ALERTS")[0] ?? "";
  const offenders = offenderSection
    .split("\n")
    .filter((l) => /^\s+\d+\s+\S+/.test(l))
    .map((l) => {
      const parts = l.trim().split(/\s+/);
      return { count: parseInt(parts[0]), ip: parts[1] };
    });

  // Fail2ban
  const bannedNow = parseInt(get("[sshd] Currently banned").match(/\d+/)?.[0] ?? "0");
  const bannedTotal = parseInt(get("[sshd] Total banned (session)").match(/\d+/)?.[0] ?? "0");

  // ── Alerts Summary ──────────────────────────────────────────────────────────
  const alertSection = raw.split("8. ALERTS SUMMARY")[1] ?? "";
  const okChecks = alertSection.split("\n").filter((l) => l.includes("✓")).map((l) => l.replace(/^\s+✓\s*/, "").trim());
  const warnChecks = alertSection.split("\n").filter((l) => l.includes("⚠")).map((l) => l.replace(/^\s+⚠\s*/, "").trim());
  const critChecks = alertSection.split("\n").filter((l) => l.includes("✗")).map((l) => l.replace(/^\s+✗\s*/, "").trim());

  return {
    host: { hostname, os, kernel, uptime, publicIp, auditTime },
    cpu: { cores: parseInt(cpuCores), load1: parseFloat(load1 ?? "0"), load5: parseFloat(load5 ?? "0"), load15: parseFloat(load15 ?? "0") },
    ram: { totalMb: parseInt(ramTotal), usedMb: ramUsedMb, pct: ramUsedPct },
    disk: { total: diskTotal, used: diskUsed, pct: diskPct },
    docker: { containers, stats: containerStats },
    services: { ssh: sshStatus, traefik: traefikStatus, failedUnits },
    ssl: sslDomains,
    security: { securityUpdates: secUpdates, totalUpdates, permitRoot, passwordAuth, bannedNow, bannedTotal, topOffenders: offenders },
    summary: { ok: okChecks, warn: warnChecks, crit: critChecks },
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
    let output = "";

    conn.on("ready", () => {
      conn.exec("cat /opt/hermes-workspaces/vps-audit-report.txt", (err, stream) => {
        if (err) {
          conn.end();
          return resolve(NextResponse.json({ error: err.message }, { status: 500 }));
        }
        stream.on("data", (d: Buffer) => { output += d.toString(); });
        stream.stderr.on("data", () => {});
        stream.on("close", () => {
          conn.end();
          try {
            const parsed = parseAuditReport(output);
            resolve(NextResponse.json({ ...parsed, raw: output, fetchedAt: new Date().toISOString() }));
          } catch (e) {
            resolve(NextResponse.json({ error: "Parse error", raw: output }, { status: 500 }));
          }
        });
      });
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
