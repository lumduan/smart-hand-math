# SmartHand Math Roadmap

Hands-free mental-math game for kids — players answer by showing fingers to the
webcam (MediaPipe), counted with the Asian/Soroban system. 100% client-side, zero
backend.

Development phases ordered by dependency — each phase must be complete and
validated before the next begins. See [`README.md`](./README.md) for the
engineering-doc conventions (ADR / FRD / RFC / WBS / HLD / PoC) used throughout.

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| `[ ]` | Not started |
| `[~]` | In progress |
| `[x]` | Complete |
| `[-]` | Skipped / deferred |

---

## Phase 0 — Project Bootstrap

> Goal: working public repo, clean tooling, anyone can clone and run quality gates.

- [x] Initialise git repo and push to GitHub (**public**)
- [x] Vite + React + TypeScript scaffold with `@/` path alias
- [x] Tailwind CSS + `daisyui` plugin + custom theme
- [x] Multi-stage `Dockerfile` (Vite build → nginx serve) + `docker-compose.yml` (dev HMR + `--profile prod`)
- [x] GitHub Actions CI: lint → typecheck → build
- [x] `LICENSE` (MIT) + `"license": "MIT"` in `package.json`
- [x] `CLAUDE.md` blueprint + `README.md`
- [x] Core engine v1: Soroban `fingerMathLogic` (0–99), `mathGenerator` ranges, two-layer debounce, handedness toggle, Howler wiring

**Exit criteria:** `git clone` → `npm install` → `npm run dev` works; CI green on push. ✓

---

## Phase 1 — Engineering Docs & Conventions

> Goal: establish the planning + decision system the team uses for all future discussion.

### 1.1 Conventions

- [x] `docs/plans/README.md` — folder layout, doc-type glossary, status legend, RFC→ADR→implement workflow, templates
- [x] `docs/plans/ROADMAP.md` (this file)

### 1.2 High-Level Design (HLD)

- [x] `docs/plans/hld.md` — system architecture + data flow (camera → `useHandTracker` → `CameraView` → `fingerMathLogic` → `GameContext`)
- [x] Component map + the three architectural constraints (client-side-only, Dockerized, English-first/i18n-ready)
- [x] Threat/privacy model: confirm zero network egress of video/landmarks

### 1.3 Functional Requirements (FRD)

- [x] `docs/plans/frd.md` — personas (kid / parent / teacher), user stories
- [x] Functional + non-functional requirements (FR / NFR)
- [x] Accessibility + privacy requirements

### 1.4 Architecture Decision Records (ADR)

- [x] `docs/plans/adr/ADR-0000-template.md`
- [x] `ADR-0001` — 100% client-side, no backend (privacy + zero inference cost)
- [x] `ADR-0002` — Soroban finger-counting system (vs Western 1-finger=1)
- [x] `ADR-0003` — MediaPipe `tasks-vision` HandLandmarker (vs TensorFlow.js, legacy `@mediapipe/hands`)
- [x] `ADR-0004` — Tailwind CSS + DaisyUI for theming

### 1.5 Work Breakdown Structure (WBS)

- [x] `docs/plans/wbs.md` — decompose Phases 2–7 into trackable tasks (derivable from this roadmap)

**Exit criteria:** `docs/plans/` is populated; HLD / FRD / ADRs are referenceable in any future discussion.

---

## Phase 2 — Core Engine Verification & Quality

> Goal: lock in the Soroban engine with tests and real-hardware proof.

### 2.1 Test Infrastructure

- [x] Add **vitest** + jsdom + `@testing-library/react`
- [x] `test` script in `package.json` + coverage threshold
- [x] Wire `test` into CI (`ci.yml`)

### 2.2 Finger-Logic Tests

- [x] Unit tests for `fingerMathLogic`: `handValue` (0–9), `handsToNumber` (0–99), `anatomicalHand`, `getFingerStates`
- [x] Synthetic 21-landmark fixtures for each digit 0–9 and tens/ones combos

### 2.3 Math-Generator Tests

- [x] Unit tests for `mathGenerator`: per-difficulty answer-range invariants (easy 0–9 / medium 0–50 / hard 0–99), no out-of-range answers, `id` uniqueness

### 2.4 Component & Context Tests

- [x] Component tests: `ScoreBoard`, `LevelBadge`, `Timer`, `Modal`, `Button`
- [x] `GameContext` reducer tests: `START` / `ANSWER` / `NEXT` / `RESET`, lives→`lost`
- [x] `AppSettingsContext` tests: persistence via `localStorage` mock

### 2.5 Hardware Verification (PoC)

- [x] `docs/plans/hand-tracking/PoC/` — capture tool + real-fixture consumer tests scaffolded; `INVERT_HANDEDNESS` default verified live on real hardware
- [x] Confirm tens/ones mapping (left = tens, right = ones) on real hardware (one-hand + two-handed live test)
- [x] ADR-0005 recording the verified handedness default (`INVERT_HANDEDNESS = false`)

**Exit criteria:** utils coverage gate met; gesture→number mapping verified on real hardware; CI runs the test suite.

---

## Phase 3 — UX Polish & Design System

> Goal: a vibrant, animated, audible, kid-friendly experience.

### 3.1 React Upgrade

- [x] Upgrade React 18 → 19 (+ `@types/react`, `@types/react-dom`)

### 3.2 Theme

- [x] RFC → ADR: adopt a pastel DaisyUI theme (`cupcake` / `pastel`) in place of custom `smartmath`
- [x] Apply theme + refine color/contrast palette

### 3.3 Animation

- [x] Add `framer-motion`
- [x] `docs/plans/animations/` — page transitions + correct/wrong feedback + confetti micro-rewards (RFC-0001 / ADR-0006 + `animations/README.md`)
- [x] Roll winning motion set into components

