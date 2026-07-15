# Changelog

All notable changes to **SmartHand Math** are documented here. The format is based
on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-07-15

Lessons polish plus the first real production deployment: `handmath.org` now serves
this image from AWS EC2 behind a Cloudflare Tunnel (previously it served a Vite dev
server). See [`DEPLOY-AWS.md`](./DEPLOY-AWS.md).

### Added
- **Endless practice** — the lesson completion screen offers "Keep practicing"
  alongside "Next lesson"; `EndlessPracticeBar` shows the round counter and an End
  action. Practice rounds re-roll fresh items from the lesson's own pool and never
  affect the recorded lesson score.
- **Unlock a locked lesson** via a tap → confirm popup.

### Fixed
- **Service worker is no longer long-cached.** `sw.js` / `registerSW.js` are not
  content-hashed, but the nginx `expires 1y` rule matched them, so a CDN edge could
  pin returning visitors to a stale precached shell and `registerType: 'autoUpdate'`
  would never ship a new build. They now send `Cache-Control: no-cache`.
- `manifest.webmanifest` is served as `application/manifest+json` (nginx has no
  `.webmanifest` mime type, so it previously shipped as `application/octet-stream`).
- Blank/black page on lesson navigation; header wrapping on small screens; thumb (not
  open hand) shown for "6" in five-and-more; localized worded watch visuals.

### Security
- **Content-Security-Policy** added to the production image, making the zero-egress
  guarantee browser-enforced (`default-src 'self'`, `connect-src 'self'`). Also
  `Permissions-Policy` (`camera=(self)`, `microphone=()`), `Cross-Origin-Opener-Policy`,
  `Cross-Origin-Resource-Policy`, and `X-Frame-Options: DENY`.

### Changed
- The dev server's `allowedHosts` no longer lists `hand.candythink.com` (retired).

## [1.0.0] — 2026-06-30

First public release — the MVP. A hands-free mental-math game for kids: answer by
showing fingers to the webcam, counted with the Asian/Soroban system. 100%
client-side (no backend), works offline, zero network egress.

### Added
- **Soroban finger-counting engine** — 21-landmark → 0–99 (left hand = tens,
  right hand = units), distance-based + handedness-independent detection;
  two-layer debounce (6-frame denoise + 500 ms commit hold).
- **Three game modes** — Endless (survive), Timed (60 s), Missions (reach 10 →
  win, with confetti + win sound); adaptive difficulty (easy 0–9 / medium 0–50 /
  hard 0–99 by score); question types incl. sequences, comparison, division.
- **UX** — DaisyUI `cupcake` pastel theme; `framer-motion` page/feedback
  animations + `canvas-confetti` rewards; synthesized Web Audio sound effects;
  dismissible privacy/onboarding banner.
- **i18n** — all strings centralized in a typed dictionary (`useStrings()` +
  `useDocumentMeta`); English complete; Thai structure stubbed (data-only later).
- **Accessibility (WCAG AA)** — `prefers-reduced-motion`, focus-visible rings,
  Modal as a real dialog (role/aria/Escape/focus), skip-to-content, aria-live
  camera/lives status, pinch-zoom.
- **Performance** — code-split routes (React.lazy) + lazy MediaPipe chunk (no
  initial chunk >500 kB); `build:analyze`.
- **Offline / PWA** — self-hosted MediaPipe model+wasm + Baloo 2 font;
  `vite-plugin-pwa` (installable + offline service worker); zero CDN egress.
- **Distribution** — hardened non-root nginx (gzip/cache/security headers +
  healthcheck); tag-driven GHCR image publish; CI (lint→typecheck→test→build).
- **Engineering docs** — HLD, FRD, WBS, ADRs (0001–0007), RFCs, plus the
  parent/teacher data-handling note.

### Quality
- 136 unit/component/context tests (vitest + RTL); `src/utils` coverage gate met.
