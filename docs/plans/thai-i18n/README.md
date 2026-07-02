# Thai localization (`th`) — real translation + Thai font + Thai TTS

> Part of [ROADMAP §8.4](../ROADMAP.md#84-longer-term--future-vision-deferred) (i18n content).
> Status: **in progress** — Thai first; further languages later. Builds on the Phase-4 i18n pipeline
> and the lessons architecture ([ADR-0009](../adr/ADR-0009-guided-lessons-architecture.md)).

## Goal

Make the app fully usable in **Thai** for the 5–6-year-old Thai/Soroban audience: a real `th`
translation of every user-facing string, a Thai-capable **display font** that matches the app's
child-friendly look, and **Thai text-to-speech** so pre-readers hear Thai narration. English is
untouched; this is a **data + font + small `useTts`** change — no component refactors (the Phase-4
pipeline made adding a locale data-only).

## What's already Thai-ready (no work)

- `useStrings()` returns `STRINGS[locale]`; `locale` is persisted (`AppSettingsContext`); the nav has
  an **EN/TH switcher** (`MainLayout.tsx`); `useDocumentMeta` sets `document.documentElement.lang`
  from `t.doc.lang`; `type Strings = typeof en` + the `strings.test.ts` **key-parity** test enforce a
  complete `th`. Today `STRINGS.th = en` (stub).

## Approach

### 1. Font — Mitr, via a display **stack** (no locale logic)

Baloo 2 (the display font, `font-display` utility) is self-hosted via `@fontsource/baloo-2` and has
**no Thai subset**. Rather than swap fonts per-locale, add Mitr to the stack:

- `npm i @fontsource/mitr`; import weights `400/500/600/700` in `src/main.tsx` (self-hosted, no CDN —
  keeps the zero-egress posture, ADR-0001).
- `tailwind.config.js` → `fontFamily.display = ['"Baloo 2"', '"Mitr"', 'system-ui', 'sans-serif']`.
  Latin keeps rendering in Baloo 2; Thai glyphs (absent in Baloo 2) fall through to **Mitr**
  per-glyph. Body text stays the system font (matching today's English design → the OS Thai font).

Mitr chosen (user-approved) as the closest child-friendly match to Baloo 2's rounded warmth.

### 2. TTS — locale-aware Thai voice (`src/hooks/useTts.ts`)

Currently English-hardcoded (`v.lang.startsWith('en')`, `utter.lang='en-US'`). Make it locale-aware:

- read `locale` from `useAppSettings`; filter voices by prefix (`th` → `'th'`, else `'en'`);
  `hasVoices = (matching voices).length > 0` (locale-specific); `utter.lang = th-TH | en-US`; add
  `locale` to the voice-pick effect deps so it re-picks on switch.
- No cloud/bundled voice (breaks offline/no-backend). On a device **without a Thai voice**,
  `hasVoices` is false → `WatchView` uses its look-time timer (text-only), avoiding garbled Thai read
  by a non-Thai voice.

### 3. Translation — real `th: Strings` (`src/i18n/strings.ts`)

Replace `th: en` with a full Thai object: all ~9 UI sections + the lesson-prose maps
(`lessonTitles` 17 / `lessonObjectives` 17 / `lessonSteps` 65) + the ~17 interpolating functions
(same param shapes, enforced by `type Strings`). `th.doc.lang = 'th'`. **Math glyphs / digits / emoji
stay code-side** (untouched). Thai copy is simple, warm, child-appropriate; drafted here and reviewed
by the native-speaker maintainer.

**Accepted untranslated surface:** the `ErrorBoundary` crash card is pinned to `STRINGS.en` (it
renders without context, by design) — it stays English.

## Verification

- `npm run typecheck && npm run lint && npm run build` green (`th` must satisfy `type Strings`);
  `npm test -- --run` green (parity test guards `th` key completeness; a new `useTts` test covers
  locale-aware voice selection + `hasVoices`).
- **Live (dev server):** switch nav → **TH**; every surface (Home, Lessons list + a lesson, Play,
  Learn, nav, camera HUD) renders Thai in Mitr with no clipping (Thai diacritics stack taller — check
  heading line-heights); `documentElement.lang === 'th'`; a lesson still plays via the number pad.
- **Real device:** TTS speaks Thai with the device voice; EN↔TH re-picks the voice.

## Out of scope

Other languages ("and more") — Thai first. `ErrorBoundary` localization. Cloud/bundled TTS voices.
