# Ayman Operator Console — Deployment Notes

## Framework

**Next.js 16.2.4** (App Router, Turbopack) with React 19, TypeScript 5, and Tailwind CSS 4.
Outputs fully static pages — no server-side runtime required.

## Build Command



Output directory:  (standard Next.js output — Vercel handles this automatically).

## Environment Variables

**None required.** The app is entirely mock-data-driven at this stage. There are no API keys, database connections, or runtime secrets needed for deployment.

## Current Status: Mock-Only

All data displayed in the console (alerts, projects, runbooks, command history) is sourced from a local mock data file ( or equivalent). No live backend, no API calls, no authentication layer exists yet.

The app is safe to deploy publicly as a static UI preview.

## Known Warnings (Non-Blocking)

- CSS  for Google Fonts (JetBrains Mono + Syne) is placed after CSS rules in . This triggers a build warning but does not affect functionality or appearance.

## Next Integration Phase

The following integrations are planned for the live version:

1. **Hermes API** — Connect command center to the Hermes gateway REST API for live agent control (start/stop/status).
2. **VPS Metrics** — Wire alert panel to the existing  monitoring output or a lightweight metrics endpoint.
3. **Authentication** — Add a simple token-based or OAuth gate before public exposure of live controls.
4. **Real-time updates** — Replace mock data with WebSocket or polling from the Hermes gateway state endpoint.

## Vercel Deployment Checklist

- [x]  added to  dependencies
- [x]  passes cleanly (TypeScript + static generation)
- [x] No environment variables required
- [ ] Git repository initialised and pushed to GitHub/GitLab
- [ ] Vercel project linked to repository
- [ ] Custom domain configured (optional)
