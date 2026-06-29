# ADR-0005 — Handedness default: `INVERT_HANDEDNESS = false`

- **Status:** Accepted
- **Date:** 2026-06-29

## Context

[ADR-0002](./ADR-0002-soroban-finger-counting.md) fixes the place-value rule:
the player's anatomical **left hand = tens**, **right hand = units**. To route
each hand into the correct slot, `handsToNumber` consults `anatomicalHand`, which
applies the `INVERT_HANDEDNESS` constant — a single, deliberately-flippable
toggle for the well-known "MediaPipe handedness label may be swapped on a webcam"
problem (the model is trained assuming a mirrored/selfie frame; a non-mirrored
webcam frame can therefore produce swapped `Left`/`Right` labels).

The Phase-0 default was `INVERT_HANDEDNESS = true`, with an explicit note
([ROADMAP §2.5](../ROADMAP.md#phase-2--core-engine-verification--quality),
[`CLAUDE.md` §4.5](../../../CLAUDE.md)) that the correct value must be
**confirmed on real hardware** before Phase 2 could close.

That live verification has now happened: running the app on a real webcam +
`@mediapipe/tasks-vision` `HandLandmarker`, with `INVERT_HANDEDNESS = true` the
player's **left hand was routed to the units slot** (and right to tens) — i.e.
the mapping came out **swapped** versus the design. The one-hand test (only the
left hand in frame, showing 3, read as `3` instead of `30`) confirmed it.

## Decision

Set **`INVERT_HANDEDNESS = false`** in
[`src/utils/fingerMathLogic.ts`](../../../src/utils/fingerMathLogic.ts).

On the verified hardware the raw MediaPipe labels are **not** swapped relative to
the player's anatomical hands, so the labels are used as-is: raw `Left` → tens,
raw `Right` → units, giving the intended **left hand = tens / right hand = units**
without inversion. After the flip, the one-hand test reads `30` for a lone left
hand showing 3, and two-handed `left 3 + right 7` reads `37`.

## Consequences

**Positive**

- The gesture→number mapping now matches [ADR-0002](./ADR-0002-soroban-finger-counting.md)
  and `CLAUDE.md` §4.2 on the verified hardware.
- Closes [Phase 2.5](../ROADMAP.md#phase-2--core-engine-verification--quality)
  ("gesture→number mapping verified on real hardware") — the last open Phase-2
  item.
- The toggle remains a single, documented constant, so re-targeting another
  device is a one-line change.

**Negative / trade-offs accepted**

- The "correct" value is **device/browser-dependent**. What is `false` on the
  verified camera could be `true` on a different webcam/mirror configuration.
  This default is validated for the tested setup only; a new device showing the
  wrong hand as tens means flipping the constant back (and, ideally, recording a
  real landmark capture under `src/test/fixtures/hand-tracking/` to lock it in as
  an automated regression via `fingerMathLogic.real.test.ts`).

**Neutral**

- The unit tests are written to be `INVERT_HANDEDNESS`-aware (they derive the
  tens/units raw labels and the `anatomicalHand` expectation from the imported
  constant), so they pass unchanged for either value — they guard the routing
  logic, not a specific default.

## Alternatives Considered

- **Keep `INVERT_HANDEDNESS = true`.** Rejected: produced the swapped mapping on
  the verified hardware (left hand → units), contradicting ADR-0002.
- **Auto-detect the correct value per device** (e.g. a calibration step or
  heuristics on landmark geometry). Deferred — not needed for Phase 2; the manual
  toggle plus the capture-tool regression path is sufficient for now, and could
  be revisited if the app ships across many device classes.
