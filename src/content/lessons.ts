/**
 * Guided-lessons content model (Phase 8.3).
 * -----------------------------------------
 * A data-only curriculum: authoring a lesson is adding one `Lesson` object (+
 * its strings in `src/i18n/strings.ts` under the `lessons` block) — never new
 * component code. `CURRICULUM` is the single source of truth for ordering and
 * sequential unlocks.
 *
 * Phase A ships only the `watch` + `showMe` step kinds (see
 * `src/components/lessons/LessonStep.tsx`); the other kinds are declared here so
 * the structure is ready and Phase C fills in their views. Assessment generators
 * likewise declare the full union, but only `showMe` is built in Phase A
 * (`buildAssessmentStep` in `src/utils/lessonsContent.ts`).
 *
 * Prose (titles / objectives / per-step narration) is NOT inlined here — it lives
 * in the i18n dictionary keyed by lesson/step id, so a future Thai pass is a
 * pure data translation (CLAUDE.md §2.3). Math glyphs/digits/emoji stay code-side.
 */

export type LessonStepKind = 'watch' | 'showMe' | 'count' | 'choose' | 'compare' | 'solve'

/** Coarse grouping for the list UI; ordering/unlocks come from `CURRICULUM`. */
export type LessonUnit = 'number-sense' | 'soroban-0-9' | 'addition' | 'subtraction'

interface BaseStep {
  /** Stable id — also the i18n key (`t.lessons.steps[id]`) + the `useAutoSubmit` reset key. */
  id: string
  kind: LessonStepKind
}

/** Narrated demo. No input; auto-advance OR a Next button (Phase A: Next, no TTS yet). */
export interface WatchStep extends BaseStep {
  kind: 'watch'
  /** Big centered glyph(s): '1 + 1 = 2', '✋', or a row to display. */
  visual: string | readonly string[]
  autoAdvance?: boolean
  /** Min ms the visual stays before Next enables, regardless of narration. */
  minDurationMs?: number
}

/** Hold up N fingers; camera-validated. Single-hand 0–9 by default. */
export interface ShowMeStep extends BaseStep {
  kind: 'showMe'
  /** 0..9 (numHands=1) or 0..99 (numHands=2). */
  target: number
  numHands?: 1 | 2
  /** Per-step override of the lesson hold timing. */
  promptMs?: number
  confirmMs?: number
}

/** Tap-to-count objects, then choose the total. (Phase C view.) */
export interface CountStep extends BaseStep {
  kind: 'count'
  object: string
  count: number
}

/** Multiple choice. (Phase C view.) */
export interface ChooseStep extends BaseStep {
  kind: 'choose'
  /** Inline expression glyph shown big: '2 + 3 = ?'. */
  display: string
  options: readonly number[]
  answer: number
}

/** Compare two groups; pick the relation. (Phase C view.) */
export interface CompareStep extends BaseStep {
  kind: 'compare'
  left: { object: string; count: number }
  right: { object: string; count: number }
  answer: 'more' | 'fewer' | 'equal'
}

/** Arithmetic; show the answer with fingers (+ pad fallback). (Phase C view.) */
export interface SolveStep extends BaseStep {
  kind: 'solve'
  /** Inline expression: '4 − 1 = ?'. */
  display: string
  answer: number
  numHands?: 1 | 2
  promptMs?: number
  confirmMs?: number
}

export type LessonStep =
  | WatchStep
  | ShowMeStep
  | CountStep
  | ChooseStep
  | CompareStep
  | SolveStep

/** How a lesson's quick-check questions are generated. */
export type AssessmentGenerator =
  | { kind: 'showMe'; minAnswer?: number; maxAnswer: number; numHands?: 1 | 2 }
  | { kind: 'addition'; maxAnswer: number }
  | { kind: 'subtraction'; maxAnswer: number }
  | { kind: 'mixed'; ops: readonly ('+' | '-')[]; maxAnswer: number }

export interface Assessment {
  /** Number of assessment questions. */
  questions: number
  /** Correct answers required to pass (RFC-0004: 4 of 5). */
  passThreshold: number
  generator: AssessmentGenerator
}

export interface Lesson {
  /** url segment: 'counting-fingers'. Also the i18n key for title/objective. */
  id: string
  unit: LessonUnit
  /** Sequential within the track; CURRICULUM order is the unlock order. */
  order: number
  /** Digits this lesson exercises (informational; list UI / future analytics). */
  targetNumbers?: readonly number[]
  steps: readonly LessonStep[]
  assessment: Assessment
}

