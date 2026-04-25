// ── Mock data for Ayman Operator Console ──────────────────────────────────────

export const operatorMeta = {
  name: "Hermes",
  version: "v2.4.1",
  uptime: "14d 6h 22m",
  region: "fra1 · Frankfurt",
  status: "online" as const,
  lastSync: "2025-04-25T10:41:00Z",
};

// ── Command Center ─────────────────────────────────────────────────────────────
export const recentCommands = [
  { id: "c1", ts: "10:41:02", cmd: "hermes sync --all", status: "ok", duration: "2.1s" },
  { id: "c2", ts: "10:38:44", cmd: "hermes cron run daily-digest", status: "ok", duration: "12.4s" },
  { id: "c3", ts: "10:21:10", cmd: "hermes project list", status: "ok", duration: "0.3s" },
  { id: "c4", ts: "09:55:30", cmd: "hermes alert test ping", status: "warn", duration: "1.0s" },
  { id: "c5", ts: "09:12:55", cmd: "hermes logs --tail 50 --service api", status: "ok", duration: "0.8s" },
  { id: "c6", ts: "08:44:01", cmd: "hermes deploy rollback --project nova", status: "err", duration: "4.2s" },
];

export const quickCommands = [
  { label: "Sync All",        cmd: "hermes sync --all",          icon: "RefreshCw" },
  { label: "Run Digest",      cmd: "hermes cron run daily-digest",icon: "Play" },
  { label: "Check Logs",      cmd: "hermes logs --tail 100",      icon: "FileText" },
  { label: "Status Report",   cmd: "hermes status --verbose",     icon: "BarChart2" },
  { label: "Restart API",     cmd: "hermes service restart api",  icon: "RotateCw" },
  { label: "Flush Cache",     cmd: "hermes cache flush",          icon: "Trash2" },
];

// ── VPS Health ─────────────────────────────────────────────────────────────────
export const vpsHealth = {
  cpu:    { pct: 34, cores: 4, mhz: 2400 },
  ram:    { usedGb: 3.2, totalGb: 8,   pct: 40 },
  disk:   { usedGb: 42,  totalGb: 160, pct: 26 },
  swap:   { usedGb: 0.1, totalGb: 2,   pct: 5  },
  netIn:  "1.2 MB/s",
  netOut: "0.4 MB/s",
  load:   [0.82, 0.74, 0.68],
  temp:   "41°C",
};

export const services = [
  { name: "api",        status: "online",  restarts: 0, memory: "182 MB", pid: 4821 },
  { name: "scheduler",  status: "online",  restarts: 0, memory: "94 MB",  pid: 4823 },
  { name: "watcher",    status: "online",  restarts: 1, memory: "56 MB",  pid: 4829 },
  { name: "notifier",   status: "online",  restarts: 0, memory: "38 MB",  pid: 4831 },
  { name: "syncer",     status: "warn",    restarts: 3, memory: "210 MB", pid: 5001 },
  { name: "db-proxy",   status: "online",  restarts: 0, memory: "72 MB",  pid: 4840 },
];

export const cpuHistory = [22, 18, 31, 45, 38, 29, 34, 41, 36, 34];
export const ramHistory = [38, 39, 40, 39, 41, 40, 40, 41, 40, 40];

// ── Alerts ─────────────────────────────────────────────────────────────────────
export const alerts = [
  {
    id: "a1",
    severity: "critical" as const,
    title: "Syncer memory spike",
    body: "syncer process exceeded 200 MB threshold. Restarted 3× in last hour.",
    ts: "2025-04-25T10:05:00Z",
    ack: false,
    service: "syncer",
  },
  {
    id: "a2",
    severity: "warn" as const,
    title: "Daily digest took >10s",
    body: "cron job daily-digest ran for 12.4 s, above the 10 s warning threshold.",
    ts: "2025-04-25T10:38:44Z",
    ack: false,
    service: "scheduler",
  },
  {
    id: "a3",
    severity: "info" as const,
    title: "Deploy rollback completed",
    body: "Project nova rolled back to commit a3f82c1 after failed health check.",
    ts: "2025-04-25T08:44:05Z",
    ack: true,
    service: "api",
  },
  {
    id: "a4",
    severity: "info" as const,
    title: "SSL cert renews in 14 days",
    body: "Certificate for hermes.aymanspace.com expires 2025-05-09. Auto-renew scheduled.",
    ts: "2025-04-24T06:00:00Z",
    ack: true,
    service: "system",
  },
  {
    id: "a5",
    severity: "warn" as const,
    title: "Disk write latency elevated",
    body: "Block device sda reporting avg 18 ms write latency (threshold: 15 ms).",
    ts: "2025-04-24T22:10:00Z",
    ack: true,
    service: "system",
  },
];

