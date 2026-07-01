import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { CURRICULUM, LESSON_MAP, type AssessmentStep } from '@/content/lessons'
import { buildAssessment } from '@/utils/lessonsContent'

/**
 * Lessons session + progress state (Phase 8.3). Mirrors `GameContext`'s shape
 * (lazy `useReducer` init from localStorage, `useEffect` persist, `useCallback`
 * dispatchers, `useMemo` API, throwing `useLessons()`). It is deliberately a
 * SEPARATE context — `GameContext` is score/lives/difficulty-coupled.
 *
 * Progress (`progress`) is persisted to `localStorage['smartmath.lessons']`; the
 * active session (`active`) is not — entering `/lessons/:id` starts fresh.
 */

export type LessonStatus = 'locked' | 'unlocked' | 'inProgress' | 'complete'
export type Stars = 0 | 1 | 2 | 3

export interface LessonProgress {
  status: LessonStatus
  stars: Stars
  /** Best assessment score ever achieved on this lesson. */
  bestAssessment: number
  completedAt?: number
}

export type LessonPhase = 'teach' | 'assess' | 'complete'

export interface ActiveLesson {
  lessonId: string
  phase: LessonPhase
  stepIndex: number
  assessmentIndex: number
  assessmentScore: number
  /** Teaching-step retries across this session (feeds star rating). */
  attempts: number
  /** Generated quick-check items — empty while teaching, filled on entering `assess`. */
  assessment: AssessmentStep[]
}

export interface LessonsState {
  progress: Record<string, LessonProgress>
  active: ActiveLesson | null
}

export type LessonsAction =
  | { type: 'START_LESSON'; lessonId: string }
  | { type: 'STEP_COMPLETE' }
  | { type: 'STEP_RETRY' }
  | { type: 'ASSESS_ANSWER'; correct: boolean }
  | { type: 'EXIT_LESSON' }
  | { type: 'RESET_PROGRESS' }

/** Star rating for a finished assessment (RFC-0004). */
export function starsFor(attempts: number, score: number, questions: number, passed: boolean): Stars {
  if (!passed) return 0
  const perfect = score >= questions
  if (attempts === 0 && perfect) return 3
  if (perfect || attempts <= 2) return 2
  return 1
}

/** A lesson is reachable when it is unlocked, in progress, or complete. */
export function isUnlockedStatus(status: LessonStatus | undefined): boolean {
  return status === 'unlocked' || status === 'inProgress' || status === 'complete'
}

export function initialLessonsState(progress: Record<string, LessonProgress> = {}): LessonsState {
  return { progress, active: null }
}

export function reducer(state: LessonsState, action: LessonsAction): LessonsState {
  switch (action.type) {
    case 'START_LESSON':
      return {
        ...state,
        active: {
          lessonId: action.lessonId,
          phase: 'teach',
          stepIndex: 0,
          assessmentIndex: 0,
          assessmentScore: 0,
          attempts: 0,
          assessment: [],
        },
      }

    case 'STEP_COMPLETE': {
      if (!state.active || state.active.phase !== 'teach') return state
      const lesson = LESSON_MAP[state.active.lessonId]
      const next = state.active.stepIndex + 1
      if (next >= lesson.steps.length) {
        return {
          ...state,
          active: {
            ...state.active,
            phase: 'assess',
            assessmentIndex: 0,
            assessmentScore: 0,
            assessment: buildAssessment(lesson),
          },
        }
      }
      return { ...state, active: { ...state.active, stepIndex: next } }
    }

    case 'STEP_RETRY': {
      // Teaching step was attempted incorrectly; bump the retry counter (star input).
      if (!state.active || state.active.phase !== 'teach') return state
      return { ...state, active: { ...state.active, attempts: state.active.attempts + 1 } }
    }

    case 'ASSESS_ANSWER': {
      if (!state.active || state.active.phase !== 'assess') return state
      const active = state.active
      const lesson = LESSON_MAP[active.lessonId]
      const score = active.assessmentScore + (action.correct ? 1 : 0)
      const isLast = active.assessmentIndex >= lesson.assessment.questions - 1

      if (!isLast) {
        return { ...state, active: { ...active, assessmentScore: score, assessmentIndex: active.assessmentIndex + 1 } }
      }

      // Last item: finalize atomically — record progress, stars, and unlock next.
      const passed = score >= lesson.assessment.passThreshold
      const stars = starsFor(active.attempts, score, lesson.assessment.questions, passed)
      const prev = state.progress[active.lessonId]
      const progress: Record<string, LessonProgress> = {
        ...state.progress,
        [active.lessonId]: {
          status: passed ? 'complete' : 'inProgress',
          stars: passed ? stars : prev?.stars ?? 0,
          bestAssessment: Math.max(prev?.bestAssessment ?? 0, score),
          completedAt: passed ? Date.now() : prev?.completedAt,
        },
      }
      if (passed) {
        const idx = CURRICULUM.findIndex((l) => l.id === active.lessonId)
        const nextLesson = idx >= 0 ? CURRICULUM[idx + 1] : undefined
        if (nextLesson && !progress[nextLesson.id]) {
          progress[nextLesson.id] = { status: 'unlocked', stars: 0, bestAssessment: 0 }
        }
      }
      return { ...state, progress, active: { ...active, phase: 'complete', assessmentScore: score } }
    }

    case 'EXIT_LESSON':
      return { ...state, active: null }

    case 'RESET_PROGRESS':
      return initialLessonsState(seedProgress())

    default:
      return state
  }
}

