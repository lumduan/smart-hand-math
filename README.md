# SmartHand Math ✋🧮

[![CI](https://github.com/lumduan/smart-hand-math/actions/workflows/ci.yml/badge.svg)](https://github.com/lumduan/smart-hand-math/actions/workflows/ci.yml)
[![Release](https://github.com/lumduan/smart-hand-math/actions/workflows/release.yml/badge.svg)](https://github.com/lumduan/smart-hand-math/pkgs/container/smart-hand-math)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

A hands-free mental-math game for kids. Players answer by **holding up their
fingers to the webcam** — gestures are read in real time with
[MediaPipe](https://developers.google.com/mediapipe) and counted with the
Asian / Soroban system. **100% client-side**: no backend, works offline, and
nothing (not the video, not even the model or font) ever leaves the browser.

Built with **React + Vite + TypeScript**, styled with **Tailwind + DaisyUI**, and
shipped as a hardened, non-root **Docker** image.

## Features

- 🖐️ **Soroban finger counting** via MediaPipe `HandLandmarker` — 1–2 hands → 0–99 (left hand = tens, right hand = ones)
- 🎮 **Three modes** — Endless, Timed (60 s), and Missions (reach 10 → win); adaptive difficulty (easy → medium → hard)
- ➕➖✖️ Question variety — arithmetic, missing-number, sequences, comparison, division
- 🎨 **Cupcake** pastel theme, `framer-motion` animations + `canvas-confetti` rewards
- 🔊 Synthesized **Web Audio** sound effects (no audio files)
- 🌐 **i18n** — centralized typed strings; English complete, Thai structure stubbed
- ♿ **WCAG AA** — reduced-motion, focus-visible, dialog semantics, skip-link, aria-live
- 📴 **Offline PWA** — self-hosted model/wasm/font; installable; zero network egress
- 🕹️ Accessible number-pad fallback (playable with no camera)

## Quick start

**Local dev:**

```bash
npm install
npm run dev          # http://localhost:5173
```

> The camera needs a **secure context** — `localhost` qualifies; for other hosts
> serve over HTTPS (see [`docs/plans/hosting/HTTPS.md`](./docs/plans/hosting/HTTPS.md)).

**Docker** (dev with HMR):

```bash
docker compose up          # http://localhost:5173
```

**Production** — pull the published image (no local build needed):

```bash
docker compose --profile prod up      # pulls ghcr.io/lumduan/smart-hand-math:latest → http://localhost:8080
```

…or build it yourself: `docker compose --profile prod up --build`.

### Scripts

| Script                 | Description                                  |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Start the Vite dev server with HMR           |
| `npm run build`        | Type-check and produce a production bundle   |
| `npm run build:analyze`| Build + emit a bundle-size report (`dist/stats.html`) |
| `npm run preview`      | Preview the production build locally         |
| `npm run test`         | Run the vitest suite (watch)                 |
| `npm run test:run`     | Run the suite once (CI mode)                 |
| `npm run test:coverage`| Run with coverage                            |
| `npm run lint`         | Run ESLint                                   |
| `npm run typecheck`    | Run `tsc` without emitting                   |

## Configuration

Environment variables (see [`.env.example`](./.env.example)) use the `VITE_` prefix:

| Variable                    | Default                                   | Purpose                          |
| --------------------------- | ----------------------------------------- | -------------------------------- |
| `VITE_MEDIAPIPE_MODEL_URL`  | `/models/hand_landmarker.task` (self-hosted) | Hand-landmarker model asset      |
| `VITE_MEDIAPIPE_WASM_URL`   | `/models/wasm` (self-hosted)              | MediaPipe wasm folder            |
| `VITE_DEFAULT_VOLUME`       | `0.6`                                     | Default sound volume (0..1)       |

The model + wasm + font are **self-hosted** by default (offline + zero egress).
Point these at the Google/jsDelivr CDNs to skip the bundled assets.

## Releases

Tag-driven: pushing a `v*` tag builds and publishes the image to
[`ghcr.io/lumduan/smart-hand-math`](https://github.com/lumduan/smart-hand-math/pkgs/container/smart-hand-math)
and creates a GitHub Release. See [`RELEASING.md`](./RELEASING.md) and
[`CHANGELOG.md`](./CHANGELOG.md).

## Privacy

No backend, no analytics, no accounts. The webcam stream is processed in-browser
and never uploaded; only `localStorage` (best score + settings) is used.
Plain-language note: [`docs/plans/privacy/DATA-HANDLING.md`](./docs/plans/privacy/DATA-HANDLING.md).

## Project structure

```
smart-hand-math/
├── public/models/     # self-hosted MediaPipe model + wasm (offline)
├── src/
│   ├── components/    # common UI, camera wrapper, game widgets
│   ├── context/       # GameContext, AppSettingsContext
│   ├── hooks/         # useAudio (Web Audio), useHandTracker (MediaPipe)
│   ├── i18n/          # strings dictionary + useStrings/useDocumentMeta
│   ├── layouts/       # MainLayout (PWA shell + nav + page transitions)
│   ├── pages/         # Home, Learn, Play
│   └── utils/         # fingerMathLogic, mathGenerator, confetti
├── docs/plans/        # HLD, FRD, WBS, ADRs, RFCs, privacy/hosting notes
├── Dockerfile         # multi-stage build → hardened non-root nginx
└── docker-compose.yml # dev (HMR) + prod profile (GHCR image)
```

## License

MIT
