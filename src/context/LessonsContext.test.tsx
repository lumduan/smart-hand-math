import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  reducer,
  seedProgress,
  starsFor,
  isUnlockedStatus,
  LessonsProvider,
  useLessons,
  type ActiveLesson,
  type LessonProgress,
} from '@/context/LessonsContext'
import { CURRICULUM } from '@/content/lessons'

const FIRST = CURRICULUM[0] // 'how-many' (Unit 1) — reducer tests treat it abstractly
const SECOND = CURRICULUM[1] // 'more-or-fewer'

function state(active: ActiveLesson | null) {
  return { progress: seedProgress(), active }
}

describe('starsFor', () => {
  it('3 stars: passed, no retries, perfect', () => {
    expect(starsFor(0, 5, 5, true)).toBe(3)
  })
  it('2 stars: perfect but with retries', () => {
    expect(starsFor(2, 5, 5, true)).toBe(2)
  })
  it('2 stars: few retries, not perfect', () => {
    expect(starsFor(1, 4, 5, true)).toBe(2)
    expect(starsFor(0, 4, 5, true)).toBe(2)
  })
  it('1 star: passed with many retries, not perfect', () => {
    expect(starsFor(3, 4, 5, true)).toBe(1)
  })
  it('0 stars when not passed', () => {
    expect(starsFor(0, 5, 5, false)).toBe(0)
  })
})

describe('isUnlockedStatus', () => {
  it('treats unlocked/inProgress/complete as reachable', () => {
    expect(isUnlockedStatus('unlocked')).toBe(true)
    expect(isUnlockedStatus('inProgress')).toBe(true)
    expect(isUnlockedStatus('complete')).toBe(true)
  })
  it('treats locked and unknown as unreachable', () => {
    expect(isUnlockedStatus('locked')).toBe(false)
    expect(isUnlockedStatus(undefined)).toBe(false)
  })
})

describe('reducer — START_LESSON', () => {
  it('opens a fresh teach session at step 0', () => {
    const after = reducer(state(null), { type: 'START_LESSON', lessonId: FIRST.id })
    expect(after.active).toEqual({
      lessonId: FIRST.id,
      phase: 'teach',
      stepIndex: 0,
      assessmentIndex: 0,
      assessmentScore: 0,
      attempts: 0,
      assessment: [],
    })
  })
})

describe('reducer — STEP_COMPLETE', () => {
  it('advances the step index while teaching', () => {
    const after = reducer(state({ ...teach(), stepIndex: 1 }), { type: 'STEP_COMPLETE' })
    expect(after.active?.stepIndex).toBe(2)
    expect(after.active?.phase).toBe('teach')
  })
  it('transitions to assess after the last teaching step and generates the item sequence', () => {
    const after = reducer(state({ ...teach(), stepIndex: FIRST.steps.length - 1 }), { type: 'STEP_COMPLETE' })
    expect(after.active?.phase).toBe('assess')
    expect(after.active?.assessmentIndex).toBe(0)
    expect(after.active?.assessmentScore).toBe(0)
    expect(after.active?.assessment).toHaveLength(FIRST.assessment.questions)
  })
  it('is a no-op without an active session', () => {
    const s = state(null)
    expect(reducer(s, { type: 'STEP_COMPLETE' })).toBe(s)
  })
  it('is a no-op outside the teach phase', () => {
    const s = state(assess())
    expect(reducer(s, { type: 'STEP_COMPLETE' })).toBe(s)
  })
})

describe('reducer — STEP_RETRY', () => {
  it('bumps the attempt counter while teaching', () => {
    const after = reducer(state({ ...teach(), attempts: 1 }), { type: 'STEP_RETRY' })
    expect(after.active?.attempts).toBe(2)
  })
  it('is a no-op outside the teach phase', () => {
    const s = state(assess())
    expect(reducer(s, { type: 'STEP_RETRY' })).toBe(s)
  })
})

