# ADR-0002 — Soroban finger-counting system (not Western 1-finger = 1)

- **Status:** Accepted
- **Date:** 2026-06-29

## Context

SmartHand Math teaches mental math and finger-counting using the **Soroban /
Asian single- and dual-hand finger system**, which is what the target audience
is actually learning in class. This is fundamentally different from the Western
convention "one extended finger = one unit."

We need a counting model that:

1. Is **authentic to the curriculum** the kids are being taught, so the app
   reinforces (not contradicts) what they learn.
2. Can represent a **useful range of answers** for mental-math questions. The
   Western one-finger-one-unit model caps a single hand at 5 and two hands at
   10 — far too small for subtraction tables or multiplication, which routinely
   need answers up to ~99.
3. Is **robust on a webcam**: tolerant of tilted, rotated, mirrored, and
   trembling children's hands, and tolerant of the well-known webcam
   handedness-label swap (see `INVERT_HANDEDNESS` below).

The MediaPipe `HandLandmarker` returns 21 normalized landmarks per hand
(`{x, y, z}`, `y` down, `[0,1]`), plus a `"Left"`/`"Right"` handedness label and
score per hand.

See [`CLAUDE.md` §4](../../../CLAUDE.md) ("Finger-Counting Math Logic") for the
full specification.

## Decision

Adopt the **Soroban / Asian positional finger-counting system**, implemented in
[`src/utils/fingerMathLogic.ts`](../../../src/utils/fingerMathLogic.ts).

**Per-hand digit (0–9):**

- The **thumb** (landmark 4) open contributes **5**.
- Each of **index / middle / ring / pinky** (tips 8 / 12 / 16 / 20) extended
  contributes **1**.
- So a closed fist = 0 and a fully open hand = 5 + 4 = **9**.

**Two-hand place value (0–99):**

- The player's anatomical **left hand = tens** column (×10).
- The player's anatomical **right hand = units** column (×1).
- `number = (leftValue × 10) + rightValue`. A missing hand contributes 0.

**Detection rules (deliberately orientation- and handedness-independent):**

- A non-thumb finger is "extended" when its **tip is farther from the wrist than
  its PIP joint** (`dist(tip, wrist) > dist(pip, wrist)`). This survives tilted
  / rotated hands, unlike a naive `tip.y < pip.y` test that assumes an upright
  hand.
- The thumb is "open" when its **tip is farther from the pinky-MCP than its IP
  joint** (`dist(thumbTip, pinkyMCP) > dist(thumbIP, pinkyMCP)`) — an open thumb
  reaches across the palm.
- **Handedness is only consulted to assign each hand its tens/units role**, not
  to compute the digit.

**The handedness-swap bug class has a single toggle.** Webcams feed a
non-mirrored frame to a model trained on mirrored (selfie) frames, so the raw
MediaPipe `"Left"`/`"Right"` labels *may* come out swapped relative to the
player's anatomical hand (this is device-dependent). It is corrected by one
easily-flipped, documented constant:

```ts
export const INVERT_HANDEDNESS = false // verified on real hardware (ADR-0005)
```

`anatomicalHand(raw)` applies the flip; `handsToNumber()` routes each hand to
tens/units through it. **Verified on real hardware (Phase 2.5): the default is
`false`** — see [ADR-0005](./ADR-0005-handedness-default.md). If a new device
shows the wrong hand counting as tens, flip that one constant.

## Consequences

**Positive**

- **Curriculum-authentic.** Reinforces the Soroban / Asian technique the target
  audience is actually learning.
- **Useful answer range.** Two hands reach **0–99**, which covers the
  subtraction and multiplication tables the math generator needs (see
  [`CLAUDE.md` §4.7](../../../CLAUDE.md) — easy 0–9, medium 0–50, hard 0–99).
- **Robust.** Distance-based tests are insensitive to hand orientation, mirror
  flips, and tilt; the digit never depends on handedness.
- **One-place fix** for the entire "wrong hand = tens" bug class
  (`INVERT_HANDEDNESS`).

**Negative / trade-offs accepted**

- **Steeper than Western counting** for users who don't know Soroban — but that
  is the point of the product, and the Learn page coaches it.
- **Handedness-swap is a real, if contained, bug class.** It is mitigated by the
  toggle; the default has now been **verified on real hardware as `false`**
  ([ADR-0005](./ADR-0005-handedness-default.md)). The "correct" value is
  device-dependent, so a new camera showing the wrong hand as tens still means
  flipping the constant (and ideally banking a landmark capture as a regression).

## Alternatives Considered

- **Western 1-finger = 1 unit (one hand 0–5, two hands 0–10).** Rejected: off
  the target curriculum, and the ~10 cap makes subtraction/multiplication
  unanswerable by hand.
- **Two-hand Western (0–10).** Same range problem as above.
- **Chisenbop / two-handed ten-finger (right hand 1–9 via thumb+four, left hand
  tens).** A legitimate positional system, but more complex to teach and detect
  than Soroban, and not the technique the target curriculum uses. Not chosen for
  Phase 1; could be revisited as an alternate mode later.