/**
 * The ordered beginner track ("First Numbers", ages 5–6). `CURRICULUM[0]` is
 * always unlocked; `CURRICULUM[i+1]` unlocks when `CURRICULUM[i]` is complete.
 *
 * Phase A ships two playable lessons so sequential unlock is demonstrable:
 *  - `counting-fingers` (Unit 2, lesson 1): full — digits 1–4 via showMe.
 *  - `magic-thumb` (Unit 2, lesson 2): a Phase-A *subset* (watch + showMe 5);
 *    its count/choose steps and the remaining 11 lessons arrive in Phase C.
 */
export const CURRICULUM: readonly Lesson[] = [
  {
    id: 'counting-fingers',
    unit: 'soroban-0-9',
    order: 1,
    targetNumbers: [1, 2, 3, 4],
    steps: [
      { id: 'cf-watch-1', kind: 'watch', visual: '☝️ = 1     ✌️ = 2' },
      { id: 'cf-show-1', kind: 'showMe', target: 1, numHands: 1 },
      { id: 'cf-show-2', kind: 'showMe', target: 2, numHands: 1 },
      { id: 'cf-show-3', kind: 'showMe', target: 3, numHands: 1 },
      { id: 'cf-show-4', kind: 'showMe', target: 4, numHands: 1 },
      { id: 'cf-watch-2', kind: 'watch', visual: '1  2  3  4   👏' },
    ],
    assessment: {
      questions: 5,
      passThreshold: 4,
      generator: { kind: 'showMe', minAnswer: 1, maxAnswer: 4, numHands: 1 },
    },
  },
  {
    id: 'magic-thumb',
    unit: 'soroban-0-9',
    order: 2,
    targetNumbers: [5],
    steps: [
      { id: 'mt-watch-1', kind: 'watch', visual: '👍 = 5' },
      { id: 'mt-show-5', kind: 'showMe', target: 5, numHands: 1 },
      { id: 'mt-watch-2', kind: 'watch', visual: 'Thumb = 5  ⭐' },
    ],
    assessment: {
      questions: 5,
      passThreshold: 4,
      // Mix 0–5 (fist through open hand) so the quick-check exercises the thumb=5 insight.
      generator: { kind: 'showMe', minAnswer: 0, maxAnswer: 5, numHands: 1 },
    },
  },

  // --- Unit 2 (cont.): 6–9 and full 0–9 recall --------------------------------
  {
    id: 'five-and-more',
    unit: 'soroban-0-9',
    order: 3,
    targetNumbers: [6, 7, 8, 9],
    steps: [
      { id: 'fm-watch-1', kind: 'watch', visual: '🖐️ + ☝️ = 6' },
      { id: 'fm-show-6', kind: 'showMe', target: 6, numHands: 1 },
      { id: 'fm-show-7', kind: 'showMe', target: 7, numHands: 1 },
      { id: 'fm-show-8', kind: 'showMe', target: 8, numHands: 1 },
      { id: 'fm-show-9', kind: 'showMe', target: 9, numHands: 1 },
      { id: 'fm-watch-2', kind: 'watch', visual: '6  7  8  9   ✋' },
    ],
    assessment: {
      questions: 5,
      passThreshold: 4,
      generator: { kind: 'showMe', minAnswer: 6, maxAnswer: 9, numHands: 1 },
    },
  },
  {
    id: 'all-the-numbers',
    unit: 'soroban-0-9',
    order: 4,
    targetNumbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    steps: [
      { id: 'an-show-0', kind: 'showMe', target: 0, numHands: 1 },
      { id: 'an-show-3', kind: 'showMe', target: 3, numHands: 1 },
      { id: 'an-show-5', kind: 'showMe', target: 5, numHands: 1 },
      { id: 'an-show-7', kind: 'showMe', target: 7, numHands: 1 },
      { id: 'an-show-9', kind: 'showMe', target: 9, numHands: 1 },
      { id: 'an-watch-1', kind: 'watch', visual: '0 … 9   🎉' },
    ],
    assessment: {
      questions: 5,
      passThreshold: 4,
      generator: { kind: 'showMe', minAnswer: 0, maxAnswer: 9, numHands: 1 },
    },
  },

  // --- Unit 3: Putting together (addition) ------------------------------------
  {
    id: 'adding-is-more',
    unit: 'addition',
    order: 5,
    targetNumbers: [2, 3, 4],
    steps: [
      { id: 'am-watch-1', kind: 'watch', visual: '1 + 1 = 2' },
      { id: 'am-solve-1', kind: 'solve', display: '1 + 1 = ?', answer: 2, numHands: 1 },
      { id: 'am-solve-2', kind: 'solve', display: '3 + 1 = ?', answer: 4, numHands: 1 },
      { id: 'am-solve-3', kind: 'solve', display: '2 + 2 = ?', answer: 4, numHands: 1 },
      { id: 'am-watch-2', kind: 'watch', visual: 'Adding makes more ➕' },
    ],
    assessment: {
      questions: 5,
      passThreshold: 4,
      generator: { kind: 'addition', maxAnswer: 4 },
    },
  },
  {
    id: 'part-and-whole',
    unit: 'addition',
    order: 6,
    targetNumbers: [5],
    steps: [
      { id: 'pw-watch-1', kind: 'watch', visual: '2 + 3 = 5' },
      { id: 'pw-solve-1', kind: 'solve', display: '2 + 3 = ?', answer: 5, numHands: 1 },
      { id: 'pw-solve-2', kind: 'solve', display: '1 + 4 = ?', answer: 5, numHands: 1 },
      { id: 'pw-choose-1', kind: 'choose', display: '1 + ? = 4', options: [2, 3, 4], answer: 3 },
      { id: 'pw-solve-3', kind: 'solve', display: '0 + 5 = ?', answer: 5, numHands: 1 },
    ],
    assessment: {
      questions: 5,
      passThreshold: 4,
      generator: { kind: 'addition', maxAnswer: 5 },
    },
  },
  {
    id: 'bigger-adds',
    unit: 'addition',
    order: 7,
    targetNumbers: [6, 7, 8, 9],
    steps: [
      { id: 'ba-watch-1', kind: 'watch', visual: '5 + 2 = 7' },
      { id: 'ba-solve-1', kind: 'solve', display: '5 + 1 = ?', answer: 6, numHands: 1 },
      { id: 'ba-solve-2', kind: 'solve', display: '6 + 2 = ?', answer: 8, numHands: 1 },
      { id: 'ba-solve-3', kind: 'solve', display: '4 + 3 = ?', answer: 7, numHands: 1 },
      { id: 'ba-solve-4', kind: 'solve', display: '5 + 4 = ?', answer: 9, numHands: 1 },
    ],
    assessment: {
      questions: 5,
      passThreshold: 4,
      generator: { kind: 'addition', maxAnswer: 9 },
    },
  },

  // --- Unit 4: Taking away (subtraction) --------------------------------------
  {
    id: 'taking-away',
    unit: 'subtraction',
    order: 8,
    targetNumbers: [2, 3],
    steps: [
      { id: 'ta-watch-1', kind: 'watch', visual: '3 − 1 = 2' },
      { id: 'ta-solve-1', kind: 'solve', display: '3 − 1 = ?', answer: 2, numHands: 1 },
      { id: 'ta-solve-2', kind: 'solve', display: '4 − 1 = ?', answer: 3, numHands: 1 },
      { id: 'ta-solve-3', kind: 'solve', display: '5 − 2 = ?', answer: 3, numHands: 1 },
      { id: 'ta-watch-2', kind: 'watch', visual: 'Taking away makes fewer ➖' },
    ],
    assessment: {
      questions: 5,
      passThreshold: 4,
      generator: { kind: 'subtraction', maxAnswer: 4 },
    },
  },
  {
    id: 'how-many-left',
    unit: 'subtraction',
    order: 9,
    targetNumbers: [0, 2, 4],
    steps: [
      { id: 'hl-watch-1', kind: 'watch', visual: '5 − 1 = 4' },
      { id: 'hl-solve-1', kind: 'solve', display: '5 − 1 = ?', answer: 4, numHands: 1 },
      { id: 'hl-solve-2', kind: 'solve', display: '4 − 2 = ?', answer: 2, numHands: 1 },
      { id: 'hl-solve-3', kind: 'solve', display: '5 − 5 = ?', answer: 0, numHands: 1 },
      { id: 'hl-solve-4', kind: 'solve', display: '3 − 3 = ?', answer: 0, numHands: 1 },
    ],
    assessment: {
      questions: 5,
      passThreshold: 4,
      generator: { kind: 'subtraction', maxAnswer: 5 },
    },
  },
  {
    id: 'bigger-take-aways',
    unit: 'subtraction',
    order: 10,
    targetNumbers: [0, 2, 5, 7],
    steps: [
      { id: 'bt-watch-1', kind: 'watch', visual: '9 − 4 = 5' },
      { id: 'bt-solve-1', kind: 'solve', display: '9 − 2 = ?', answer: 7, numHands: 1 },
      { id: 'bt-solve-2', kind: 'solve', display: '8 − 3 = ?', answer: 5, numHands: 1 },
      { id: 'bt-solve-3', kind: 'solve', display: '7 − 5 = ?', answer: 2, numHands: 1 },
      { id: 'bt-solve-4', kind: 'solve', display: '9 − 9 = ?', answer: 0, numHands: 1 },
    ],
    assessment: {
      questions: 5,
      passThreshold: 4,
      generator: { kind: 'subtraction', maxAnswer: 9 },
    },
  },
] as const

/** Fast lookup by id (route param → lesson). */
export const LESSON_MAP: Readonly<Record<string, Lesson>> = Object.fromEntries(
  CURRICULUM.map((l) => [l.id, l]),
)