describe('reducer — ASSESS_ANSWER', () => {
  it('scores and advances before the last item', () => {
    const after = reducer(state({ ...assess(), assessmentIndex: 0, assessmentScore: 0 }), { type: 'ASSESS_ANSWER', correct: true })
    expect(after.active?.assessmentScore).toBe(1)
    expect(after.active?.assessmentIndex).toBe(1)
    expect(after.active?.phase).toBe('assess')
  })
  it('wrong answer scores 0 but still advances', () => {
    const after = reducer(state({ ...assess(), assessmentIndex: 0, assessmentScore: 0 }), { type: 'ASSESS_ANSWER', correct: false })
    expect(after.active?.assessmentScore).toBe(0)
    expect(after.active?.assessmentIndex).toBe(1)
  })
  it('finalizes a PASS on the last item: completes lesson, records stars, unlocks next', () => {
    const s = state({ ...assess(), assessmentIndex: FIRST.assessment.questions - 1, assessmentScore: 4, attempts: 0 })
    const after = reducer(s, { type: 'ASSESS_ANSWER', correct: true }) // score -> 5
    expect(after.active?.phase).toBe('complete')
    expect(after.active?.assessmentScore).toBe(5)
    expect(after.progress[FIRST.id].status).toBe('complete')
    expect(after.progress[FIRST.id].stars).toBe(3)
    expect(after.progress[FIRST.id].bestAssessment).toBe(5)
    expect(after.progress[SECOND.id].status).toBe('unlocked')
  })
  it('awards 1 star on a passing run with >2 teaching retries and not perfect', () => {
    // attempts come from wrong teaching answers (STEP_RETRY); >2 + a 4/5 pass = 1 star.
    const s = state({ ...assess(), assessmentIndex: FIRST.assessment.questions - 1, assessmentScore: 3, attempts: 3 })
    const after = reducer(s, { type: 'ASSESS_ANSWER', correct: true }) // score -> 4 (pass, not perfect)
    expect(after.active?.assessmentScore).toBe(4)
    expect(after.progress[FIRST.id].status).toBe('complete')
    expect(after.progress[FIRST.id].stars).toBe(1)
  })
  it('finalizes a FAIL on the last item: inProgress, keeps best, does NOT unlock next', () => {
    const s = state({ ...assess(), assessmentIndex: FIRST.assessment.questions - 1, assessmentScore: 0, attempts: 0 })
    const after = reducer(s, { type: 'ASSESS_ANSWER', correct: true }) // score -> 1 (< 4)
    expect(after.progress[FIRST.id].status).toBe('inProgress')
    expect(after.progress[FIRST.id].bestAssessment).toBe(1)
    expect(after.progress[SECOND.id]).toBeUndefined()
    expect(after.active?.phase).toBe('complete')
  })
  it('keeps the previous best assessment as the max', () => {
    const progress: Record<string, LessonProgress> = {
      ...seedProgress(),
      [FIRST.id]: { status: 'inProgress', stars: 2, bestAssessment: 3 },
    }
    const s = { progress, active: { ...assess(), assessmentIndex: FIRST.assessment.questions - 1, assessmentScore: 0 } }
    const after = reducer(s, { type: 'ASSESS_ANSWER', correct: true }) // score -> 1
    expect(after.progress[FIRST.id].bestAssessment).toBe(3) // max(3, 1)
  })
  it('is a no-op outside the assess phase', () => {
    const s = state(teach())
    expect(reducer(s, { type: 'ASSESS_ANSWER', correct: true })).toBe(s)
  })
})

describe('reducer — EXIT_LESSON / RESET_PROGRESS', () => {
  it('EXIT_LESSON clears the session but keeps progress', () => {
    const progress: Record<string, LessonProgress> = {
      ...seedProgress(),
      [FIRST.id]: { status: 'complete', stars: 3, bestAssessment: 5 },
    }
    const after = reducer({ progress, active: teach() }, { type: 'EXIT_LESSON' })
    expect(after.active).toBeNull()
    expect(after.progress[FIRST.id].status).toBe('complete')
  })
  it('RESET_PROGRESS re-seeds (first unlocked, rest gone)', () => {
    const progress: Record<string, LessonProgress> = {
      ...seedProgress(),
      [SECOND.id]: { status: 'unlocked', stars: 0, bestAssessment: 0 },
    }
    const after = reducer({ progress, active: teach() }, { type: 'RESET_PROGRESS' })
    expect(after.active).toBeNull()
    expect(after.progress[FIRST.id].status).toBe('unlocked')
    expect(after.progress[SECOND.id]).toBeUndefined()
  })
})

describe('useLessons hook', () => {
  it('throws when used outside a LessonsProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useLessons())).toThrow(/within a LessonsProvider/)
    spy.mockRestore()
  })
  it('exposes the API inside a provider and can start a lesson', () => {
    const { result } = renderHook(() => useLessons(), { wrapper: LessonsProvider })
    expect(result.current.active).toBeNull()
    act(() => result.current.startLesson(FIRST.id))
    expect(result.current.active?.lessonId).toBe(FIRST.id)
    expect(result.current.active?.phase).toBe('teach')
  })
})

// --- helpers -----------------------------------------------------------------

function teach(): ActiveLesson {
  return { lessonId: FIRST.id, phase: 'teach', stepIndex: 0, assessmentIndex: 0, assessmentScore: 0, attempts: 0, assessment: [] }
}
function assess(): ActiveLesson {
  return { lessonId: FIRST.id, phase: 'assess', stepIndex: 0, assessmentIndex: 0, assessmentScore: 0, attempts: 0, assessment: [] }
}