// --- localStorage persistence ------------------------------------------------

const LESSONS_KEY = 'smartmath.lessons'

/** First lesson is always unlocked; the rest start locked. */
export function seedProgress(): Record<string, LessonProgress> {
  return { [CURRICULUM[0].id]: { status: 'unlocked', stars: 0, bestAssessment: 0 } }
}

function isLessonStatus(value: unknown): value is LessonStatus {
  return value === 'locked' || value === 'unlocked' || value === 'inProgress' || value === 'complete'
}

function isStars(value: unknown): value is Stars {
  return value === 0 || value === 1 || value === 2 || value === 3
}

/** Validate + coerce a parsed progress map; drop malformed entries. */
function coerceProgress(parsed: unknown): Record<string, LessonProgress> {
  if (!parsed || typeof parsed !== 'object') return {}
  const out: Record<string, LessonProgress> = {}
  for (const [id, raw] of Object.entries(parsed as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') continue
    const e = raw as Record<string, unknown>
    const status = isLessonStatus(e.status) ? e.status : 'locked'
    out[id] = {
      status,
      stars: isStars(e.stars) ? e.stars : 0,
      bestAssessment: typeof e.bestAssessment === 'number' ? e.bestAssessment : 0,
      completedAt: typeof e.completedAt === 'number' ? e.completedAt : undefined,
    }
  }
  return out
}

function loadProgress(): Record<string, LessonProgress> {
  try {
    const raw = localStorage.getItem(LESSONS_KEY)
    if (!raw) return seedProgress()
    // Merge over the seed so a brand-new first lesson stays unlocked even if the
    // stored data is from an older CURRICULUM shape.
    return { ...seedProgress(), ...coerceProgress(JSON.parse(raw)) }
  } catch {
    return seedProgress()
  }
}

// --- public API --------------------------------------------------------------

interface LessonsApi extends LessonsState {
  startLesson: (lessonId: string) => void
  stepComplete: () => void
  retryStep: () => void
  assessAnswer: (correct: boolean) => void
  exitLesson: () => void
  resetProgress: () => void
  isUnlocked: (lessonId: string) => boolean
}

const LessonsContext = createContext<LessonsApi | null>(null)

export function LessonsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialLessonsState(loadProgress()))

  // Persist progress only (not the active session).
  useEffect(() => {
    try {
      localStorage.setItem(LESSONS_KEY, JSON.stringify(state.progress))
    } catch {
      /* ignore */
    }
  }, [state.progress])

  const startLesson = useCallback((lessonId: string) => dispatch({ type: 'START_LESSON', lessonId }), [])
  const stepComplete = useCallback(() => dispatch({ type: 'STEP_COMPLETE' }), [])
  const retryStep = useCallback(() => dispatch({ type: 'STEP_RETRY' }), [])
  const assessAnswer = useCallback((correct: boolean) => dispatch({ type: 'ASSESS_ANSWER', correct }), [])
  const exitLesson = useCallback(() => dispatch({ type: 'EXIT_LESSON' }), [])
  const resetProgress = useCallback(() => dispatch({ type: 'RESET_PROGRESS' }), [])

  const value = useMemo<LessonsApi>(
    () => ({
      ...state,
      startLesson,
      stepComplete,
      retryStep,
      assessAnswer,
      exitLesson,
      resetProgress,
      isUnlocked: (id: string) => isUnlockedStatus(state.progress[id]?.status),
    }),
    [state, startLesson, stepComplete, retryStep, assessAnswer, exitLesson, resetProgress],
  )

  return <LessonsContext.Provider value={value}>{children}</LessonsContext.Provider>
}

export function useLessons(): LessonsApi {
  const ctx = useContext(LessonsContext)
  if (!ctx) throw new Error('useLessons must be used within a LessonsProvider')
  return ctx
}
