# RFC-0001 — Adopt a pastel DaisyUI theme (replace custom `smartmath`)

- **Status:** Implemented
- **Author:** Claude (with project owner)
- **Date:** 2026-06-29

## Problem

Phase 0 shipped a custom DaisyUI theme, `smartmath` (vivid purple `#6d28d9`,
sky, amber on white), plus a parallel Tailwind `brand` color namespace. The
product's design intent ([`CLAUDE.md` §8](../../../CLAUDE.md)) is a *vibrant,
playful, kid-friendly pastel* — softer and more rounded than the current
high-contrast purple. Phase 3 ([ROADMAP §3.2](../ROADMAP.md)) calls for adopting
a built-in pastel DaisyUI theme and locking the choice by ADR.

## Proposal

Adopt the built-in **DaisyUI `cupcake`** theme and retire the custom
`smartmath` theme + the `brand` color namespace. Migrate the few custom-palette
touch-points (`text-brand-*`, the canvas skeleton hexes, the `theme-color` meta)
to DaisyUI semantic tokens (`text-primary`, `text-accent`) so the whole UI
re-skins through the theme.

## Alternatives Considered

- **DaisyUI `pastel`** — softer/earthier (muted teal/indigo). Less "sugary" than
  cupcake; rejected as less playful for the young audience.
- **Custom purple pastel** — keep a soft-lavender primary close to today's
  `#6d28d9`. Rejected: the owner preferred a built-in theme for zero maintenance,
  and cupcake's teal/pink/amber reads more kid-friendly than another purple.

## Impact

- `tailwind.config.js` (`themes: ['cupcake']`, drop `brand`/dead `wiggle`),
  `index.html` (`data-theme`, `theme-color`), `CameraView.tsx` skeleton colors,
  ~8 `text-brand-*` → semantic token swaps. Semantic DaisyUI classes
  (`btn-*`, `badge-*`, `bg-base-*`) re-skin automatically. No logic change.

## Decision

**Accepted — implement `cupcake`.** Recorded in
[ADR-0006](../adr/ADR-0006-daisyui-cupcake-theme.md).
