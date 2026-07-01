import { describe, it, expect } from 'vitest'
import { resolveStep, buildAssessmentStep, assessmentPassed, spokenExpression } from '@/utils/lessonsContent'
import { STRINGS } from '@/i18n/strings'
import { CURRICULUM, type Lesson, type LessonStep } from '@/content/lessons'

const L = STRINGS.en.lessons

describe('resolveStep', () => {
  it('returns the per-step narration when one is defined', () => {
    const step = { id: 'cf-watch-1', kind: 'watch', visual: 'x' } as LessonStep
    expect(resolveStep(step, L)).toBe(L.steps['cf-watch-1'])
  })

  it('showMe falls back to showMePrompt(target)', () => {
    const step = { id: 'none', kind: 'showMe', target: 3, numHands: 1 } as LessonStep
    expect(resolveStep(step, L)).toBe(L.showMePrompt(3))
  })
  it('solve falls back to solvePrompt', () => {
    const step = { id: 'none', kind: 'solve', display: '1 + 1 = ?', answer: 2 } as LessonStep
    expect(resolveStep(step, L)).toBe(L.solvePrompt)
  })
  it('choose falls back to choosePrompt', () => {
    const step = { id: 'none', kind: 'choose', display: '?', options: [1, 2], answer: 2 } as LessonStep
    expect(resolveStep(step, L)).toBe(L.choosePrompt)
  })
  it('compare falls back to comparePrompt', () => {
    const step = {
      id: 'none',
      kind: 'compare',
      left: { object: '🍎', count: 2 },
      right: { object: '🍎', count: 3 },
      answer: 'more',
    } as LessonStep
    expect(resolveStep(step, L)).toBe(L.comparePrompt)
  })
  it('count falls back to countPrompt', () => {
    const step = { id: 'none', kind: 'count', object: '🍎', count: 3 } as LessonStep
    expect(resolveStep(step, L)).toBe(L.countPrompt)
  })
  it('watch with no narration entry resolves to empty string', () => {
    const step = { id: 'none', kind: 'watch', visual: 'x' } as LessonStep
    expect(resolveStep(step, L)).toBe('')
  })
})

describe('buildAssessmentStep', () => {
  const lesson = CURRICULUM[0] // counting-fingers: showMe, min 1, max 4

  // Swap a generator onto lesson 2.1 to exercise each generator branch.
  const withGen = (generator: Lesson['assessment']['generator']): Lesson => ({
    ...lesson,
    assessment: { questions: 5, passThreshold: 4, generator },
  })

  it('builds a showMe step with a target in range and a fresh id', () => {
    const step = buildAssessmentStep(lesson, 2)
    expect(step.kind).toBe('showMe')
    if (step.kind !== 'showMe') throw new Error('expected showMe')
    expect(step.target).toBeGreaterThanOrEqual(1)
    expect(step.target).toBeLessThanOrEqual(4)
    expect(step.numHands).toBe(1)
    expect(step.id).toBe(`${lesson.id}-assess-2`)
  })

  it('repeats produce independent ids per index', () => {
    expect(buildAssessmentStep(lesson, 0).id).not.toBe(buildAssessmentStep(lesson, 1).id)
  })

  it('defaults minAnswer to 0 and numHands to 1 when the showMe generator omits them', () => {
    const step = buildAssessmentStep(withGen({ kind: 'showMe', maxAnswer: 4 }), 0)
    if (step.kind !== 'showMe') throw new Error('expected showMe')
    expect(step.numHands).toBe(1)
    expect(step.target).toBeGreaterThanOrEqual(0)
    expect(step.target).toBeLessThanOrEqual(4)
  })

  it('builds a solve step from an addition generator (answer within range)', () => {
    const step = buildAssessmentStep(withGen({ kind: 'addition', maxAnswer: 5 }), 1)
    expect(step.kind).toBe('solve')
    if (step.kind !== 'solve') throw new Error('expected solve')
    expect(step.display).toMatch(/\+/)
    expect(step.display).toContain('= ?')
    expect(step.answer).toBeGreaterThanOrEqual(0)
    expect(step.answer).toBeLessThanOrEqual(5)
    expect(step.numHands).toBe(1)
    expect(step.id).toBe(`${lesson.id}-assess-1`)
  })

  it('builds a solve step from a subtraction generator (non-negative answer)', () => {
    const step = buildAssessmentStep(withGen({ kind: 'subtraction', maxAnswer: 9 }), 0)
    if (step.kind !== 'solve') throw new Error('expected solve')
    expect(step.display).toMatch(/−/) // U+2212 minus
    expect(step.answer).toBeGreaterThanOrEqual(0)
    expect(step.answer).toBeLessThanOrEqual(9)
  })

  it('mixed generator delegates to the chosen op (both + and −)', () => {
    const plus = buildAssessmentStep(withGen({ kind: 'mixed', ops: ['+'], maxAnswer: 5 }), 0)
    if (plus.kind !== 'solve') throw new Error('expected solve')
    expect(plus.display).toMatch(/\+/)
    const minus = buildAssessmentStep(withGen({ kind: 'mixed', ops: ['-'], maxAnswer: 5 }), 0)
    if (minus.kind !== 'solve') throw new Error('expected solve')
    expect(minus.display).toMatch(/−/)
  })
})

describe('assessmentPassed', () => {
  it('passes at the threshold', () => {
    expect(assessmentPassed(CURRICULUM[0], CURRICULUM[0].assessment.passThreshold)).toBe(true)
  })
  it('fails below the threshold', () => {
    expect(assessmentPassed(CURRICULUM[0], CURRICULUM[0].assessment.passThreshold - 1)).toBe(false)
  })
})

describe('spokenExpression', () => {
  it('reads + and − as words and drops the "= ?" tail', () => {
    expect(spokenExpression('2 + 3 = ?')).toBe('2 plus 3')
    expect(spokenExpression('5 − 2 = ?')).toBe('5 minus 2')
  })
})