// ── Projects ───────────────────────────────────────────────────────────────────
export const projects = [
  {
    id: "p1",
    name: "Nova",
    description: "AI-assisted document pipeline",
    status: "degraded" as const,
    lang: "Python",
    lastDeploy: "2025-04-25T08:44:05Z",
    branch: "main",
    commit: "a3f82c1",
    tasks: { done: 18, total: 24 },
  },
  {
    id: "p2",
    name: "Meridian",
    description: "Personal knowledge graph",
    status: "healthy" as const,
    lang: "TypeScript",
    lastDeploy: "2025-04-23T14:20:00Z",
    branch: "main",
    commit: "7c19d4e",
    tasks: { done: 31, total: 31 },
  },
  {
    id: "p3",
    name: "Cobalt",
    description: "Home automation bridge",
    status: "healthy" as const,
    lang: "Go",
    lastDeploy: "2025-04-20T09:00:00Z",
    branch: "stable",
    commit: "2fb9a33",
    tasks: { done: 9, total: 12 },
  },
  {
    id: "p4",
    name: "Atoll",
    description: "Expense tracker & reconciler",
    status: "paused" as const,
    lang: "TypeScript",
    lastDeploy: "2025-04-10T11:00:00Z",
    branch: "dev",
    commit: "d1c5e77",
    tasks: { done: 4, total: 16 },
  },
];

// ── Runbooks ───────────────────────────────────────────────────────────────────
export const runbooks = [
  {
    id: "r1",
    title: "Restart a crashed service",
    tags: ["ops", "recovery"],
    steps: [
      "SSH into VPS: `ssh ayman@hermes`",
      "Check service status: `hermes service status <name>`",
      "Tail logs for error: `hermes logs --service <name> --tail 50`",
      "Restart service: `hermes service restart <name>`",
      "Confirm status is online: `hermes service status <name>`",
    ],
  },
  {
    id: "r2",
    title: "Roll back a failed deploy",
    tags: ["deploy", "recovery"],
    steps: [
      "Identify failing project: `hermes project list`",
      "Check recent deploys: `hermes deploy history --project <name>`",
      "Pick target commit hash from history",
      "Roll back: `hermes deploy rollback --project <name> --commit <hash>`",
      "Run health check: `hermes health --project <name>`",
    ],
  },
  {
    id: "r3",
    title: "Renew SSL certificate manually",
    tags: ["ssl", "ops"],
    steps: [
      "Stop nginx: `systemctl stop nginx`",
      "Run certbot: `certbot renew --standalone`",
      "Restart nginx: `systemctl start nginx`",
      "Verify: `curl -I https://hermes.aymanspace.com`",
    ],
  },
  {
    id: "r4",
    title: "Flush stale cache",
    tags: ["performance"],
    steps: [
      "Identify cache layer (Redis / in-memory)",
      "Run: `hermes cache flush`",
      "Verify no stale keys: `hermes cache stats`",
      "Monitor memory: `hermes vps memory`",
    ],
  },
  {
    id: "r5",
    title: "Debug high memory usage",
    tags: ["performance", "ops"],
    steps: [
      "Check per-service memory: `hermes service stats`",
      "Identify culprit process",
      "Tail its logs: `hermes logs --service <name> --tail 100`",
      "If leak suspected, restart service",
      "Set memory alert threshold if needed: `hermes alert set mem.<service> 150m`",
    ],
  },
];
