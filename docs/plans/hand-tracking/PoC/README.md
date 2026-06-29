# PoC — Hand-tracking gesture→number mapping on real hardware

> Part of [Phase 2.5 — Hardware Verification](../../../ROADMAP.md#phase-2--core-engine-verification--quality).
> Status: **awaiting first capture**.

## Hypothesis

The Soroban decoder in `src/utils/fingerMathLogic.ts` (`handValue`,
`handsToNumber`, `anatomicalHand`) and the current `INVERT_HANDEDNESS = true`
default correctly map a *real* webcam hand to the intended 0–99 number, across
hand orientations and lighting — i.e. the gesture a child actually makes decodes
to the number they mean, with the **left hand = tens / right hand = units**
routing the right way around.

We will know it works when captured landmark samples decode (via the exact
production code path) to the number the operator intended, for every digit and
for two-handed tens/units combos.

## What was tried

- **Capture tool:** [`capture.html`](./capture.html) — a standalone page that
  loads `@mediapipe/tasks-vision` from a CDN, runs `HandLandmarker` in VIDEO
  mode (`numHands: 2`, GPU → CPU fallback, mirroring the app), draws the
  skeleton, and on demand serializes the current frame's
  `TrackedHand[]` (21 landmarks + the **raw** `Left`/`Right` label + score per
  hand) plus the operator-entered intended number into a `.json` file.
- **Consumer test:** [`src/utils/fingerMathLogic.real.test.ts`](../../../src/utils/fingerMathLogic.real.test.ts)
  globs `src/test/fixtures/hand-tracking/*.json` and, for each fixture, asserts
  `handsToNumber(hands) === expectedNumber` (and that each hand decodes to a
  digit 0–9). It `describe.skip`s until the first fixture is dropped in, so CI
  stays green now and auto-activates once captures exist.

### Run the capture

From the repo root (camera needs a secure context — `localhost` qualifies):

```bash
python3 -m http.server 8080
# open http://localhost:8080/docs/plans/hand-tracking/PoC/capture.html
```

1. Click **Start camera**, allow webcam access.
2. Set the **Intended number** to the value you are physically showing.
3. Show the gesture; when a hand is tracked, click **Capture sample** → a
   `<label>.json` downloads.
4. Move the file into `src/test/fixtures/hand-tracking/`.

### Capture plan (minimum to satisfy Phase 2.5)

- **Left + right hand** for each digit **0–9** (one hand at a time, intended
  number = the digit).
- **Two-handed tens/units combos:** e.g. intended 37, 50, 99, 10, 25 — covering
  non-zero tens & units.
- Repeat across **≥ 2 orientations / lighting conditions** to confirm the
  distance-based detection is orientation-tolerant.

## Result

(filled in after capture — record how many fixtures passed/failed and any
systematic mismatches.)

## Verdict

Proceed / iterate / abandon — to be set once captures exist. If two-handed
numbers come out with tens and units **swapped** (e.g. 37 reads as 73, or a
single hand routes to the wrong slot), that is the `INVERT_HANDEDNESS` default
being wrong for this hardware: flip the constant in
`src/utils/fingerMathLogic.ts` and re-run. Record the final default **and** any
tuned detection thresholds in **ADR-0005**, then flip ROADMAP §2.5 to `[x]`.
