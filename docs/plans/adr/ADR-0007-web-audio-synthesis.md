# ADR-0007 — Synthesized Web Audio sound effects (replaces Howler + mp3 files)

- **Status:** Accepted
- **Date:** 2026-06-29

## Context

Phase 0 wired a Howler.js hook (`src/hooks/useAudio.ts`) expecting six
`.mp3` files in `public/audio/` (`correct`, `wrong`, `click`, `win`, `lose`,
`tick`). Those files were never sourced, so the app has always run **silent**
(Howler no-ops on missing files). Phase 3.4
([ROADMAP §3.4](../ROADMAP.md#phase-3--ux-polish--design-system)) requires the
app to be audible.

Shipping real sound-effect files means choosing/licensing/attributing assets
(per the ROADMAP "source/license + attribution" note) and bundling them — a
licensing and asset-management burden for a children's product that also aims to
be offline-capable and privacy-light. All the sounds we need are short,
programmatic cues (a correct chime, a wrong buzz, a click, a tick, a win
fanfare, a lose descent).

## Decision

**Synthesize the sound effects in-browser with the Web Audio API**, and remove
Howler + the `public/audio/` mp3 files entirely.

- `useAudio.ts` lazily creates an `AudioContext` + master `GainNode` (driven by
  `AppSettingsContext` `volume`/`muted`), and `play(name)` schedules short
  enveloped oscillator tones per sound (e.g. `correct` = ascending C-E-G
  arpeggio; `wrong` = descending triangle; `win` = fanfare; `lose` = descending
  sad tones; `click`/`tick` = short blips). The public API is unchanged
  (`play`, `playCorrect`, …) plus a new `playTick`.
- The `AudioContext` is created on first play (after a user gesture, satisfying
  autoplay policies) and the hook no-ops when `AudioContext` is unavailable
  (SSR / jsdom / test), so it degrades gracefully.
- `howler` and `@types/howler` are removed from dependencies; `public/audio/`
  is deleted.

## Consequences

**Positive**

- **No files, no licensing, no attribution** — nothing to source or audit.
- **Works offline / self-hosted** with zero extra assets (aligns with the
  privacy/offline goals and [ADR-0001](./ADR-0001-client-side-no-backend.md)).
- **Smaller, dependency-lighter** bundle (Howler removed).
- **Tunable** — tone shapes/pitches live in one file and are easy to tweak.

**Negative / trade-offs accepted**

- **Less "polished" than curated SFX** — synthesized tones are clean but not
  voice/music-grade. Acceptable for short UI cues; real SFX can be added later
  (Howler or `<audio>`) without changing the call sites if a richer sound is
  ever wanted.
- **AudioContext requires a user gesture** to start audio (browser autoplay
  policy) — handled by lazy creation on first play; the very first sound after
  page load may be slightly delayed. Acceptable for a tap-driven kids' UI.
- Loses Howler's conveniences (sprite/positional audio, codec fallbacks) — none
  of which this app needs.

## Alternatives Considered

- **Ship licensed `.mp3` files** (the original Phase-0 plan). Rejected: sourcing
  + licensing + attribution burden, and extra assets to bundle/serve.
- **Generate placeholder `.mp3` tones via ffmpeg.** Rejected: adds a build
  tooling dependency and still ships files; Web Audio synthesizes the same tones
  with zero assets.
- **User-provided licensed `.mp3`s.** Rejected for now: keeps the dependency on
  Howler/files; can be revisited if higher-quality SFX are desired.
