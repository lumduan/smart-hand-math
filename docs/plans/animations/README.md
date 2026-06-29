# Animations — motion set (Phase 3.3)

> Part of [Phase 3 — UX Polish](../ROADMAP.md#phase-3--ux-polish--design-system).
> Status: **implemented**. Tech: [`framer-motion`](https://www.framer.com/motion/) +
> [`canvas-confetti`](https://www.npmjs.com/package/canvas-confetti).

This records the "winning motion set" rolled into the components (see
[ADR-0006](../adr/ADR-0006-daisyui-cupcake-theme.md)).

## Page transitions
- `MainLayout.tsx` wraps `<Outlet/>` in `<AnimatePresence mode="wait">` + a
  `<motion.div key={location.pathname}>` (fade + 8px slide; ~200 ms). Navigating
  Home ↔ Learn ↔ Play animates the page swap.

## Entrances
- **Home** feature cards stagger in (`delay = i × 80 ms`, fade + slide).
- **Play** idle "Ready to play?" card fades/slides in on mount.

## Feedback
- **Play answer badge** (`motion.div`): correct → scale-pop; wrong → horizontal
  **shake** (`x: [0,-8,8,-6,6,0]`), replacing the old one-shot CSS `animate-pop`.
- **Learn** detected number swaps via a keyed `motion.div` (scale-pop on each new
  value).

## Celebrations (`src/utils/confetti.ts`)
- `burst()` — small confetti on every correct answer.
- `celebrate()` — bigger burst on streak milestones (every 5) and on a win.
- `finale()` — reserved for a future win condition (see note).
- All presets set `disableForReducedMotion: true` (respects
  `prefers-reduced-motion`).

## Modal
- `Modal.tsx` uses `AnimatePresence` so the game-over modal animates in (scale +
  fade) and **out** on close (previously it hard-cut by early-returning `null`).

## Notes / future
- **Win path is dormant:** the reducer never sets `status:'won'` (HLD §6 /
  Phase 5), so `playWin` + the win `celebrate()`/`finale()` are wired but won't
  fire until Phase 5 adds a win condition.
- **Hold-to-commit progress ring** (a motion ring showing the 500 ms answer-hold
  filling up) is a known nice-to-have, not yet implemented.
- All motion is short (≤400 ms) to keep the kid-focused UI snappy.
