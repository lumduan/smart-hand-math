# Work Breakdown Structure (WBS)

> Decomposes [`ROADMAP.md`](./ROADMAP.md) **Phases 2–7** into trackable tasks.
> Each block cross-links to its ROADMAP section; status uses the legend
> (`[ ]`/`[~]`/`[x]`/`[-]`) from [`README.md`](./README.md).
>
> Phase 0 (Bootstrap) and Phase 1 (these docs) are complete. Phase 8
> (Enhancement) is open-ended and not decomposed here.

---

## Phase 2 — Core Engine Verification & Quality
> *Lock in the Soroban engine with tests and real-hardware proof.*
> ROADMAP: [§Phase 2](./ROADMAP.md#phase-2--core-engine-verification--quality)

### 2.1 Test infrastructure
- [x] Add **vitest** + **jsdom** + **`@testing-library/react`**
- [x] Add `test` script to `package.json` + a coverage threshold
- [x] Wire `test` into `.github/workflows/ci.yml`

### 2.2 Finger-logic tests — [`src/utils/fingerMathLogic.ts`](../../src/utils/fingerMathLogic.ts)
- [x] Unit tests for `handValue` across **0–9** (synthetic 21-landmark fixtures per digit)
- [x] Unit tests for `handsToNumber` across **0–99** (tens/ones combos, missing-hand = 0, same-side tie → higher score)
- [x] Unit tests for `anatomicalHand` (with/without `INVERT_HANDEDNESS`)
- [x] Unit tests for `getFingerStates`

### 2.3 Math-generator tests — [`src/utils/mathGenerator.ts`](../../src/utils/mathGenerator.ts)
- [x] Per-difficulty answer-range invariants: **easy 0–9 / medium 0–50 / hard 0–99**
- [x] No out-of-range answers; `id` uniqueness; `subtraction` never negative

### 2.4 Component & context tests
- [x] `Button`, `Card`, `Modal`, `ScoreBoard`, `LevelBadge`, `Timer`
- [x] `GameContext` reducer: `START` / `ANSWER` (correct & wrong) / `NEXT` / `RESET`, `lives → status:'lost'`
- [x] `AppSettingsContext`: persistence via a `localStorage` mock

### 2.5 Hardware verification (PoC) → ADR-0005
- [~] `docs/plans/hand-tracking/PoC/` — capture tool + consumer tests scaffolded; **real capture pending** (webcam + hands), then verify the `INVERT_HANDEDNESS` default
- [ ] Confirm tens/ones mapping (left=tens, right=ones) across ≥2 orientations/lighting; tune distance thresholds
- [ ] Record final threshold values + handedness default in **ADR-0005**

---

## Phase 3 — UX Polish & Design System
> *A vibrant, animated, audible, kid-friendly experience.*
> ROADMAP: [§Phase 3](./ROADMAP.md#phase-3--ux-polish--design-system)

### 3.1 React upgrade
- [ ] Upgrade **React 18 → 19** (+ `@types/react`, `@types/react-dom`); update [`CLAUDE.md` §15](../../CLAUDE.md)

### 3.2 Theme
- [ ] RFC → ADR: adopt a pastel DaisyUI theme (`cupcake` / `pastel`) in place of custom `smartmath`
- [ ] Apply the chosen theme + refine color/contrast palette

### 3.3 Animation
- [ ] Add **`framer-motion`**
- [ ] `docs/plans/animations/PoC/` — prototype page transitions, correct/wrong feedback, confetti micro-rewards
- [ ] Roll the winning motion set into components

### 3.4 Audio
- [ ] Source/license + ship **`public/audio/*.mp3`** (`correct`, `wrong`, `click`, `win`, `lose`, `tick`) with attribution

### 3.5 Onboarding
- [ ] Camera-permission flow polish, empty states, kid-friendly copy & microcopy

---

## Phase 4 — Internationalization (i18n)
> *Zero inlined user-facing strings; English complete, Thai-ready.*
> ROADMAP: [§Phase 4](./ROADMAP.md#phase-4--internationalization-i18n)

- [ ] Extract all inlined strings → **`src/i18n/strings.ts`** (typed dictionary)
- [ ] `useStrings()` hook + locale context
- [ ] Active locale persisted in `localStorage`
- [ ] English (`en`) 100% complete; `th` structure stubbed (content is Phase 8)

---

## Phase 5 — Game Depth & Content
> *Replayable, age-appropriate, varied gameplay.*
> ROADMAP: [§Phase 5](./ROADMAP.md#phase-5--game-depth--content)

- [ ] Question variety: more operators, missing-number, comparison, sequences
- [ ] Game modes: timed / endless / missions
- [ ] RFC: adaptive difficulty curve
- [ ] Rewards: badges, streaks, level-up moments
- [ ] **Resolve known gaps** flagged in [`hld.md` §6](./hld.md): wire a win condition (or drop the unreachable `won` status) and the orphaned `Timer` (timed mode)

---

## Phase 6 — Accessibility, Performance & Privacy
> *Inclusive, fast, private, offline-capable.*
> ROADMAP: [§Phase 6](./ROADMAP.md#phase-6--accessibility-performance--privacy)

### 6.1 Accessibility
- [ ] **WCAG AA** audit: keyboard, screen-reader, focus order, contrast, `prefers-reduced-motion`

### 6.2 Performance
- [ ] Bundle analysis + perf budget
- [ ] Code-split / lazy-load MediaPipe and routes

### 6.3 Offline / PWA
- [ ] `docs/plans/offline/PoC/` — PWA manifest + service worker
- [ ] **Self-host** the MediaPipe model in `public/models/` (offline + privacy)

### 6.4 Hosting & privacy
- [ ] HTTPS guidance/config for non-localhost hosting (camera requires a secure context)
- [ ] Privacy review: re-confirm zero egress; write the parent/teacher data-handling note

---

## Phase 7 — Distribution & Release
> *One-command deploy and a tagged v1.0.0.*
> ROADMAP: [§Phase 7](./ROADMAP.md#phase-7--distribution--release)

- [ ] **nginx hardening**: gzip, cache headers, healthcheck, non-root user
- [ ] Deploy **CI/CD** (static host, e.g. GitHub Pages); optional GHCR image publish
- [ ] `RELEASING.md` runbook + `CHANGELOG.md` + semantic versioning
- [ ] Publish **v1.0.0** GitHub release

---

## Cross-References

- Architecture & data flow → [`hld.md`](./hld.md)
- Requirements (FR/NFR/A11Y/Privacy) → [`frd.md`](./frd.md)
- Decisions → [`adr/`](./adr/) (ADR-0001 client-side, ADR-0002 Soroban,
  ADR-0003 MediaPipe, ADR-0004 Tailwind+DaisyUI; ADR-0005 added in Phase 2.5)
- Master phased plan & current status → [`ROADMAP.md`](./ROADMAP.md)
