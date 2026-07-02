# CLAUDE.md — `smart-hand-math`

> **Read this first.** This is the canonical blueprint, system-architecture, and
> tech-stack guide for `smart-hand-math`. Any AI assistant or human contributor
> should treat this document as the source of truth for *intent*; the code is the
> source of truth for *current state*. When the two disagree, see
> [§15 Implementation Status](#15-implementation-status-vs-this-blueprint) and
> bring the code toward this blueprint (or update this document by design).

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architectural Constraints (non-negotiable)](#2-architectural-constraints-non-negotiable)
3. [Technology Stack](#3-technology-stack)
4. [Finger-Counting Math Logic (core algorithm)](#4-finger-counting-math-logic-core-algorithm)
5. [Detection & Game Loop](#5-detection--game-loop)
6. [State Management](#6-state-management)
7. [Internationalization (i18n) Strategy](#7-internationalization-i18n-strategy)
8. [Design Language & UX](#8-design-language--ux)
9. [File Structure](#9-file-structure)
10. [Docker & Environments](#10-docker--environments)
11. [Environment Variables](#11-environment-variables)
12. [Development Commands](#12-development-commands)
13. [Coding Conventions](#13-coding-conventions)
14. [Privacy, Safety & Accessibility](#14-privacy-safety--accessibility)
15. [Implementation Status vs. This Blueprint](#15-implementation-status-vs-this-blueprint)

---

## 1. Project Overview

| Field | Value |
| --- | --- |
| **Name** | `smart-hand-math` |
| **Tagline** | Mental math you can *hold up*. |
| **Target Audience** | Children learning mental math and finger-counting techniques (Soroban / Asian single- & dual-hand finger math). Secondary: parents and teachers. |
| **Core Concept** | An interactive, highly visual, gamified web app that uses **client-side computer vision** through the user's webcam to track hand gestures, count fingers using the Soroban/Asian system, and match the resulting number against real-time mental-math challenges. |
| **License** | Open-source — **MIT** (primary) or **Apache 2.0**. State the final choice in `LICENSE` and `package.json`. |
| **Design Language** | Vibrant, kid-friendly, playful: pastel palette, crisp micro-animations, encouraging sound effects. Large touch targets, rounded shapes, emoji-forward iconography. |

The app has three primary surfaces (see [§9 File Structure](#9-file-structure) and `src/pages/`):

- **Home** — landing/intro for kids, parents, and teachers.
- **Learn** — free-practice playground: turn the camera on and see the number your hand(s) represent, with no scoring pressure.
- **Play** — the timed math game: a question appears, the child answers by holding up the correct finger value, the app confirms, scores, and advances.

---

## 2. Architectural Constraints (non-negotiable)

These three constraints shape every decision in the project.

### 2.1 100% Client-Side Processing

- **No video frames, no landmark/coordinate data, and no model inputs may ever leave the browser.** All AI inference happens in-page via the MediaPipe WebAssembly runtime.
- This yields **zero server AI-inference cost** and **maximum privacy compliance** for a children's product (COPPA/GDPR-K friendlier by construction).
- There is intentionally **no backend** in Phase 1. Persisted data (best score, settings) lives only in `localStorage` on the user's own device.
- Consequence: the production artifact is a **static site** (Nginx serving a Vite bundle) — no Node runtime in production.

### 2.2 Dockerized Environment

- A **multi-stage production build**: `node` stage compiles the Vite bundle; a slim `nginx` stage serves the static `dist/`.
- A **developer-friendly Docker Compose** that runs Vite with HMR inside the container and bind-mounts the host source so edits hot-reload instantly.
- Must work with a single command for each mode (see [§12](#12-development-commands)).

### 2.3 Phase 1 Focus — English-first, i18n-ready

- Phase 1 ships in **English only**, but **all user-facing strings must live in centralized configuration objects/constants** (see [§7](#7-internationalization-i18n-strategy)) — never inlined into JSX.
- This makes a future **Thai** (and other) localization a pure data-translation task with no component refactors.

---

## 3. Technology Stack

| Concern | Choice | Notes |
| --- | --- | --- |
| **Core framework** | **React 19** (latest stable) | Function components + Hooks only. |
| **Bundler / dev server** | **Vite** (latest stable) | Fast HMR; ESM-native. |
| **Language** | **TypeScript** (strict) | `strict: true`, `noUnusedLocals`, `noUnusedParameters`. |
| **AI / hand tracking** | **`@mediapipe/tasks-vision`** — `HandLandmarker` API | Returns 21 landmarks/hand + `handedness`. Loads model + wasm from CDN by default; can be self-hosted in `public/models/`. |
| **Styling** | **Tailwind CSS** + **`daisyui`** plugin | Use a kid-friendly DaisyUI theme such as **`cupcake`** or **`pastel`` (built-in) or a custom pastel theme. |
| **State management** | **Native React Context**, modularized into `GameContext` and `AppSettingsContext` | No Redux/Zustand in Phase 1. |
| **Animation** | **`framer-motion`** | Fluid page/element transitions and visual micro-rewards (confetti, badge pop, shake-on-wrong). |
| **Audio engine** | **Web Audio API** (synthesized tones) | Lightweight, in-browser sound effects — no files (ADR-0007). |
| **Routing** | `react-router-dom` | `/`, `/learn`, `/play`. |
| **Path alias** | `@/*` → `src/*` | Configured in both `tsconfig.app.json` and `vite.config.ts`. |
| **Quality** | ESLint + `tsc` | Enforced in CI (`.github/workflows/ci.yml`). |

> See [§15](#15-implementation-status-vs-this-blueprint) for the current installed versions, which trail this target in a couple of places (React 18 vs 19; `framer-motion` not yet added).

---

## 4. Finger-Counting Math Logic (core algorithm)

> 🔑 This is the defining feature of the app. It lives in `src/utils/fingerMathLogic.ts`.
> The model is the **Asian / Soroban finger-counting system**, **not** Western
> "one finger = one unit".

### 4.1 The 21-Landmark Model

MediaPipe `HandLandmarker` returns 21 normalized landmarks `{x, y, z}` per hand,
origin top-left, `x`/`y` in `[0, 1]`, **`y` increasing downward**:

```
 0  WRIST
 1-4   thumb   (CMC=1, MCP=2, IP=3, TIP=4)
 5-8   index   (MCP=5, PIP=6, DIP=7, TIP=8)
 9-12  middle  (MCP=9, PIP=10, DIP=11, TIP=12)
13-16  ring    (MCP=13, PIP=14, DIP=15, TIP=16)
17-20  pinky   (MCP=17, PIP=18, DIP=19, TIP=20)
```

### 4.2 Place Value — Two-Hand Positional System

A single hand can represent **0–9** (Soroban digit). Two hands form a **two-digit
number 0–99** by place value:

| Hand (anatomical, user's body) | Represents | Multiplier |
| --- | --- | --- |
| **Right hand** | **Units / Ones** column (`10⁰`) | `× 1` |
| **Left hand** | **Tens** column (`10¹`) | `× 10` |

Final number:

```text
number = (leftHandValue  × 10) + rightHandValue     // 0..99
```

If only one hand is visible, the missing hand contributes `0`.

### 4.3 Finger Values Per Hand

Detection is **orientation-, handedness- and mirror-independent for the per-hand
digit** — it uses **distance-based** extension tests rather than fragile screen
`x`/`y` sign comparisons, so it survives tilted, rotated, or flipped hands.

| Finger | Tip landmark | Extended value | Detection rule (distance-based) |
| --- | --- | --- | --- |
| **Thumb** | `4` | **5** | Tip (4) is **farther from pinky-MCP (17)** than the thumb IP (3) is. An open thumb reaches across the palm; a tucked thumb folds back. |
| Index | `8` | 1 | Tip is **farther from the wrist (0)** than its PIP joint (`6`). |
| Middle | `12` | 1 | `tip` farther from wrist than PIP (`10`). |
| Ring | `16` | 1 | `tip` farther from wrist than PIP (`14`). |
| Pinky | `20` | 1 | `tip` farther from wrist than PIP (`18`). |

So one open hand = `5 (thumb) + 4 (fingers) = 9`; a closed fist = `0`.

### 4.4 Reference Implementation (`src/utils/fingerMathLogic.ts`)

```ts
const WRIST = 0, THUMB_TIP = 4, THUMB_IP = 3, PINKY_MCP = 17
const FINGERS = {
  index:  { tip: 8,  pip: 6  },
  middle: { tip: 12, pip: 10 },
  ring:   { tip: 16, pip: 14 },
  pinky:  { tip: 20, pip: 18 },
} as const

const dist = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y)

// Orientation-tolerant: tip farther from wrist than the PIP joint.
const isFingerExtended = (lm: Landmark[], f: keyof typeof FINGERS) =>
  dist(lm[FINGERS[f].tip], lm[WRIST]) > dist(lm[FINGERS[f].pip], lm[WRIST])

// Thumb reaches across the palm: tip farther from pinky-MCP than IP is.
const isThumbOpen = (lm: Landmark[]) =>
  dist(lm[THUMB_TIP], lm[PINKY_MCP]) > dist(lm[THUMB_IP], lm[PINKY_MCP])

/** Soroban value of one hand — handedness-independent. */
export function handValue(lm: Landmark[]): number {
  const thumb = isThumbOpen(lm) ? 5 : 0
  const ones = (['index', 'middle', 'ring', 'pinky'] as const)
    .reduce<number>((n, f) => n + (isFingerExtended(lm, f) ? 1 : 0), 0)
  return thumb + ones // 0..9
}

/** Compose hands into 0..99 by place value (left = tens, right = units). */
export function handsToNumber(hands: TrackedHand[]): number {
  // pick the higher-confidence hand per anatomical side, then:
  // number = (bestLeft.value  ?? 0) * 10 + (bestRight.value ?? 0)
}
```

The digit never needs handedness; handedness is **only** consulted in
`handsToNumber` to route each hand to the TENS (left) or UNITS (right) slot.

### 4.5 ⚠️ Handedness Correction (single toggle)

Webcams feed a **non-mirrored** frame to a model trained assuming a **mirrored
(selfie)** frame, so the raw MediaPipe `"Left"`/`"Right"` labels **may come out
swapped** relative to the player's anatomical hand — but this is
**device/browser-dependent**, not guaranteed. The cosmetic display-`mirrored`
flag does **not** affect this — landmark coordinates are always in raw-frame
space.

This is handled by a single, documented, easily-flipped constant (verified on
real hardware — see
[ADR-0005](docs/plans/adr/ADR-0005-handedness-default.md)):

```ts
// src/utils/fingerMathLogic.ts
export const INVERT_HANDEDNESS = false // verified on real hardware (ADR-0005)

export function anatomicalHand(raw: RawHandedness): RawHandedness {
  return INVERT_HANDEDNESS ? (raw === 'Left' ? 'Right' : 'Left') : raw
}
```

`useHandTracker` pairs each hand's landmarks with its raw label + score;
`handsToNumber` runs them through `anatomicalHand` before assigning place value.
On the verified hardware the labels are **not** swapped, so the default is
`false` (left hand = tens, right hand = units). **If a new device shows the
wrong hand counting as tens, flip `INVERT_HANDEDNESS`.** That one constant is the
single source of the "wrong hand = tens" class of bugs.

### 4.6 Debounce / Smoothing (anti-tremor)

Young children's hands tremble and drift. A raw per-frame number is unusable.

- Require the candidate number to remain **constant for ~500 ms** before it is
  *committed* as the player's answer (configurable via a constant, e.g.
  `ANSWER_HOLD_MS = 500`).
- Implementation: keep the latest stable value; reset the hold timer whenever the
  raw value changes; emit only after the timer elapses.
- A value of `-1` means **"no hand visible"** (sentinel) so consumers can
  distinguish a true `0` from "no input" — important because `0` is a valid
  Soroban answer (e.g. `5 − 5`).
- **Two-layer implementation:** `CameraView` does per-frame *denoising*
  (rolling-window majority vote over ~6 frames) and emits the live number for
  the Learn display; the *commit hold* (`ANSWER_HOLD_MS = 500`, in `Play`) gates
  when that number is accepted as an answer. This keeps Learn responsive while
  Play stays disciplined.

### 4.7 Consequence for the Question Generator

Because two hands can now represent **0–99** (not 0–10), `mathGenerator.ts` must
produce answers within the representable range and gate them by difficulty:

| Difficulty | Hands used | Answer range | Examples |
| --- | --- | --- | --- |
| Easy | single hand | 0–9 | `3 + 2`, `7 − 4` |
| Medium | one or two hands | 0–50 | `12 + 7`, `25 − 10`, `6 × 4` |
| Hard | two hands | 0–99 | `37 + 19`, `9 × 8`, `50 − ? = 23` |

Never generate a question whose answer a child cannot physically display.

---

## 5. Detection & Game Loop

```
useHandTracker (src/hooks/useHandTracker.ts)
  │  owns: getUserMedia stream + HandLandmarker lifecycle + rAF loop
  │  emits: landmarks[][] + handedness per frame
  ▼
CameraView (src/components/camera/CameraView.tsx)
  │  draws skeleton overlay, applies debounce (§4.6),
  │  computes number via fingerMathLogic, mirrors handedness (§4.5)
  │  emits: onNumberChange(n | -1)
  ▼
Play / Learn pages
  │  Learn: display n
  │  Play: when n === currentQuestion.answer and held 500ms -> answer(n)
  ▼
GameContext (reducer) -> score / streak / lives / level / next question
```

- The detection loop uses `requestAnimationFrame` (or
  `requestVideoFrameCallback` where available) and calls
  `HandLandmarker.detectForVideo(video, monotonicTimestampMs)` only on **new**
  frames (`video.currentTime` changed) with a **strictly increasing** timestamp.
- Try GPU delegate first, fall back to **CPU** on init failure (some
  browsers/contexts block GPU).

---

## 6. State Management

Two modular React Contexts, both at the root in `src/main.tsx`.

### 6.1 `GameContext.tsx` — gameplay state

Reducer-driven. Shape:

```ts
type GameStatus = 'idle' | 'playing' | 'won' | 'lost'

interface GameState {
  status: GameStatus
  score: number
  best: number          // persisted to localStorage
  streak: number
  lives: number
  level: number         // derived from score thresholds
  difficulty: Difficulty // 'easy' | 'medium' | 'hard'
  currentQuestion: MathQuestion | null
  lastAnswer: { correct: boolean; given: number; expected: number } | null
}
```

Actions: `START`, `ANSWER(given)`, `NEXT`, `RESET`, `HYDRATE_BEST`.
- Correct → `score + 1`, update `best`, bump `level`/`difficulty` by score thresholds.
- Wrong → lose a life, reset streak; `lives <= 0` → `status: 'lost'`.

### 6.2 `AppSettingsContext.tsx` — app-wide config

```ts
interface AppSettings {
  cameraPermission: 'prompt' | 'granted' | 'denied'
  volume: number        // 0..1, persisted
  muted: boolean        // persisted
  mirrored: boolean     // selfie view, persisted
  // setters...
}
```

Persisted to `localStorage` (`smartmath.settings`). Best score persisted under
`smartmath.best`.

---

## 7. Internationalization (i18n) Strategy

Phase 1 is English-only, **but strings must never be inlined in components.**

- Centralize every user-facing string in a typed dictionary, e.g.
  `src/i18n/strings.ts` (or `src/i18n/en.ts` + `src/i18n/th.ts` later):
  ```ts
  export const STRINGS = {
    en: {
      home: { title: 'Math you can hold up', ctaPlay: 'Play now' /* … */ },
      learn: { /* … */ },
      play: { /* … */ },
      common: { /* … */ },
    },
  } as const
  ```
- Provide a `useStrings()` hook (and later a locale context) so components stay
  locale-agnostic.
- Store **only the active locale string** in a `localStorage`-backed
  `AppSettingsContext.locale` field going forward.
- When Thai is added, no component code should change — only data.

> ✅ **Current state:** all user-facing strings are centralized in
> `src/i18n/strings.ts` and consumed via `useStrings()` (Phase 4). **Thai (`th`)
> is fully translated** (Phase 8.4) — rendered in the Mitr Thai display font and
> narrated by the device's Thai TTS voice. Adding further languages remains a
> data-only change (see [§15](#15-implementation-status-vs-this-blueprint)).

---

## 8. Design Language & UX

- **Theme:** DaisyUI `cupcake` or `pastel` (or a custom pastel theme). Soft
  rounded corners (`rounded-3xl`), generous whitespace, large tap targets.
- **Motion:** `framer-motion` for page transitions, button presses, correct/wrong
  feedback (bounce on correct, gentle shake on wrong, confetti on milestones).
- **Audio:** synthesized Web Audio tones — `correct`, `wrong`, `click`, `win`,
  `lose`, `tick` (no files; see ADR-0007). Respect `muted` / `volume`.
- **Tone:** encouraging, never punitive. Show the expected answer after a miss.
- **Accessibility:** the game is fully playable **without a camera** via an
  on-screen number pad fallback (see `pages/Play.tsx`).

---

## 9. File Structure

```text
smart-hand-math/
├── .dockerignore
├── Dockerfile                 # multi-stage: node build -> nginx serve
├── docker-compose.yml         # dev (HMR) + optional prod profile
├── public/
│   ├── assets/                # favicon, shared static files
│   ├── audio/                 # *.mp3 sound effects (howler)
│   └── models/                # optional self-hosted MediaPipe model + wasm
├── src/
│   ├── assets/images/         # illustrations / hand graphics for kids
│   ├── components/
│   │   ├── common/            # Button, Card, Modal (Tailwind/DaisyUI)
│   │   ├── camera/            # CameraView — webcam + MediaPipe canvas wrapper
│   │   └── game/              # ScoreBoard, LevelBadge, Timer
│   ├── context/
│   │   ├── GameContext.tsx
│   │   └── AppSettingsContext.tsx
│   ├── hooks/
│   │   ├── useAudio.ts        # Web Audio sound controller
│   │   └── useHandTracker.ts  # MediaPipe Hands init + tracking state
│   ├── layouts/
│   │   └── MainLayout.tsx     # nav header + content + footer
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Learn.tsx
│   │   └── Play.tsx
│   ├── utils/
│   │   ├── fingerMathLogic.ts # 21 landmarks -> Soroban number (§4)
│   │   └── mathGenerator.ts   # difficulty-scaled questions (§4.7)
│   ├── App.tsx                # routes
│   ├── index.css              # Tailwind directives + base styles
│   ├── main.tsx               # entry + providers
│   └── vite-env.d.ts          # Vite env typings
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

Supporting files (not in the minimal spec but present): `tsconfig.app.json`,
`tsconfig.node.json`, `postcss.config.js`, `.eslintrc.cjs`, `.env.example`,
`README.md`, `.github/workflows/ci.yml`, `.github/ISSUE_TEMPLATE/`.

---

## 10. Docker & Environments

**Production (multi-stage `Dockerfile`):**
1. `node:20-alpine` — `npm ci` → `npm run build` → produces `dist/`.
2. `nginx:alpine` — copies `dist/` to the nginx html root; SPA fallback
   (`try_files $uri $uri/ /index.html`) so client-side routes work.

**Development (`docker-compose.yml`):**
- `node:20-alpine` running `vite` with `--host`; source bind-mounted for HMR;
  `node_modules` kept in a named volume to isolate from the host.
- Optional `prod` profile builds and serves the production image.

Camera access requires a **secure context**: `localhost` qualifies; for other
hosts serve over **HTTPS**.

---

## 11. Environment Variables

All browser-exposed variables use the `VITE_` prefix (see `.env.example`).

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_MEDIAPIPE_MODEL_URL` | `/models/hand_landmarker.task` (self-hosted) | Hand-landmarker model asset. |
| `VITE_MEDIAPIPE_WASM_URL` | `/models/wasm` (self-hosted) | MediaPipe wasm folder. |
| `VITE_DEFAULT_VOLUME` | `0.6` | Default sound volume (0..1). |

The model + wasm are **self-hosted** by default in `public/models/` (Phase 6) —
full offline + zero network egress. To use a CDN instead, set the URLs to the
Google/jsDelivr endpoints (see `.env.example`).

---

## 12. Development Commands

```bash
npm install
npm run dev          # Vite dev server (HMR) — http://localhost:5173
npm run build        # tsc -b && vite build
npm run preview      # serve the production build locally
npm run lint         # ESLint
npm run typecheck    # tsc -b --noEmit

docker compose up                       # dev, hot-reload (port 5173)
docker compose --profile prod up --build # production build (port 8080)
```

CI (`.github/workflows/ci.yml`) runs `lint → typecheck → build` on every push/PR.

---

## 13. Coding Conventions

- **TypeScript strict** everywhere; prefer `type`/`interface` for props.
- Prefer **named exports** for components (`export function Home()`), default
  export only for `App`.
- Use the **`@/` alias** for intra-`src` imports.
- Keep components **logic-light**; push algorithms into `utils/` and side-effect
  logic into `hooks/`.
- No inline magic strings that are user-facing — route through the i18n
  dictionary (§7).
- Pure functions in `utils/` must have **no side effects** and be unit-testable.
- Match the surrounding code's style, naming, and comment density.

---

## 14. Privacy, Safety & Accessibility

- **No data leaves the device** (§2.1). Document this to users on the Home page.
- Camera permission is requested only when the user taps **Start** (user gesture),
  improving autoplay/permission reliability.
- The game must be **playable without a camera** (on-screen number pad) for
  privacy-conscious users, devices without webcams, and automated testing.
- Keep colors/contrast accessible; never rely on color alone for feedback
  (pair with icon + text + sound).

---

## 15. Implementation Status vs. This Blueprint

This document is the **target**. The current scaffold is a working Phase-0
baseline that compiles, lints, and runs, but trails the blueprint here. Track
these migrations:

| Area | Blueprint target | Current state | Action |
| --- | --- | --- | --- |
| React version | **React 19** | ✅ React 19.2 | — |
| Finger-counting logic | **Soroban** (thumb=5, fingers=1, L=tens/R=ones, 0–99) | ✅ Implemented (distance-based, handedness-independent digit) | — |
| Question range | 0–99 across difficulties (§4.7) | ✅ easy 0–9 / medium 0–50 / hard 0–99 | — |
| Debounce | ~**500 ms** commit hold (§4.6) | ✅ Two-layer: denoise in `CameraView` + `ANSWER_HOLD_MS=500` in `Play` | — |
| Handedness/mirror | Single-toggle correction (§4.5) | ✅ `INVERT_HANDEDNESS` + `anatomicalHand` | ✅ Verified on real hardware — `false` ([ADR-0005](docs/plans/adr/ADR-0005-handedness-default.md)); flip if a new device shows wrong hand = tens. |
| Animation | **`framer-motion`** | ✅ `framer-motion` + `canvas-confetti` ([animations/README](docs/plans/animations/README.md)) | — |
| DaisyUI theme | `cupcake` / `pastel` | ✅ `cupcake` ([ADR-0006](docs/plans/adr/ADR-0006-daisyui-cupcake-theme.md)) | — |
| i18n | Centralized string dictionary (§7) | ✅ `src/i18n/strings.ts` + `useStrings()`; persisted `locale`; **full `en` + `th`** (Thai: Mitr font + device TTS, Phase 8.4) | — |
| Audio | `howler.js` | ✅ Synthesized Web Audio ([ADR-0007](docs/plans/adr/ADR-0007-web-audio-synthesis.md); Howler + mp3 removed) | — |

> When you complete any row above, flip its state to ✅ in this table.