### 3.4 Audio

- [x] Synthesized Web Audio sound effects (`correct`, `wrong`, `click`, `win`, `lose`, `tick`) — no files/licensing (ADR-0007)

### 3.5 Onboarding

- [x] Camera-permission flow, empty states, dismissible privacy banner, kid-friendly copy

**Exit criteria:** visually polished, animated, audible; theme locked by ADR.

---

## Phase 4 — Internationalization (i18n)

> Goal: zero inlined user-facing strings; English complete, Thai-ready.

- [ ] Extract all inlined strings → `src/i18n/strings.ts` (typed dictionary)
- [ ] `useStrings()` hook + locale context
- [ ] Active locale persisted in `localStorage`
- [ ] English (`en`) 100% complete; `th` structure stubbed (Thai data is Phase 8)

**Exit criteria:** no user-facing string remains inline; locale switch works for `en`; adding `th` is data-only.

---

## Phase 5 — Game Depth & Content

> Goal: replayable, age-appropriate, varied gameplay.

- [ ] Question variety: more operators, missing-number, comparison, sequences
- [ ] Game modes: timed / endless / missions
- [ ] RFC: adaptive difficulty curve
- [ ] Rewards: badges, streaks, level-up moments

**Exit criteria:** multiple modes playable; difficulty scales with score; content reviewed for the target age range.

---

## Phase 6 — Accessibility, Performance & Privacy

> Goal: inclusive, fast, private, offline-capable.

### 6.1 Accessibility

- [ ] WCAG AA audit: keyboard, screen-reader, focus order, contrast, `prefers-reduced-motion`

### 6.2 Performance

- [ ] Bundle analysis + perf budget
- [ ] Code-split / lazy-load MediaPipe and routes

### 6.3 Offline / PWA

- [ ] `docs/plans/offline/PoC/` — PWA manifest + service worker
- [ ] Self-host MediaPipe model in `public/models/` (offline + privacy)

### 6.4 Hosting & Privacy

- [ ] HTTPS guidance/config for non-localhost hosting (camera requires a secure context)
- [ ] Privacy review: confirm zero egress; write a parent/teacher data-handling note

**Exit criteria:** a11y passes; Lighthouse target met; app works offline; privacy posture documented.

---

## Phase 7 — Distribution & Release

> Goal: one-command deploy and a tagged v1.0.0.

- [ ] nginx hardening: gzip, cache headers, healthcheck, non-root user
- [ ] Deploy CI/CD (GitHub Pages or static host); optional GHCR image publish
- [ ] `RELEASING.md` runbook + `CHANGELOG.md` + semantic versioning
- [ ] Publish **v1.0.0** GitHub release

**Exit criteria:** fresh clone + `docker compose --profile prod up` → live app; tagged release published.

---

## Phase 8 — Enhancement / Future Vision

> Optional upgrades after v1.0.0.

- [ ] Parent/teacher dashboard (local-only progress + analytics)
- [ ] Classroom / multi-profile mode
- [ ] Thai (and more) i18n content
- [ ] TTS spoken instructions for pre-readers
- [ ] Additional gesture sets / sign-language mode
- [ ] Local multiplayer / classroom leaderboard

---

## Dependency Map

```
Phase 0 (Bootstrap)
    └── Phase 1 (Engineering Docs & Conventions)
            ├── Phase 2 (Core Engine Verification & Quality)
            │       └── Phase 5 (Game Depth & Content)
            └── Phase 3 (UX Polish & Design System)
                    └── Phase 4 (i18n)
                            └── Phase 6 (Accessibility / Perf / Privacy)
                                    └── Phase 7 (Distribution & Release)
                                            └── Phase 8 (Enhancement)
```

---

## Estimated Timeline

| Phase | Scope | Estimate |
|-------|-------|----------|
| 0 | Project Bootstrap | done |
| 1 | Engineering Docs & Conventions | 3–5 days |
| 2 | Core Engine Verification & Quality | 1 week |
| 3 | UX Polish & Design System | 1–2 weeks |
| 4 | Internationalization (i18n) | 3–5 days |
| 5 | Game Depth & Content | 1–2 weeks |
| 6 | Accessibility / Perf / Privacy | 1 week |
| 7 | Distribution & Release | 3–5 days |
| 8 | Enhancement (optional) | open-ended |

**MVP (Phase 0–7): ~6–9 weeks.**

---

## Current Status

> Update this section as phases complete.

- **Active phase:** Phase 4 — Internationalization (i18n)
- **Completed:**
  - Phase 0 (Bootstrap) — public repo, scaffold, Docker, CI, MIT license, CLAUDE.md, README; core Soroban engine v1 implemented and builds green
  - Phase 1 (Engineering Docs & Conventions) — `docs/plans/` populated: HLD, FRD, WBS, ADR template + ADR-0001..0004 (+ RFC template); conventions system established
  - Phase 2 (Core Engine Verification & Quality) — vitest + jsdom + RTL (114 tests); finger-logic / math-generator / component / context tests; `src/utils` coverage gate met; `test` wired into CI; hardware-verified handedness default (`INVERT_HANDEDNESS = false`, ADR-0005)
  - Phase 3 (UX Polish & Design System) — React 19; DaisyUI `cupcake` theme (ADR-0006); `framer-motion` + `canvas-confetti` animations; synthesized Web Audio SFX (ADR-0007, Howler removed); onboarding/privacy banner. 118 tests green.
- **In progress:**
  - nothing
- **Known follow-ups (from `CLAUDE.md` §15):** extract i18n strings
- **Blocked by:** nothing
