/**
 * Pure helpers for the guided-lessons runner (Phase 8.3). No React, no side
 * effects — fully unit-testable (this file is under the `src/utils/**` coverage
 * gate). Lesson prose is looked up from the i18n `lessons` block; assessment
 * items are generated on the fly from each lesson's `assessment.generator`.
 */
import type { AssessmentStep, Lesson, LessonStep } from '@/content/lessons'
import type { Strings } from '@/i18n/strings'
import { generateAddition, generateSubtraction } from '@/utils/mathGenerator'

/** Inclusive random integer in [min, max]; caller guarantees min <= max. */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Emoji pool for generated `count` / `compare` assessment items. */
const COUNT_OBJECTS = ['🍎', '🐶', '⭐', '🎈', '🍌'] as const

/** The relation of `left` to `right` — drives a `compare` step's answer. */
export function compareAnswer(left: number, right: number): 'more' | 'fewer' | 'equal' {
  if (left > right) return 'more'
  if (left < right) return 'fewer'
  return 'equal'
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
 * `showMe` → digit-recall; `addition`/`subtraction`/`mixed` → a `solve`
 * expression; `count` → count objects; `compare` → compare two groups. Every
 * answer is showable/tappable within the single-hand 0–9 cap (RFC-0004).
 */
export function buildAssessmentStep(lesson: Lesson, index: number): AssessmentStep {
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
      return { id, kind: 'solve', display: q.text, answer: q.answer, numHands: gen.numHands ?? 1 }
    }
    case 'subtraction': {
      const q = generateSubtraction(gen.maxAnswer)
      return { id, kind: 'solve', display: q.text, answer: q.answer, numHands: gen.numHands ?? 1 }
    }
    case 'mixed': {
      const op = gen.ops[randInt(0, gen.ops.length - 1)]
      const q = op === '+' ? generateAddition(gen.maxAnswer) : generateSubtraction(gen.maxAnswer)
      return { id, kind: 'solve', display: q.text, answer: q.answer, numHands: gen.numHands ?? 1 }
    }
    case 'count': {
      const min = Math.min(gen.minCount ?? 0, gen.maxCount)
      const object = COUNT_OBJECTS[randInt(0, COUNT_OBJECTS.length - 1)]
      return { id, kind: 'count', object, count: randInt(min, gen.maxCount) }
    }
    case 'compare': {
      const min = Math.min(gen.minCount ?? 0, gen.maxCount)
      const object = COUNT_OBJECTS[randInt(0, COUNT_OBJECTS.length - 1)]
      const left = randInt(min, gen.maxCount)
      const right = randInt(min, gen.maxCount)
      return {
        id,
        kind: 'compare',
        left: { object, count: left },
        right: { object, count: right },
        answer: compareAnswer(left, right),
      }
    }
  }
}

/** Signature of an assessment item's *question* — used to avoid consecutive repeats. */
function stepSignature(step: AssessmentStep): string {
  switch (step.kind) {
    case 'showMe':
      return `s${step.target}`
    case 'solve':
      return `v${step.display}`
    case 'count':
      return `c${step.object}${step.count}`
    case 'compare':
      return `p${step.left.count}-${step.right.count}`
  }
}

/**
 * Build a lesson's whole assessment sequence up front, re-rolling each item so it
 * isn't identical to the one before it (a single-value range can't avoid it —
 * give up after a few tries). Called once per assessment entry, so a retry gets
 * a fresh, non-repeating set.
 */
export function buildAssessment(lesson: Lesson): AssessmentStep[] {
  const out: AssessmentStep[] = []
  let prevSig: string | null = null
  for (let i = 0; i < lesson.assessment.questions; i++) {
    let step = buildAssessmentStep(lesson, i)
    for (let tries = 0; tries < 8 && stepSignature(step) === prevSig; tries++) {
      step = buildAssessmentStep(lesson, i)
    }
    prevSig = stepSignature(step)
    out.push(step)
  }
  return out
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
