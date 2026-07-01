/**
 * Pure helpers for the guided-lessons runner (Phase 8.3). No React, no side
 * effects — fully unit-testable (this file is under the `src/utils/**` coverage
 * gate). Lesson prose is looked up from the i18n `lessons` block; assessment
 * items are generated on the fly from each lesson's `assessment.generator`.
 */
import type { Lesson, LessonStep, ShowMeStep } from '@/content/lessons'
import type { Strings } from '@/i18n/strings'

/** Inclusive random integer in [min, max]; caller guarantees min <= max. */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Resolve a step's spoken + on-screen prompt. A per-step narration string
 * (`lessons.steps[step.id]`) wins (used by `watch` demos); otherwise fall back
 * to a kind-based prompt. `showMe` interpolates its target.
 */
export function resolveStep(step: LessonStep, lessons: Strings['lessons']): string {
  const explicit = lessons.steps[step.id]
  if (typeof explicit === 'string') return explicit
  if (step.kind === 'showMe') return lessons.showMePrompt(step.target)
  if (step.kind === 'solve') return lessons.solvePrompt
  if (step.kind === 'choose') return lessons.choosePrompt
  if (step.kind === 'compare') return lessons.comparePrompt
  if (step.kind === 'count') return lessons.countPrompt
  return explicit ?? '' // `watch` with no narration entry
}

/**
 * Build the `index`-th assessment step for a lesson. Phase A supports only the
 * `showMe` generator (digit recall); addition/subtraction/mixed generators are
 * declared in the data model and wired up in Phase C.
 */
export function buildAssessmentStep(lesson: Lesson, index: number): ShowMeStep {
  const gen = lesson.assessment.generator
  if (gen.kind !== 'showMe') {
    throw new Error(
      `buildAssessmentStep: generator '${gen.kind}' not implemented (Phase A supports showMe only)`,
    )
  }
  const min = Math.min(gen.minAnswer ?? 0, gen.maxAnswer)
  const target = randInt(min, gen.maxAnswer)
  return {
    id: `${lesson.id}-assess-${index}`,
    kind: 'showMe',
    target,
    numHands: gen.numHands ?? 1,
  }
}

/** Whether an assessment score meets the lesson's pass threshold. */
export function assessmentPassed(lesson: Lesson, score: number): boolean {
  return score >= lesson.assessment.passThreshold
}
