# ADR-0009 — Guided-lessons architecture (data-only curriculum + engine reuse)

- **Status:** Accepted
- **Date:** 2026-07-02

## Context

Phase 8.3 ([ROADMAP §8.3](../ROADMAP.md), scoped by
[RFC-0004](../rfc/RFC-0004-lessons-curriculum.md)) adds a third surface — **Lessons** — that
*teaches* a 5–6-year-old who cannot yet count or read, taking them from "what is a number" to
two-hand numbers and first arithmetic, using the app's Soroban finger system. Learn (free sandbox)
and Play (random scored drill) already existed; neither scaffolds a true beginner. Constraints:
100% client-side (no backend, [ADR-0001](./ADR-0001-client-side-no-backend.md)), reuse the existing
CV/generator/camera engine (no new pipeline), and stay a data-driven, i18n-ready feature so adding
lessons or a Thai translation is not a code change.

## Decision

Build the lessons feature as a **data-driven track over the existing engine**, in five phases
(A spine → B TTS → C camera/arithmetic → Unit 1 number-sense → D polish). Key choices:

- **Data-only curriculum** — `src/content/lessons.ts` exports a `CURRICULUM` array of `Lesson`s;
  each lesson is a list of typed `LessonStep`s (discriminated union `watch` / `showMe` / `count` /
  `choose` / `compare` / `solve`) plus an `assessment.generator`. Authoring a lesson = one object +
  its strings; no per-lesson component. All prose lives in `src/i18n/strings.ts` keyed by lesson/step
  id (so Thai is a later data-only pass). `CURRICULUM` order is the unlock order.
- **`LessonsContext`** — a *separate* context from `GameContext` (which is score/lives/difficulty-
  coupled): `useReducer` + `localStorage['smartmath.lessons']` (persists **progress only**, not the
  active session), sequential unlock (`CURRICULUM[i+1]` on a pass), gentle stars (`starsFor`), and
  the 5-question assessment **generated up front with no consecutive-duplicate items** and stored on
  the active session (regenerated fresh per attempt).
- **Engine reuse** — `CameraView`, `useAutoSubmit` (gated via `canSubmit`), `mathGenerator`
  (`generateAddition`/`generateSubtraction` promoted for `solve` steps), `useAudio`, `confetti`,
  framer-motion. No new computer-vision code.
- **`digitMode` (additive `CameraView` prop)** — one-hand steps report the handedness-independent
  single digit (0–9); two-hand steps leave it off and use `handsToNumber` for place value (0–99,
  left = tens). This avoids the "left-hand 3 reads as 30" quirk while enabling the two-hand unit.
- **TTS** — `useTts` over the browser SpeechSynthesis API narrates every prompt for pre-readers
  (an OS service, no app egress; degrades to text + a timer when unsupported / voiceless).
- **Resilience (Phase D)** — an app-wide **`ErrorBoundary`** (React has no other catch for a render
  throw) turns any crash into a recoverable card instead of a blank page; the MediaPipe
  `HandLandmarker` is a **session singleton** (never `close()`d per mount) to avoid WASM churn; the
  camera **auto-starts** after the first grant.

## Consequences

**Positive**
- New lessons/units are **data + strings only** — single-hand 0–9, two-hand 0–99, and arithmetic all
  run on the one shared engine; no component work per lesson.
- **No backend, privacy preserved** (progress in `localStorage`), fully offline-capable.
- **i18n-ready** — a Thai pass is data-only; the `th: en` alias keeps the parity test green today.
- **Resilient** — no silent white screens; camera survives step/lesson churn.

**Negative / trade-offs accepted**
- `LessonsContext` duplicates some `GameContext` patterns — deliberate, to avoid coupling gameplay
  and curriculum state.
- TTS voice availability is OS-dependent (degrades to text + a look-time timer).
- The 0–99 arithmetic generators can produce carry/borrow items — regrouping is advanced for the age
  band; accepted for now (teaching examples are no-carry).

## Alternatives Considered

- **Extend `GameContext`** rather than a new context — rejected (score/lives/difficulty coupling).
- **Hand-author every assessment item** — rejected; on-the-fly generators are far more data-light.
- **Text-only, no TTS** — rejected; the target audience are pre-readers.
- **A lessons-specific CV path** — rejected; `CameraView` + `fingerMathLogic` already do it (with
  the additive `digitMode`).
