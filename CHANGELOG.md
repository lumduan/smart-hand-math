# Changelog

All notable changes to **SmartHand Math** are documented here. The format is based
on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
