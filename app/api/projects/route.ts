import { NextResponse } from "next/server";

export const runtime = "edge";
export const revalidate = 300; // cache for 5 minutes

const REPOS = [
  { name: "ayman-operator-console", description: "Ayman Operator Console — Next.js dashboard UI" },
  { name: "cynthiaos", description: "CynthiaOS — AI-powered operating system" },
  { name: "cynthiaos-api", description: "CynthiaOS API/BFF service" },
  { name: "cynthiaos-cron-worker", description: "CynthiaOS daily pipeline cron worker" },
  { name: "cynthiaos-transform-worker", description: "CynthiaOS transform worker service" },
  { name: "cynthiaos-ingestion-worker", description: "CynthiaOS Bronze ingestion worker" },
  { name: "vidsyncro", description: "VidSyncro — video sync platform" },
];

const GITHUB_USER = "v3ads";

interface GHRepo {
  description: string | null;
  language: string | null;
  default_branch: string;
  open_issues_count: number;
  updated_at: string;
  stargazers_count: number;
}

interface GHCommit {
  sha: string;
  commit: {
    message: string;
    author: { date: string };
  };
}

export async function GET() {
  try {
    const results = await Promise.all(
      REPOS.map(async ({ name, description: fallbackDesc }) => {
        const [repoRes, commitsRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${GITHUB_USER}/${name}`, {
            headers: { "User-Agent": "ayman-operator-console" },
          }),
          fetch(`https://api.github.com/repos/${GITHUB_USER}/${name}/commits?per_page=1`, {
            headers: { "User-Agent": "ayman-operator-console" },
          }),
        ]);

        const repo: GHRepo = repoRes.ok ? await repoRes.json() : {} as GHRepo;
        const commits: GHCommit[] = commitsRes.ok ? await commitsRes.json() : [];
        const latestCommit = Array.isArray(commits) && commits.length > 0 ? commits[0] : null;

        // Determine status: if updated within 7 days = healthy, within 30 days = degraded, else paused
        const updatedAt = repo.updated_at ? new Date(repo.updated_at) : null;
        const daysSinceUpdate = updatedAt
          ? Math.floor((Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        const status =
          daysSinceUpdate <= 7 ? "healthy" : daysSinceUpdate <= 60 ? "degraded" : "paused";

        return {
          id: name,
          name,
          description: repo.description || fallbackDesc,
          status,
          language: repo.language || "Unknown",
          branch: repo.default_branch || "main",
          openIssues: repo.open_issues_count ?? 0,
          stars: repo.stargazers_count ?? 0,
          updatedAt: repo.updated_at || "",
          daysSinceUpdate,
          lastCommit: latestCommit
            ? {
                sha: latestCommit.sha.slice(0, 7),
                message: latestCommit.commit.message.split("\n")[0].slice(0, 72),
                date: latestCommit.commit.author.date.slice(0, 10),
              }
            : null,
        };
      })
    );

    return NextResponse.json({ projects: results, fetchedAt: new Date().toISOString() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
