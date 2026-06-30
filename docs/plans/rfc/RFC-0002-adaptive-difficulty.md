# RFC-0002 — Adaptive difficulty curve

- **Status:** Implemented
- **Author:** Claude (with project owner)
- **Date:** 2026-06-30

## Problem

The game must stay approachable for a young child on their first question and
remain engaging as they improve. A fixed difficulty is either too hard at the
start or too easy once they've practiced. Phase 5
([ROADMAP §5](../ROADMAP.md#phase-5--game-depth--content)) asks for a documented
"adaptive difficulty curve" rather than an ad-hoc one.

## Proposal (implemented)

Difficulty is a pure function of the running **score** in
[`src/utils/mathGenerator.ts`](../../src/utils/mathGenerator.ts):

```ts
function difficultyForScore(score: number): Difficulty {
  if (score < 5) return 'easy'
  if (score < 15) return 'medium'
  return 'hard'
}
```

The `GameContext` reducer re-derives difficulty after every **correct** answer
(`difficultyForScore(score)`) and uses it for the next generated question, so the
player ramps up smoothly and **a wrong answer never increases difficulty** (the
score only goes up on corrects). Each tier bounds the answer to what 1–2 Soroban
hands can show — **easy 0–9, medium 0–50, hard 0–99** — and mixes question types:

| difficulty | answer range | question mix |
| --- | --- | --- |
| easy | 0–9 | addition, subtraction, multiplication, comparison |
| medium | 0–50 | + missing-number, sequence |
| hard | 0–99 | + division |

`generateQuestion` rolls a weighted random type per tier (see the source). New
types (sequences, comparison, division — Phase 5) are gated to the tiers where
their answers stay in range and the concept is age-appropriate.

### Per-mode knobs (Phase 5)

Adaptive difficulty is independent of **mode**; modes layer on top of it:

| mode | lives | extra end-condition | win |
| --- | --- | --- | --- |
| **Endless** | 3 | — | none (play till you lose) |
| **Timed** | 3 | `TIMED_SECONDS` (60s) countdown → `TIME_UP` → lost | none (score-attack) |
| **Missions** | 3 | — | `score >= MISSION_GOAL` (10) → **won** |

So a child can pick Endless to practice freely, Timed for a quick challenge, or
Missions for a concrete, winnable goal — all under the same score-driven
difficulty ramp.

## Alternatives Considered

- **Per-question performance-based difficulty** (e.g. track reaction time /
  error rate and nudge difficulty per question). Rejected for now: more state,
  noisier, and harder for a child to predict. Score is a clean, legible signal.
- **Per-mode difficulty curves** (e.g. Timed stays easy). Rejected: keeps one
  curve to reason about; modes vary *stakes*, not the ramp.
- **Manual level select.** Rejected: the auto-ramp + mode picker already give
  enough control without burdening a young player with a settings screen.

## Impact

- Code: `difficultyForScore` (unchanged), `generateQuestion` roll table (Phase 5
  added types), `GameContext` mode/win/`TIME_UP`. No new dependencies.
- Tuning the curve is a one-function change (the `<5 / <15` thresholds) and the
  roll cutoffs in `generateQuestion`.

## Decision

**Accepted — implement as above** (already in place). The thresholds (<5 easy,
<15 medium, else hard) and the 10-question mission goal are first guesses tuned
for the target age range; revisit after real playtesting (Phase 6+).
