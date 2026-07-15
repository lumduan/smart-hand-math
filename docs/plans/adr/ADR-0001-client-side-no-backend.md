# ADR-0001 — 100% client-side, no backend (Phase 1)

- **Status:** Accepted — **strengthened, see [Update](#update--2026-06-30-phase-6) below**
- **Date:** 2026-06-29

> ℹ️ The core decision below still stands. One detail is out of date: the Decision section says the
> MediaPipe assets are fetched "from a CDN by default". Since Phase 6 they are **self-hosted**, so
> the app now makes **no external requests at all** — see the
> [Update](#update--2026-06-30-phase-6). The text below is preserved as the 2026-06-29 record.

## Context

SmartHand Math is a product for young children learning mental math and
finger-counting (Soroban / Asian hand math). Two forces shape the architecture:

- **Children's-privacy regulation (COPPA in the US, GDPR-K / GDPR for children
  in the EU).** Any data leaving the device — a video frame, a landmark vector,
  a model input — is a privacy (and legal) liability for a product aimed at
  minors. The safest data is data that is never collected.
- **Cost & operational simplicity.** A backend that performs (or proxies)
  hand-tracking inference on every frame would incur continuous GPU/CPU spend,
  need scaling and uptime, and create a new attack/abuse surface. For a Phase 1
  MVP we want to minimize moving parts.

All of the actual AI work — MediaPipe `HandLandmarker` running in WebAssembly —
is capable of running entirely in-page in a modern browser. The only state we
need to persist is the player's best score and a few settings, which are tiny
and device-local.

See [`CLAUDE.md` §2.1](../../../CLAUDE.md) ("100% Client-Side Processing") for
the original statement of this constraint.

## Decision

**SmartHand Math has no backend in Phase 1.** All hand-tracking inference runs
in-page via the MediaPipe WebAssembly runtime (see
[ADR-0003](./ADR-0003-mediapipe-tasks-vision.md)). No video frame, landmark, or
model input ever leaves the browser.

- The production artifact is a **static site**: a multi-stage Docker build
  compiles the Vite bundle (`node` stage) and a slim `nginx` stage serves
  `dist/`. There is no Node/Python/Go runtime in production.
- The only persisted data is the player's **best score** (`localStorage` key
  `smartmath.best`) and **app settings** (`smartmath.settings`) — both on the
  user's own device.
- The only network requests the app makes are to **fetch the MediaPipe model
  (`.task`) and wasm assets** (from a CDN by default; overridable to fully
  self-hosted `public/models/` for offline / maximum-privacy deployments via the
  `VITE_MEDIAPIPE_MODEL_URL` / `VITE_MEDIAPIPE_WASM_URL` env vars). There is no
  analytics, telemetry, or account service.

## Consequences

**Positive**

- **Privacy by construction.** Because there is no egress path for media or
  inference data, the product is COPPA / GDPR-K-friendlier than any
  server-processed alternative — and easy to *prove* to a parent or teacher
  (one grep confirms no fetch of frame data).
- **Zero server inference cost.** No GPUs to pay for, no autoscaling, no cold
  starts. Runtime cost is effectively the static-host bill.
- **Trivial deploy & ops.** One static bundle behind nginx; no databases,
  secrets stores, or long-running services to babysit.
- **Works offline-capable.** With a self-hosted model, the app can run with no
  network at all (a Phase 6 goal).

**Negative / trade-offs accepted**

- **No cross-device sync or user profiles.** Best score and settings are
  per-device. Multi-profile / dashboard sync is explicitly deferred to
  [Phase 8](../ROADMAP.md#phase-8--enhancement--future-vision) and would require
  revisiting this ADR.
- **Larger client bundle.** The MediaPipe wasm is multi-megabyte, downloaded by
  the client (mitigated by CDN caching, optional self-host, and Phase 6
  code-splitting / lazy loading).
- **Device capability dependency.** Tracking quality depends on the player's own
  hardware/browser (GPU delegate with CPU fallback — see ADR-0003); low-end
  devices get a weaker experience than a beefy server would guarantee.

**Neutral**

- All "server-shaped" features (progress dashboards, leaderboards) are pushed to
  Phase 8 and must be opt-in / local-first if added.

## Alternatives Considered

- **Server-side inference API (browser streams frames → server returns
  landmarks).** Rejected for Phase 1: continuous inference cost, a streaming
  + scaling problem, network latency on the hot path, and — most decisively —
  it requires children's video to leave the device, directly undermining the
  privacy goal.
- **Hybrid (server model registry / config, client inference).** Rejected for
  Phase 1 simplicity; the static, env-var-driven model URL already covers the
  "which model" concern without a service. Can be revisited if a Phase 8
  dashboard needs it.

## Update — 2026-06-30 (Phase 6)

The privacy claim above got **stronger than originally written**. The Decision section says the
model/wasm are fetched "from a CDN by default"; Phase 6 (`e5631ac`) made **self-hosting the
default**, and the fonts (`@fontsource/baloo-2`, `@fontsource/mitr`) are bundled too.

**The app therefore makes zero external requests** — not "zero egress of video/landmarks, plus some
asset fetches", but no outbound contact with any third party whatsoever. Two consequences for the
claims made above:

- The "Privacy by construction" argument is now literally true rather than nearly true: there is no
  external origin to grep *for*. Since 2026-07-15 the production image also ships
  `Content-Security-Policy: default-src 'self'; connect-src 'self'`, which makes the guarantee
  **browser-enforced** rather than a property of our code that a future dependency could quietly
  break.
- "Works offline-capable — *with a self-hosted model*" is now unconditional; that is the default.

The "larger client bundle / CDN caching" trade-off in the Consequences section should be read as:
the multi-megabyte wasm is served from our own origin, mitigated by the PWA's `CacheFirst` runtime
caching and immutable edge caching rather than by a CDN. See [ADR-0003](./ADR-0003-mediapipe-tasks-vision.md#update--2026-06-30-phase-6)
for the asset-delivery reversal in full, and `DEPLOY-AWS.md` for how the CSP enforces it.

⚠️ Note for operators: enabling **Cloudflare Web Analytics** (or any edge feature that injects a
third-party script) contradicts this ADR — it would make the app contact a third party on every page
load. The CSP currently blocks such injections by design.
