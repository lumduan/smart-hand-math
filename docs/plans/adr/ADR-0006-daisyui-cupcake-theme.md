# ADR-0006 — Adopt the DaisyUI `cupcake` theme

- **Status:** Accepted
- **Date:** 2026-06-29

## Context

The Phase-0 scaffold used a custom DaisyUI theme (`smartmath`: vivid purple on
white) plus a Tailwind `brand` color namespace. The design intent is a softer,
playful, kid-friendly pastel (see [`CLAUDE.md` §8](../../../CLAUDE.md) and
[RFC-0001](../rfc/RFC-0001-adopt-pastel-theme.md)). Phase 3 requires adopting a
built-in pastel DaisyUI theme and recording the decision.

Most of the UI already uses DaisyUI **semantic** classes (`btn-*`, `badge-*`,
`card`, `modal-*`, `bg-base-*`, `text-base-content`), which re-skin
automatically when the theme changes. Only a few spots depended on the custom
palette: the `brand` color namespace (`text-brand-primary`/`accent`, ~8 uses),
two canvas hexes in `CameraView.tsx`, and the `theme-color` meta in `index.html`.

## Decision

Adopt the built-in **DaisyUI `cupcake`** theme:

- `tailwind.config.js`: `daisyui.themes: ['cupcake']` (light only); remove the
  custom `smartmath` theme, the `brand` color namespace, and the unused
  `wiggle` keyframe.
- Migrate `text-brand-primary` → `text-primary`, `text-brand-accent` →
  `text-accent` everywhere (so the text follows the theme).
- `index.html`: `data-theme="cupcake"`; `theme-color` → cupcake primary
  (`#65c3c8`).
- `CameraView.tsx`: skeleton stroke → `#65c3c8` (primary), joint fill →
  `#eeaf3a` (accent).

Cupcake palette: primary `#65c3c8` (teal), secondary `#ef9fbc` (pink), accent
`#eeaf3a` (amber), base `#faf7f5` (cream), content `#291334` (plum),
`--rounded-btn: 1.9rem` (generously rounded — on-brand for kids).

## Consequences

**Positive**

- Instantly matches the playful, pastel, kid-friendly design language with zero
  custom theme to maintain.
- Semantic tokens mean a future theme swap is a one-line config change.
- `cupcake`'s high `--rounded-btn` reinforces the rounded, tactile feel already
  used (`rounded-3xl`, `rounded-full`).

**Negative / trade-offs accepted**

- The brand color shifts from purple to teal/pink — a deliberate aesthetic
  change, not a bug. (Favicon `✋` on a purple rounded square in
  `public/assets/favicon.svg` is now slightly off-palette; a Phase-6 polish can
  re-tint it.)
- `cupcake` is light-only; no dark theme (`darkTheme: false` retained).

## Alternatives Considered

- **DaisyUI `pastel`** — softer/earthier; less playful. Rejected.
- **Custom purple-pastel theme** — keeps the purple identity but adds a custom
  theme to maintain. Rejected in favour of a zero-maintenance built-in.
