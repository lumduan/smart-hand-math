# High-Level Design (HLD)

> **Source of truth for the *current* architecture.** [`CLAUDE.md`](../../CLAUDE.md)
> is the source of truth for *intent* (the target blueprint); where this document
> and the code disagree with CLAUDE.md, that gap is noted explicitly and is
> later-phase work (see [§6 Known gaps](#6-known-gaps--blueprint-delta)).
>
> Status legend (`[ ]`/`[~]`/`[x]`/`[-]`) and doc conventions live in
> [`README.md`](./README.md).

---

## 1. Purpose & Scope

SmartHand Math is a **100% client-side** web app: kids answer mental-math
questions by holding up fingers to the webcam, counted with the **Soroban /
Asian** system (see [ADR-0002](./adr/ADR-0002-soroban-finger-counting.md)).
There is **no backend** in Phase 1 (see
[ADR-0001](./adr/ADR-0001-client-side-no-backend.md)).

This HLD describes the system as it exists today (Phase 0 complete): the
detection → decoding → game data flow, the component map, the state model, and
the threat/privacy model. It is the reference for all future architecture
discussion.

**Out of scope here:** product requirements (→ [`frd.md`](./frd.md)), task
breakdown (→ [`wbs.md`](./wbs.md)), and per-decision rationale (→
[`adr/`](./adr/)).

---

## 2. Architectural Constraints (non-negotiable)

These three constraints shape every decision. See [`CLAUDE.md` §2](../../CLAUDE.md).

1. **100% client-side processing.** No video frame, landmark, or model input
   ever leaves the browser. All inference runs in-page via the MediaPipe wasm
   runtime. Persisted state is **`localStorage` only** on the user's device.
   Consequence: the production artifact is a **static site** (nginx serving the
   Vite bundle) — no server runtime.
2. **Dockerized environment.** Multi-stage build (`node` → `nginx`) for
   production; a developer `docker-compose` runs Vite with HMR inside the
   container, bind-mounting host source.
3. **English-first, i18n-ready.** Phase 1 ships English only, but user-facing
   strings are intended to be centralized (currently still inlined — see §6) so
   a future Thai localization is data-only.

---

## 3. System Data Flow

One unidirectional pipeline turns camera frames into a scored game answer. Each
box is a real module; the labels are the actual function/prop names.

```text
                    getUserMedia({ video, audio:false })
                              │   (camera permission requested on the
                              │    user's Start gesture, not on page load)
                              ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │ hooks/useHandTracker.ts                                                 │
 │  • FilesetResolver.forVisionTasks(WASM_URL)                             │
 │  • HandLandmarker.createFromOptions({ runningMode:'VIDEO', numHands:2,  │
 │                                        delegate:'GPU' → fallback 'CPU' })│
 │  • requestAnimationFrame loop:                                          │
 │      guard: video.readyState ≥ 2 AND currentTime changed AND ts > lastTs│
 │      → detectForVideo(video, ts)                                        │
 │  • emits: TrackedHand[] = [{ landmarks(21), handedness('Left'|'Right'), │
 │                              score }]                                   │
 └─────────────────────────────────────────────────────────────────────────┘
                              │ onLandmarks(TrackedHand[])
                              ▼
 ┌─────────────────────────────────────────────────────────────────────────┐
 │ components/camera/CameraView.tsx                                        │
 │  • per frame: number = fingerMathLogic.handsToNumber(hands)  (0..99)    │
 │  • DENOISE (6-frame rolling window): emit the MODE (majority) value;    │
 │    -1 sentinel when no hand visible (so true 0 ≠ "no input")            │
 │  • draws skeleton overlay (mirrored with the video via scaleX(-1))      │
 │  • reflects tracker status → AppSettingsContext.cameraPermission        │
 │  • emits: onNumberChange(n | -1)                                        │
 └─────────────────────────────────────────────────────────────────────────┘
                              │ onNumberChange(n | -1)
                ┌─────────────┴──────────────┐
                ▼                            ▼
 ┌──────────────────────────┐  ┌───────────────────────────────────────────┐
 │ pages/Learn.tsx          │  │ pages/Play.tsx                            │
 │  • display n live        │  │  • COMMIT-HOLD gate: if detected ===       │
 │    (no scoring)          │  │    currentQuestion.answer, hold for        │
 │                          │  │    ANSWER_HOLD_MS (500 ms) before submit;  │
 │                          │  │    any mismatch resets the timer           │
 │                          │  │  • on submit → dispatch ANSWER(given)      │
 └──────────────────────────┘  └───────────────────────────────────────────┘
                                             │
                                             ▼
                       ┌───────────────────────────────────────────┐
                       │ context/GameContext.tsx (reducer)         │
                       │  ANSWER → score/streak/best/level/        │
                       │           difficulty update, or lose a    │
                       │           life (lives ≤ 0 → status:'lost')│
                       │  NEXT → generateQuestion(difficulty)      │
                       └───────────────────────────────────────────┘
```

**Key invariants of the loop**

- `detectForVideo` is called **only on new frames** (`currentTime` changed) with
  a **strictly increasing** timestamp — required by the MediaPipe VIDEO runtime.
- **Two-layer debouncing** (see [`CLAUDE.md` §4.6](../../CLAUDE.md)):
  - *Layer 1 — denoise* (in `CameraView`): a rolling 6-frame majority vote
    stabilizes the live number against hand tremor. This keeps the **Learn**
    page responsive.
  - *Layer 2 — commit hold* (in `Play`, `ANSWER_HOLD_MS = 500`): a number must
    stay constant for 500 ms before it is accepted as an answer. This keeps
    **Play** disciplined.
- **`-1` is the "no hand visible" sentinel**, distinct from a true `0` (which is
  a valid Soroban answer, e.g. `5 − 5`).

### Finger-math contract

Implemented in [`src/utils/fingerMathLogic.ts`](../../src/utils/fingerMathLogic.ts)
(see [ADR-0002](./adr/ADR-0002-soroban-finger-counting.md)):

| Export | Returns | Notes |
|--------|---------|-------|
| `handValue(landmarks)` | `0..9` | thumb open = +5; each open index/middle/ring/pinky = +1 |
| `handsToNumber(TrackedHand[])` | `0..99` | anatomical left = tens, right = units; missing hand = 0; same-side tie → higher `score` wins |
| `anatomicalHand(raw)` | `'Left'\|'Right'` | applies `INVERT_HANDEDNESS` |
| `INVERT_HANDEDNESS` | `false` | single toggle for the webcam handedness-label swap (verified — [ADR-0005](./adr/ADR-0005-handedness-default.md)) |
| `getFingerStates(landmarks)` | per-finger booleans | for debugging / overlays |

Detection is **distance-based** (tip farther from a reference joint than the PIP
joint is), so the per-hand digit is **orientation- and handedness-independent**;
handedness is consulted *only* to assign tens vs. units.

---

## 4. Component Map

```text
src/
├── main.tsx                     entry; providers: StrictMode → BrowserRouter → AppSettings → Game
├── App.tsx                      routes: / Home, /learn Learn, /play Play (+ * → Home)
├── index.css                    Tailwind base; overscroll-behavior:none (no bounce while holding fingers)
├── vite-env.d.ts                typed import.meta.env (VITE_MEDIAPIPE_* , VITE_DEFAULT_VOLUME)
│
├── utils/
│   ├── fingerMathLogic.ts       Soroban 21-landmark → 0..99 (§3, ADR-0002)
│   └── mathGenerator.ts         difficulty-scaled questions (easy 0–9 / medium 0–50 / hard 0–99)
│
├── hooks/
│   ├── useHandTracker.ts        getUserMedia + HandLandmarker lifecycle + rAF loop (§3, ADR-0003)
│   └── useAudio.ts              howler.js wrapper; safe no-op when muted/file missing
│
├── context/
│   ├── GameContext.tsx          gameplay reducer (§5)
│   └── AppSettingsContext.tsx   cameraPermission / volume / muted / mirrored (+ localStorage)
│
├── components/
│   ├── camera/CameraView.tsx    webcam + overlay + denoise → onNumberChange (§3)
│   ├── common/{Button,Card,Modal}.tsx
│   └── game/{ScoreBoard,LevelBadge,Timer}.tsx
│
├── layouts/MainLayout.tsx       nav header (mirror & mute toggles) + <Outlet> + footer
└── pages/
    ├── Home.tsx                 landing/intro for kids, parents, teachers
    ├── Learn.tsx                free-practice playground: show a number, no scoring
    └── Play.tsx                 timed math game: hold-to-commit answer, lives, game-over modal
```

---

## 5. State Model

Two modular React Contexts (native, no Redux/Zustand) mounted at the root in
`main.tsx`.

### `GameContext` — gameplay (reducer-driven)

```text
GameState {
  status: 'idle' | 'playing' | 'won' | 'lost'
  score, best, streak, lives (STARTING_LIVES = 3),
  level (levelForScore = floor(score/5) + 1),
  difficulty: 'easy' | 'medium' | 'hard'   // difficultyForScore: <5 easy, <15 medium, else hard
  currentQuestion: MathQuestion | null
  lastAnswer: { correct, given, expected } | null
}
Actions: START | ANSWER(given) | NEXT | RESET | HYDRATE_BEST
```

- `ANSWER` correct → score+1, update `best`, streak+1, recompute level/difficulty.
- `ANSWER` wrong → lose a life, reset streak; `lives ≤ 0` → `status: 'lost'`.
- `best` is persisted to `localStorage` under **`smartmath.best`** (hydrated
  lazily + defensively).

### `AppSettingsContext` — app-wide config

```text
AppSettings {
  cameraPermission: 'prompt' | 'granted' | 'denied'   // in-memory, NOT persisted
  volume: number (0..1)   // default VITE_DEFAULT_VOLUME ?? 0.6
  muted: boolean
  mirrored: boolean       // selfie view; default true
}
```

`volume` / `muted` / `mirrored` are persisted to `localStorage` under
**`smartmath.settings`** (JSON, defensive try/catch).

### Question generation

[`src/utils/mathGenerator.ts`](../../src/utils/mathGenerator.ts) produces answers
bounded to what 1–2 Soroban hands can display: **easy 0–9, medium 0–50, hard
0–99** (addition, subtraction, multiplication, and — at medium/hard —
missing-number). See [`CLAUDE.md` §4.7](../../CLAUDE.md).

---

## 6. Known Gaps / Blueprint Delta

These are **not** Phase 1 work — they are recorded here so architecture
discussion has an accurate picture, and are scheduled in
[`wbs.md`](./wbs.md) / [`ROADMAP.md`](./ROADMAP.md):

- **Phase 0–3 migrations complete** — React 19, `framer-motion` + `canvas-confetti`,
  DaisyUI `cupcake` theme ([ADR-0006](./adr/ADR-0006-daisyui-cupcake-theme.md)),
  synthesized Web Audio ([ADR-0007](./adr/ADR-0007-web-audio-synthesis.md)), and the
  vitest suite are all in (see [`CLAUDE.md` §15](../../CLAUDE.md)).
- **User-facing strings are centralized** in `src/i18n/strings.ts`, consumed via
  `useStrings()`; the active `locale` is persisted in `AppSettingsContext`
  (Phase 4). `th` is a structural stub — real Thai is Phase 8.
- **Win condition + timed mode resolved (Phase 5)** — Missions mode sets
  `status:'won'` at `score >= MISSION_GOAL` (activating the win UI/audio/
  confetti that were already wired); Timed mode renders `Timer` and a `TIME_UP`
  action → `'lost'`. Game modes: Endless / Timed / Missions.

---

## 7. Threat / Privacy Model

**Goal: prove zero network egress of any video / landmark / model-input data.**
This is the core of [ADR-0001](./adr/ADR-0001-client-side-no-backend.md) and
makes the product COPPA / GDPR-K-friendlier by construction.

| Asset | Where it goes | Notes |
|-------|---------------|-------|
| Camera video frames | **Nowhere** — consumed in-page by `detectForVideo` | Never serialized, uploaded, or stored. |
| Hand landmarks / model inputs | **Nowhere** — processed in-page, discarded per frame | Only the resulting integer (0–99) ever reaches React state. |
| Best score & settings | `localStorage` only, on the user's device | Keys `smartmath.best`, `smartmath.settings`. |
| MediaPipe model (`.task`) + wasm | **Self-hosted** in `public/models/` (Phase 6) | Default is local now (no CDN); the PWA runtime-caches it. Zero egress. |
| Analytics / telemetry / accounts | **None** — not present in the app | Confirm by grep at review time. |

**Operational controls**

- **Camera permission is requested on a user gesture** (the Start button), not on
  page load — improving permission reliability and avoiding surprise capture.
- **Secure context required:** `getUserMedia` needs HTTPS (or `localhost`). The
  Home page surfaces this; non-localhost hosting must serve HTTPS (Phase 7).
- **Accessible without a camera:** the Play number-pad fallback keeps the game
  fully playable for privacy-conscious users, devices without webcams, and
  automated tests (see [`frd.md`](./frd.md) accessibility requirements).
- **Verification (Phase 6, done):** zero egress re-confirmed — the model, wasm,
  and font are all self-hosted (no CDN), and there is no analytics/telemetry.
  Parent/teacher note: [`privacy/DATA-HANDLING.md`](./privacy/DATA-HANDLING.md).
