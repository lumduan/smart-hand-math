# Camera display size (Phase 8.1)

> Part of [Phase 8 — Enhancement / Future Vision](../ROADMAP.md#phase-8--enhancement--future-vision).
> Status: **implemented**. Tech: React context + Tailwind (no new deps).

Some users find the camera preview too small. Make it resizable to a persisted
preference — including BIGGER than today (Large = full width).

## Goal

A global, persisted camera-size preference (Small / Medium / Large) on Play and
Learn. Medium = today; Large = full main width.

## Design

- **Control:** 📷 cycle button in the navbar (beside mirror/mute). One tap cycles
  Small → Medium → Large → Small. No slider (would be the first in the codebase;
  discrete steps suit the kid audience).
- **Placement:** global navbar → affects Play + Learn uniformly.
- **Sizes:**
  - `sm` — camera capped (~60% width) + centered in its column.
  - `md` — today's size (default).
  - `lg` — camera breaks to full main content width (own row) → genuinely bigger.
- **Consumption:** `CameraView` reads `cameraScale` from `useAppSettings()` and
  applies the `sm` cap + `mx-auto` on its root wrapper; Play & Learn read
  `cameraScale` and switch to a full-width camera row when `lg`. On mobile
  (single-column) `lg` ≈ `md` (already full width).

## Settings (`AppSettingsContext`)

- `cameraScale: 'sm' | 'md' | 'lg'` (default `'md'`). Persisted in
  `PersistedSettings`; `loadPersisted` merge (`{ ...fallback, ...parsed }`) is
  forward-compatible, so existing users fall back to `'md'` with no migration.
- Setter `setCameraScale` matching the per-field `useCallback` idiom (e.g.
  `setVolume`).

## i18n (`src/i18n/strings.ts` → `nav` block)

- `cameraSizeAria`, `cameraSizeSm`, `cameraSizeMd`, `cameraSizeLg`.

## Files to touch

- `src/context/AppSettingsContext.tsx` — add `cameraScale` + setter (public
  `AppSettings` interface, `PersistedSettings`, `fallback` in `loadPersisted`,
  and the `useMemo` value object + dep array).
- `src/components/camera/CameraView.tsx:40,124` — read `cameraScale`; apply the
  `sm` cap + `mx-auto` centering on the root wrapper (`w-full aspect-video`).
- `src/pages/Play.tsx:218-219` & `src/pages/Learn.tsx:19-22` — read `cameraScale`;
  render the camera in a full-width row when `lg` (reflow the `lg:grid-cols-2`).
- `src/layouts/MainLayout.tsx:52-90` — add the 📷 cycle button beside mirror/mute.
- `src/i18n/strings.ts` (`nav` block) — labels.
- Tests: `src/context/AppSettingsContext.test.ts` — persistence for `cameraScale`.

## Notes / edge cases

- Status badges, start/stop button, and error overlay are `absolute inset-0`
  inside the root wrapper → scale with it; no layout change.
- Confirm `sm` keeps the `btn-circle` start button comfortably tappable on small
  phones.

## Exit criteria

Camera resizes on Play + Learn (incl. full-width Large); choice persists across
reloads; default unchanged (`md`). No new dependencies.

## RFC / ADR?

No — low-risk, reversible, no architectural decision. A README is enough.
