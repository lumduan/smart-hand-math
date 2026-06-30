# SmartHand Math — Data handling (for parents & teachers)

> Plain-language summary of what the app does with data. See [FRD §7 Privacy
> Requirements](../frd.md) and [HLD §7 Threat/Privacy Model](../hld.md) for the
> technical detail; [ADR-0001](../adr/ADR-0001-client-side-no-backend.md) for the
> "no backend" decision.

**Short version: SmartHand Math has no server. Nothing about your child leaves
their device — not the camera image, not their answers, not their score.**

## What happens on the device

- **The camera stays in the browser.** When your child taps **Start**, the
  webcam stream is read by a hand-tracking model that runs **entirely inside the
  browser** (WebAssembly). The video is processed frame-by-frame to count
  fingers and is **never recorded, uploaded, or sent anywhere.** Close the tab
  and it's gone.
- **No accounts, no sign-in.** There is nothing to log in to and no profile.
- **No analytics or tracking.** The app contains no analytics, telemetry,
  advertising, or third-party trackers.
- **The only thing saved is on your own device:** the child's best score and a
  few settings (volume, mirror, language) are stored in the browser's
  `localStorage`. Clearing the site data erases them.

## What the app loads from the network (and after Phase 6, nothing)

After Phase 6, **even the AI model and the font are bundled with the app**
("self-hosted" under `/models` and `/fonts`), so:

- **Zero network egress** in normal use — the app works fully **offline** once
  loaded (it's an installable PWA).
- No camera image, finger data, or answer ever travels over the network at any
  point.

## How anyone can verify this

The privacy posture is verifiable by inspection, not trust:

```bash
# Confirm no app code makes network requests for user/media data:
grep -rE 'fetch|XMLHttpRequest|sendBeacon|analytics|telemetry' src
# → only references are the self-hosted model/wasm paths (no external endpoints).
```

## Why this matters

Because no data is collected, there is no data to breach, sell, or misuse — the
design is COPPA (US) and GDPR-for-children (EU) friendly by construction. The
trade-off is that progress does not sync across devices (a future, opt-in,
local-first feature is Phase 8).

## Controls

- **Grant/deny camera:** the browser's normal camera permission applies; deny it
  and the app is still playable via the on-screen number pad.
- **Clear data:** the browser's "clear site data" removes the saved best score
  and settings.
