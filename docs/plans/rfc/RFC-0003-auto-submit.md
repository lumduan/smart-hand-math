# RFC-0003 — Auto-submit (gesture-held answer commit)

- **Status:** Proposed
- **Author:** Claude (with project owner)
- **Date:** 2026-06-30
- **Related:** [ROADMAP §8.2](../ROADMAP.md#82-auto-submit-gesture-held-answer-commit),
  [auto-submit README](../auto-submit/README.md)

## Problem

Today the Play page silently auto-commits an answer after a held 500ms — but ONLY
when the held number equals the correct answer ([`Play.tsx:78-88`](../../src/pages/Play.tsx),
`ANSWER_HOLD_MS = 500`). A held WRONG gesture never commits, there is no visible
signal to the child, and the timing is invisible. We want a predictable, visible
"hold to submit" affordance that commits ANY held answer (right or wrong) after a
prompt, with a chance to correct by changing the gesture. Timing must be tunable
so we can find the optimal value before setting a default.

## Proposal

Replace the silent 500ms correct-only commit with a two-stage visible flow:

1. **Prompt (T1, default 1500ms):** the denoised finger number stays constant →
   show "Submitting N…" with a progress ring.
2. **Commit (T2, default 1000ms more):** keep holding the same number → commit.
   Any change, or the hand leaving frame (`-1`), cancels immediately and restarts.

Implementation:

- New `src/hooks/useAutoSubmit.ts`: a time-driven loop (rAF or `setInterval`)
  armed only while `status==='playing' && !lastAnswer`. Raises the prompt at T1,
  commits at T1+T2; resets on question change. It does NOT rely on the current
  "effect re-fires because `detected` changed" pattern — that is jitter-dependent
  and also unreliable when a hand is perfectly still (React bails out of a
  re-render when `detected` is `Object.is`-equal, so a stable hand may never
  re-trigger the commit). An explicit timer loop fixes this.
- Calls the existing `submit(n)` ([`Play.tsx:61`](../../src/pages/Play.tsx)), so
  the `submittedFor` dedupe still holds.
- Inline `motion.div` prompt replaces the "showing/waiting" badge
  ([`Play.tsx:210-214`](../../src/pages/Play.tsx)) when pending;
  `role="status"` + `aria-live="polite"`.
- Keys off the already-denoised `detected` value (6-frame mode filter in
  `CameraView`). No extra smoothing. `-1` (no hand) never starts the timer.

Settings (persisted, tunable): `autoSubmitEnabled` (default `true`),
`autoSubmitPromptMs` (1500), `autoSubmitConfirmMs` (1000). `enabled=false` falls
back to the legacy 500ms silent hold — doubling as an A/B switch and a safety net.

Tuning: a temporary `?tune` floating panel (`src/components/dev/TunePanel.tsx`,
query-param-gated so it works in the deployed PWA) with sliders for prompt /
confirm ms + an enable toggle (and a `cameraScale` stepper, shared with §8.1).
A/B a few (prompt, confirm) pairs; record the winner in ADR-0008, hard-code it as
the default, then delete the panel.

## Alternatives Considered

- **Coexist (keep 500ms for correct + AutoSubmit for the rest):** rejected. A
  correct answer commits at 500ms and can never be held to 1.5s, so the prompt
  would only ever precede WRONG answers — incoherent ("Submitting 5…" would
  de-facto mean "5 is wrong, change it").
- **User-toggleable mode per device:** the `autoSubmitEnabled` flag already
  provides this for experimentation without shipping two first-class paths.

## Impact

- **Positive:** visible, fair, correctable submit; a stronger anti-tremor gate
  (1500ms >> 500ms); fixes the latent "perfectly still hand may not fire" bug.
- **Negative / trade-off:** correct-answer feedback slows ~0.5s → ~2.5s, which
  pressures Timed mode (60s clock). Mitigated by tunable T1/T2 (e.g. 600+400).
- **Neutral:** keypad path unaffected (`detected` stays `-1`).

## Decision

Accepted — implement REPLACE with the `autoSubmitEnabled` fallback flag. Record
the chosen defaults in ADR-0008 after tuning.
