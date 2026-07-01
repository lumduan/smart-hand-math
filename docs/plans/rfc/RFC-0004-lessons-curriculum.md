# RFC-0004 — Lessons / curriculum (scope, age band, assessment)

- **Status:** Proposed
- **Author:** Claude (with project owner)
- **Date:** 2026-07-01
- **Related:** [ROADMAP §8.3](../ROADMAP.md#83-lessons--curriculum-framework),
  [lessons README](../lessons/README.md), [FRD §2.1](../frd.md) (persona), [RFC-0002](RFC-0002-adaptive-difficulty.md)

## Problem

[ROADMAP §8.3](../ROADMAP.md#83-lessons--curriculum-framework) is an intentional skeleton: it
prescribes routes (`/lessons`, `/lessons/:id`), a data model, storage at `src/content/lessons.ts`,
and a 3-lesson draft outline (count 0–9 → 0–99 → +/−) — then explicitly defers the three decisions
that turn a framework into something buildable:

> **Status:** FRAMEWORK — outline only; scope, age bands, and assessment model to be specified in a
> later RFC.

This RFC resolves those three open questions so the lessons feature can be designed and built:

1. **Age band** — who is the beginner track for? The FRD persona is "Maya, age 7, pre- to
   early-reader." A child who has *never* learned addition/subtraction is younger and needs more
   scaffolding than the Play game assumes.
2. **Scope** — how far does the *first* track go? The §8.3 outline jumps from "0–9" to "0–99" to
   "+/−" with no stated boundary, and the Soroban two-hand place-value step (0–99) is a large
   conceptual leap for a young beginner.
3. **Assessment model** — how does a child advance and "complete" a lesson? §8.3 lists an
   `assessment` field on the data model but never defines pass/fail, unlocking, or retry behavior.

## Proposal

### 1. Age band — add a 5–6 (pre-reader) band below the age-7 persona

Target **ages 5–6, pre-reader**, as a new band *below* the FRD's primary age-7 persona. This is the
population that has never met +/− and may not count reliably. Consequences:

- **Spoken instructions are mandatory, not optional.** A 5–6 y/o cannot read prompts, so every step
  is narrated via the browser's `window.speechSynthesis` — 100% client-side (an OS service, not app
  egress), compatible with [ADR-0001](../adr/ADR-0001-client-side-no-backend.md) and the
  no-data-leaves-the-device stance. This pulls the deferred ROADMAP §8.4 item "TTS spoken
  instructions for pre-readers" **into scope** for this feature (a net-new `useTts` hook; a short
  ADR note). Every step *also* carries a clear glyph/visual so it is followable even if a voice is
  unavailable.
- **Tone stays "encouraging, never punitive"** ([design §8](../../CLAUDE.md)); the age band makes
  this non-negotiable for assessment (see §3).

### 2. Scope — a 0–9 single-hand beginner track; defer two-hand 0–99

The first track is **"First Numbers": 4 units, 13 lessons**, taking a child from number sense → the
Soroban finger system → addition → subtraction, all within **single-hand 0–9**.

- **Why cap at 0–9:** a 5–6 y/o reaching first +/− does not need two-hand place value. Every answer
  in the track is physically showable on one hand, which keeps `numHands=1`, a tight cognitive load,
  and sidesteps the place-value conceptual leap until the child has number sense and digit fluency.
- **Pedagogy:** CRA (Concrete objects → finger Representation → symbols) + explicit teaching of the
  Soroban "5-structure" (thumb = 5; 6–9 = "5 and more"). Digit formation is taught progressively
  (1–4 → 5 → 6–9), not assumed.
- **Two-hand place value (0–99)** is the explicit *next* unit, **deferred** — it is a separate,
  larger concept (the original §8.3 "Lesson 2") and becomes a follow-on track after this one ships.
- Full lesson-by-lesson breakdown (units, objectives, steps, number ranges) lives in the
  [lessons README](../lessons/README.md#curriculum--first-numbers-13-lessons-4-units).

**End state of the track:** a non-reader can count, recognize Soroban digits 0–9, and add/subtract
within 9 — all on one hand.

### 3. Assessment model — gentle mastery + sequential unlock + stars

- **Per lesson:** finish all teaching steps, then a 5-question quick-check; **4 of 5 (80%) to pass.**
  No timer, no lives, no penalty — a wrong answer is a gentle "try again" (`playTryAgain`, not the
  harsh `wrong` sound). Re-doable any number of times.
- **Unlocking:** `CURRICULUM[0]` is unlocked; each lesson unlocks the next on pass. (Linear,
  motivating for kids; parents/teachers can revisit any completed lesson.)
- **Stars (completion signal, not a gate):** 3★ (pass, no teaching-step retries + 5/5) · 2★ (pass,
  ≤2 retries or 4/5) · 1★ (pass) · 0★ (fail — lesson stays `inProgress`). Stored per lesson in
  `localStorage['smartmath.lessons']` alongside `bestAssessment`.
- **Resume:** entering `/lessons/:id` restarts from step 0 (simple, predictable for kids); only
  completion/stars/unlock state persists across sessions.

This is chosen over (a) linear/no-gating (weaker learning signal — a child can blitz through
without grasping) and (b) streak-based mastery (more pressure than "gentle" warrants at this age),
while still honoring the non-punitive tone.

## Alternatives Considered

- **Track starts at two-hand 0–99 (literal §8.3 outline).** Rejected for the beginner band: place
  value is too large a leap before number sense + digit fluency exist. Kept as the *next* unit.
- **One polished exemplar lesson only (vertical slice).** Rejected as the *design* scope (the
  curriculum arc — sense → fingers → +/− — only makes sense as a whole); but the **build** is still
  phased (Phase A ships one lesson end-to-end first). See the README's phased build order.
- **Assessment: linear / no gating.** Rejected — too weak a signal for a teaching product; "gentle
  mastery" keeps low pressure while ensuring grasp.
- **Assessment: streak-based (N correct in a row).** Rejected — more pressure than appropriate for
  5–6 y/o; 4/5 is already a lenient bar.
- **TTS: recorded audio files vs. synthesized SpeechSynthesis.** Rejected files — they bloat the
  bundle and conflict with the offline/zero-eggress stance. `speechSynthesis` is local and free.
- **TTS: defer to §8.4.** Rejected for this band — pre-readers cannot use the lessons without it, so
  it is pulled into scope here.

## Impact

- **Positive:** a real teaching surface for the youngest users; pulls TTS forward (unblocks
  pre-reader independence); establishes a data-only lesson-authoring model (`src/content/lessons.ts`
  + i18n) that future units (0–99, times tables, comparison sequences) extend without new code.
- **Negative / trade-off:** net-new context (`LessonsContext`), content layer, TTS hook, and step UI
  (non-trivial Phase A–C work); SpeechSynthesis voice quality/availability is OS-dependent (mitigated
  by a `supported` flag + glyph fallbacks); assessment adds persisted state.
- **Neutral:** no changes to the Play game loop, `fingerMathLogic`, `useAutoSubmit`, or
  `GameContext` — all edits are additive (`CameraView.digitMode` defaults off; `mathGenerator`
  exports are non-breaking).

## Decision

Accepted — build the **"First Numbers" 0–9 single-hand track for ages 5–6**, with **spoken
instructions (in scope)** and **gentle 4/5 mastery + sequential unlock + stars**. Defer two-hand
0–99 to a follow-on unit. Implementation details in the [lessons README](../lessons/README.md);
architecture recorded in ADR-0009 after the build.
