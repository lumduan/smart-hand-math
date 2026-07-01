/**
 * Pure helpers for the guided-lessons runner (Phase 8.3). No React, no side
 * effects — fully unit-testable (this file is under the `src/utils/**` coverage
 * gate). Lesson prose is looked up from the i18n `lessons` block; assessment
 * items are generated on the fly from each lesson's `assessment.generator`.
 */
import type { Lesson, LessonStep, ShowMeStep, SolveStep } from '@/content/lessons'
import type { Strings } from '@/i18n/strings'
import { generateAddition, generateSubtraction } from '@/utils/mathGenerator'

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
 * Build the `index`-th assessment step for a lesson from its generator.
 * `showMe` produces a digit-recall step; `addition`/`subtraction`/`mixed`
 * produce a `solve` step (an `a ± b = ?` expression) whose single-hand answer
 * (0–9) the child shows with fingers. Answers are always ≤ `maxAnswer` ≤ 9, so
 * every generated item is showable on one hand (RFC-0004 single-hand cap).
 */
export function buildAssessmentStep(lesson: Lesson, index: number): ShowMeStep | SolveStep {
  const gen = lesson.assessment.generator
  const id = `${lesson.id}-assess-${index}`
  switch (gen.kind) {
    case 'showMe': {
      const min = Math.min(gen.minAnswer ?? 0, gen.maxAnswer)
      const target = randInt(min, gen.maxAnswer)
      return { id, kind: 'showMe', target, numHands: gen.numHands ?? 1 }
    }
    case 'addition': {
      const q = generateAddition(gen.maxAnswer)
      return { id, kind: 'solve', display: q.text, answer: q.answer, numHands: 1 }
    }
    case 'subtraction': {
      const q = generateSubtraction(gen.maxAnswer)
      return { id, kind: 'solve', display: q.text, answer: q.answer, numHands: 1 }
    }
    case 'mixed': {
      const op = gen.ops[randInt(0, gen.ops.length - 1)]
      const q = op === '+' ? generateAddition(gen.maxAnswer) : generateSubtraction(gen.maxAnswer)
      return { id, kind: 'solve', display: q.text, answer: q.answer, numHands: 1 }
    }
  }
}

/** Whether an assessment score meets the lesson's pass threshold. */
export function assessmentPassed(lesson: Lesson, score: number): boolean {
  return score >= lesson.assessment.passThreshold
}

/**
 * A speakable form of a `solve` expression: strips the ` = ?` tail and reads the
 * operators as words, so TTS says "two plus three" for "2 + 3 = ?". Used to
 * narrate generated assessment items (which have no authored narration) to
 * pre-readers.
 */
export function spokenExpression(display: string): string {
  return display
    .replace(/\s*=\s*\?\s*$/, '')
    .replace(/\+/g, ' plus ')
    .replace(/−/g, ' minus ') // U+2212
    .replace(/\s+/g, ' ')
    .trim()
}
