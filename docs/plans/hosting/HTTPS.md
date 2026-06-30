# Hosting — HTTPS / secure context (Phase 6)

> Part of [Phase 6 — Hosting & Privacy](../ROADMAP.md#phase-6--accessibility-performance--privacy).

## Why HTTPS is required

The app's core feature — reading the player's hand via the webcam — uses
`navigator.mediaDevices.getUserMedia()`. Browsers only allow camera access in a
**secure context**: **`https://`** or **`http://localhost`**. On plain HTTP from
a non-localhost host, `getUserMedia` is blocked, so Play/Learn can't see the
camera (the app shows "⛔ Camera blocked").

## How to serve it securely

| Setup | Secure context? | Notes |
| --- | --- | --- |
| **`localhost`** (dev) | ✅ | `npm run dev` / `docker compose up` — works as-is. |
| **SSH tunnel** | ✅ | `ssh -L 5173:localhost:5173 batt@<host>` then open `http://localhost:5173` on your laptop — `localhost` qualifies. |
| **Cloudflare proxy / Tunnel** | ✅ | Map a domain (e.g. `hand.candythink.com`) through Cloudflare; it terminates TLS and serves HTTPS. Add the domain to `server.allowedHosts` in `vite.config.ts` (Vite 5.4 blocks non-localhost Host headers). |
| **Reverse proxy + TLS cert** | ✅ | Put Caddy/nginx in front with a Let's Encrypt cert (HTTP→443, proxy to the app). |
| **GitHub Pages / static host** | ✅ | Served over HTTPS by default — fine for the static build. |
| **Plain HTTP, non-localhost** | ❌ | Camera blocked. Not supported. |

## Allowed hosts

For a proxied/custom domain, also allowlist it in `vite.config.ts`
(`server.allowedHosts`) for the dev server, and (Phase 7) in the nginx/server
config for production.

## Production (nginx) hardening

TLS termination, gzip, cache headers, healthcheck, and a non-root user are
**Phase 7** ("Distribution & Release"). This document covers only the secure-
context requirement that gates the camera.
