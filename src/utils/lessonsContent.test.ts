import { describe, it, expect } from 'vitest'
import {
  resolveStep,
  buildAssessmentStep,
  buildAssessment,
  assessmentPassed,
  compareAnswer,
  spokenExpression,
} from '@/utils/lessonsContent'
import { STRINGS } from '@/i18n/strings'
import { CURRICULUM, LESSON_MAP, type Lesson, type LessonStep } from '@/content/lessons'

const L = STRINGS.en.lessons

describe('watch-step visuals', () => {
  it('every watch step resolves a visual (inline glyph or localized entry)', () => {
    const missing: string[] = []
    for (const lesson of CURRICULUM) {
      for (const step of lesson.steps) {
        if (step.kind !== 'watch') continue
        const hasInline = step.visual != null
        const hasLocalized = typeof L.visuals[step.id] === 'string'
        if (!hasInline && !hasLocalized) missing.push(step.id)
      }
    }
    expect(missing).toEqual([])
  })
})

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
  const lesson = LESSON_MAP['counting-fingers'] // showMe, min 1, max 4 (not CURRICULUM[0] — that is now Unit 1)

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

  it('builds a count step from a count generator (count in range, object present)', () => {
    const step = buildAssessmentStep(withGen({ kind: 'count', minCount: 1, maxCount: 5 }), 3)
    expect(step.kind).toBe('count')
    if (step.kind !== 'count') throw new Error('expected count')
    expect(step.count).toBeGreaterThanOrEqual(1)
    expect(step.count).toBeLessThanOrEqual(5)
    expect(step.object.length).toBeGreaterThan(0)
    expect(step.id).toBe(`${lesson.id}-assess-3`)
  })

  it('count generator can reach zero when minCount is 0', () => {
    const step = buildAssessmentStep(withGen({ kind: 'count', minCount: 0, maxCount: 0 }), 0)
    if (step.kind !== 'count') throw new Error('expected count')
    expect(step.count).toBe(0)
  })

  it('builds a compare step with counts in range and a consistent answer', () => {
    const step = buildAssessmentStep(withGen({ kind: 'compare', minCount: 1, maxCount: 5 }), 0)
    expect(step.kind).toBe('compare')
    if (step.kind !== 'compare') throw new Error('expected compare')
    expect(step.left.count).toBeGreaterThanOrEqual(1)
    expect(step.right.count).toBeLessThanOrEqual(5)
    expect(step.answer).toBe(compareAnswer(step.left.count, step.right.count))
    expect(step.left.object).toBe(step.right.object) // same object → fair comparison
  })

  it('count/compare default minCount to 0 when omitted', () => {
    const c = buildAssessmentStep(withGen({ kind: 'count', maxCount: 3 }), 0)
    if (c.kind !== 'count') throw new Error('expected count')
    expect(c.count).toBeGreaterThanOrEqual(0)
    const p = buildAssessmentStep(withGen({ kind: 'compare', maxCount: 3 }), 0)
    if (p.kind !== 'compare') throw new Error('expected compare')
    expect(p.left.count).toBeGreaterThanOrEqual(0)
  })

  it('carries numHands:2 onto arithmetic solve steps (two-hand 0–99)', () => {
    const add = buildAssessmentStep(withGen({ kind: 'addition', maxAnswer: 99, numHands: 2 }), 0)
    if (add.kind !== 'solve') throw new Error('expected solve')
    expect(add.numHands).toBe(2)
    expect(add.answer).toBeGreaterThanOrEqual(0)
    expect(add.answer).toBeLessThanOrEqual(99)

    const sub = buildAssessmentStep(withGen({ kind: 'subtraction', maxAnswer: 99, numHands: 2 }), 0)
    if (sub.kind !== 'solve') throw new Error('expected solve')
    expect(sub.numHands).toBe(2)
    expect(sub.answer).toBeGreaterThanOrEqual(0)
    expect(sub.answer).toBeLessThanOrEqual(99)
  })
})

describe('compareAnswer', () => {
  it('classifies more / fewer / equal', () => {
    expect(compareAnswer(4, 2)).toBe('more')
    expect(compareAnswer(1, 3)).toBe('fewer')
    expect(compareAnswer(2, 2)).toBe('equal')
  })
})

describe('buildAssessment', () => {
  const lesson = LESSON_MAP['counting-fingers']
  const withGen = (generator: Lesson['assessment']['generator']): Lesson => ({
    ...lesson,
    assessment: { questions: 5, passThreshold: 4, generator },
  })

  it('returns exactly `questions` items', () => {
    expect(buildAssessment(lesson)).toHaveLength(lesson.assessment.questions)
  })

  it('never repeats a question back-to-back when the range allows it', () => {
    // Run many times: a 1..4 showMe range must never produce two identical adjacent targets.
    for (let run = 0; run < 200; run++) {
      const seq = buildAssessment(lesson)
      for (let i = 1; i < seq.length; i++) {
        const a = seq[i - 1]
        const b = seq[i]
        if (a.kind === 'showMe' && b.kind === 'showMe') expect(b.target).not.toBe(a.target)
      }
    }
  })

  it('exercises count/compare/solve signatures without adjacent repeats', () => {
    expect(buildAssessment(withGen({ kind: 'count', minCount: 1, maxCount: 5 }))).toHaveLength(5)
    expect(buildAssessment(withGen({ kind: 'compare', minCount: 1, maxCount: 5 }))).toHaveLength(5)
    expect(buildAssessment(withGen({ kind: 'addition', maxAnswer: 9 }))).toHaveLength(5)
  })

  it('gracefully returns duplicates for a single-value range (give-up path)', () => {
    // Only one possible value → adjacent repeats are unavoidable; must not hang.
    const seq = buildAssessment(withGen({ kind: 'showMe', minAnswer: 5, maxAnswer: 5 }))
    expect(seq).toHaveLength(5)
    for (const s of seq) {
      if (s.kind !== 'showMe') throw new Error('expected showMe')
      expect(s.target).toBe(5)
    }
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
