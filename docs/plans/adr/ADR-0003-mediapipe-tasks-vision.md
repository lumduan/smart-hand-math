# ADR-0003 — MediaPipe `tasks-vision` HandLandmarker

- **Status:** Accepted
- **Date:** 2026-06-29

## Context

The product's defining feature is recognizing the number a child's hand(s)
represent via the webcam, in real time, entirely in the browser (see
[ADR-0001](./ADR-0001-client-side-no-backend.md)). We need a hand-tracking
solution that:

- Runs **fully client-side** in WebAssembly (no frame leaves the device).
- Returns the **21-landmark hand model** (so we can compute per-finger
  extension via geometry — see [ADR-0002](./ADR-0002-soroban-finger-counting.md))
  **plus a handedness label and score** per hand (needed to route a hand to the
  tens vs. units slot).
- Tracks **two hands** simultaneously and supports a **video/streaming** mode.
- Is **maintained** and offers **GPU acceleration** with a CPU fallback (some
  browsers/contexts block the GPU delegate).

See [`CLAUDE.md` §3](../../../CLAUDE.md) for the tech stack and §5 for the
detection loop. Implementation: [`src/hooks/useHandTracker.ts`](../../../src/hooks/useHandTracker.ts).

## Decision

Use **`@mediapipe/tasks-vision`** and its **`HandLandmarker`** API.

- **Runtime mode:** `runningMode: 'VIDEO'`, with a `requestAnimationFrame` loop
  that calls `detectForVideo(video, monotonicTimestampMs)` **only on new frames**
  (`video.currentTime` changed) using a **strictly increasing** timestamp.
- **Delegate:** try the **GPU** delegate first; on init failure, fall back to
  **CPU** (some browsers/contexts block GPU). This keeps the app usable on a
  wider range of devices.
- **`numHands: 2`** (default) so two-handed 0–99 answers are captured.
- **Assets:** load the model `.task` and the wasm folder from a **CDN by
  default** (`VITE_MEDIAPIPE_MODEL_URL` / `VITE_MEDIAPIPE_WASM_URL`), but allow a
  fully **self-hosted** copy under `public/models/` for offline / maximum-privacy
  deployments (set the two env vars to local paths).
- The hook maps each detection into a `TrackedHand[]` (21 landmarks + raw
  `"Left"`/`"Right"` handedness + confidence score), keeps the callback fresh
  via a ref (no loop restart), and cleans up the stream + landmarker on unmount.

## Consequences

**Positive**

- **Google-maintained**, high-quality, production-grade model and runtime; the
  modern successor to the older `@mediapipe/hands` API.
- **21 landmarks + handedness + score** per hand — exactly what the Soroban
  decoder (ADR-0002) needs, including the confidence used to break same-side
  ties in `handsToNumber`.
- **GPU acceleration with CPU fallback** → good performance on capable devices,
  graceful degradation elsewhere.
- **Self-hostable** for offline / privacy-hardened deployments (aligns with
  ADR-0001 and the [Phase 6](../ROADMAP.md) offline/PWA goal).

**Negative / trade-offs accepted**

- **Multi-megabyte wasm bundle** downloaded by the client (mitigated by CDN
  caching, optional self-host, and Phase 6 code-splitting / lazy loading of the
  tracker).
- **CDN dependency by default** — if the CDN is unreachable the tracker won't
  initialize; mitigated by the self-host option. (Self-hosting is the documented
  fallback, not the Phase 1 default.)

## Alternatives Considered

- **TensorFlow.js (`hand-pose-detection` / `handpose`).** Rejected: lower
  landmark quality and slower-moving maintenance in our evaluation, and
  handedness is not a first-class output — we'd have to derive anatomical hand
  from geometry, adding fragility exactly where ADR-0002 already has a known
  swap problem.
- **Legacy `@mediapipe/hands` (the older solution API).** Rejected: superseded
  by `tasks-vision`; staying on it would mean integrating against a deprecated
  API.
- **MediaPipe Holistic (hands + pose + face).** Rejected as overkill: far
  heavier for a use case that only needs hands, increasing bundle size and
  compute for no Phase-1 benefit.
