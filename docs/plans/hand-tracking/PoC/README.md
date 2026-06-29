# PoC — Hand-tracking gesture→number mapping on real hardware

> Part of [Phase 2.5 — Hardware Verification](../../ROADMAP.md#phase-2--core-engine-verification--quality).
> Status: **verified** — handedness default confirmed live on real hardware
> (`INVERT_HANDEDNESS = false`, [ADR-0005](../../adr/ADR-0005-handedness-default.md)).
> The capture tool below remains available to bank automated regression samples.

## Hypothesis

The Soroban decoder in `src/utils/fingerMathLogic.ts` (`handValue`,
`handsToNumber`, `anatomicalHand`) maps a *real* webcam hand to the intended
0–99 number, with the **left hand = tens / right hand = units** routing the right
way around on the target hardware — given the correct `INVERT_HANDEDNESS` value.

We know it works when a real hand decodes (via the exact production code path) to
the number the player intends, for every digit and for two-handed tens/units
combos.

## What was tried

- **Live verification (done):** the app was run on a real webcam + MediaPipe
  `HandLandmarker` and the one-hand / two-handed tests below were performed
  directly. With the Phase-0 default `INVERT_HANDEDNESS = true` the left hand
  routed to **units** (swapped); flipping to `false` restored **left = tens /
  right = units**. See [ADR-0005](../../adr/ADR-0005-handedness-default.md).
- **Capture tool (available, optional):** [`capture.html`](./capture.html) loads
  `@mediapipe/tasks-vision` from a CDN, runs `HandLandmarker` in VIDEO mode
  (`numHands: 2`, GPU → CPU fallback), and serializes a frame's `TrackedHand[]`
  (21 landmarks + the **raw** `Left`/`Right` label + score) plus the intended
  number to a `.json` file. The consumer test
  [`fingerMathLogic.real.test.ts`](../../../../src/utils/fingerMathLogic.real.test.ts)
  asserts `handsToNumber(hands) === expectedNumber` for each fixture; it
  `describe.skip`s until a fixture exists, so CI stays green and it auto-activates
  once captures are dropped into `src/test/fixtures/hand-tracking/`.

### Reproduce the live check

Run the dev server (camera needs a secure context — `localhost` or HTTPS), then:

1. **One-hand test:** right hand out of frame, left hand showing 3 → Learn must
   read **30** (left = tens). Symmetrically, right hand showing 7 alone → **7**.
2. **Two-handed test:** left hand 3 + right hand 7 → **37**.

If a hand routes to the wrong slot, flip `INVERT_HANDEDNESS` in
`src/utils/fingerMathLogic.ts` and re-check.

### (Optional) Bank automated regression captures

```bash
python3 -m http.server 8080   # from repo root
# open http://localhost:8080/docs/plans/hand-tracking/PoC/capture.html
```

Set the **Intended number**, show the gesture, click **Capture sample**, and move
the downloaded `<label>.json` into `src/test/fixtures/hand-tracking/`. Cover
left + right hand for each digit 0–9 and a few two-handed combos, ideally across
≥2 orientations/lighting. `npm run test:run` then runs them as regression tests.

## Result

Live testing on the target hardware: with `INVERT_HANDEDNESS = true` the
handedness came out swapped (left hand → units); after flipping to `false`, the
one-hand test (lone left hand = 3 reads **30**) and the two-handed test
(left 3 + right 7 reads **37**) both pass. The distance-based per-finger decoding
was correct throughout — only the tens/units routing was affected by the toggle.

## Verdict

**Proceed.** `INVERT_HANDEDNESS = false` is the verified default for this
hardware, recorded in [ADR-0005](../../adr/ADR-0005-handedness-default.md).
Phase 2.5 is closed (ROADMAP §2.5 → `[x]`). The capture tool + real-fixture test
remain as an opt-in way to lock the mapping into the automated suite; they are
not required for the Phase-2 exit criteria.
