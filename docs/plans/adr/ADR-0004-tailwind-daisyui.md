# ADR-0004 — Tailwind CSS + DaisyUI for styling & theming

- **Status:** Accepted
- **Date:** 2026-06-29

## Context

SmartHand Math needs a **vibrant, playful, kid-friendly** UI: pastel palette,
rounded shapes, large touch targets, micro-animations, and consistent
components (buttons, cards, modals, badges). For a small team and a fast-moving
Phase 1, we want styling that:

- Produces a consistent design system quickly, without hand-rolling a component
  library.
- Supports **theming** (so we can adopt a kid-friendly pastel look and swap it
  without rewriting markup).
- Plays well with **React + Vite + TypeScript** (the rest of the stack — see
  [`CLAUDE.md` §3](../../../CLAUDE.md)) and stays out of the critical path
  (no heavy runtime).

See [`CLAUDE.md` §8](../../../CLAUDE.md) ("Design Language & UX").

## Decision

Use **Tailwind CSS** (utility-first) plus the **DaisyUI** plugin.

- Tailwind provides utility classes composed directly in JSX; DaisyUI provides
  ready, themeable component classes (btn, card, modal, badge) and a theme
  system.
- For Phase 1 we ship a **custom theme named `smartmath`** (purple/amber), wired
  via `<html data-theme="smartmath">` and the DaisyUI plugin config in
  `tailwind.config.js`. A couple of bespoke keyframes (`pop`, `wiggle`) cover
  lightweight motion until `framer-motion` lands.
- **Adopting a built-in pastel DaisyUI theme (`cupcake` / `pastel`) is deferred
  to [Phase 3](../ROADMAP.md#phase-3--ux-polish--design-system)** and will go
  through the RFC → ADR workflow (see this ADR's Consequences). That is a
  styling/branding refinement, not an architectural change to this decision.

## Consequences

**Positive**

- **Rapid, consistent UI** — component classes give a coherent look without a
  custom component library.
- **Easy theming** — swapping the look is a config/theme change, not a markup
  rewrite; the Phase 3 pastel migration is therefore low-risk.
- **Tiny runtime cost** — utilities are compiled away; no CSS-in-JS runtime on
  the hot path (relevant since the page is already running the wasm tracker).
- **TypeScript/Vite friendly** — standard, well-documented integration.

**Negative / trade-offs accepted**

- **Version coupling** to Tailwind and DaisyUI majors (e.g., DaisyUI v4 → v5,
  Tailwind v3 → v4 may need config changes). Accepted as a normal cost of using
  the ecosystem.
- **The current theme is not the intended pastel look yet** — that is a known
  gap tracked in [`CLAUDE.md` §15](../../../CLAUDE.md) and the ROADMAP, to be
  closed in Phase 3 via an RFC proposing the final pastel theme + an ADR
  recording it.

## Alternatives Considered

- **Vanilla CSS / CSS Modules.** Rejected for Phase 1: slower to build a
  consistent, playful design system by hand; loses DaisyUI's ready components.
- **CSS-in-JS (styled-components / Emotion).** Rejected: adds a runtime cost on
  a page already running wasm inference, with no SSR benefit (this is a static
  SPA).
- **A heavyweight component library (e.g., Material UI / Chakra).** Rejected:
  larger bundle, opinionated look that fights the kid-friendly pastel direction,
  and more than the project needs.
