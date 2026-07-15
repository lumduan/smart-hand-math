import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import { CURRICULUM, LESSON_MAP, nextLessonOf, type AssessmentStep } from '@/content/lessons'
import { buildAssessment, buildPracticeStep } from '@/utils/lessonsContent'

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

/** `normal` = teach → assess → complete; `endless` = assess forever (no teach, no pass/fail). */
export type PracticeMode = 'normal' | 'endless'

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
  practiceMode: PracticeMode
  /** Endless only: items answered so far (also seeds unique per-round step ids). */
  practiceRound: number
}

export interface LessonsState {
  progress: Record<string, LessonProgress>
  active: ActiveLesson | null
}

export type LessonsAction =
  | { type: 'START_LESSON'; lessonId: string; mode?: PracticeMode }
  | { type: 'STEP_COMPLETE' }
  | { type: 'STEP_RETRY' }
  | { type: 'ASSESS_ANSWER'; correct: boolean }
  | { type: 'EXIT_LESSON' }
  | { type: 'RESET_PROGRESS' }
  | { type: 'UNLOCK_LESSON'; lessonId: string }

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
    case 'START_LESSON': {
      const mode = action.mode ?? 'normal'
      const lesson = LESSON_MAP[action.lessonId]
      // Endless skips teaching: jump straight into a single assessment item that gets
      // re-rolled each round. Normal starts empty and builds the full set on teach→assess.
      return {
        ...state,
        active: {
          lessonId: action.lessonId,
          phase: mode === 'endless' ? 'assess' : 'teach',
          stepIndex: 0,
          assessmentIndex: 0,
          assessmentScore: 0,
          attempts: 0,
          assessment: mode === 'endless' && lesson ? [buildPracticeStep(lesson, 0)] : [],
          practiceMode: mode,
          practiceRound: 0,
        },
      }
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

      // Endless: never finalize — re-roll the current slot and bump the round counter.
      // Per-answer feedback already happened in the views; correctness is irrelevant here.
      if (active.practiceMode === 'endless') {
        const prev = active.assessment[active.assessmentIndex]
        const round = active.practiceRound + 1
        const assessment = active.assessment.slice()
        assessment[active.assessmentIndex] = buildPracticeStep(lesson, round, prev)
        return { ...state, active: { ...active, assessment, practiceRound: round } }
      }

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
        const nextLesson = nextLessonOf(lesson) // CURRICULUM ordering is the unlock order
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

    case 'UNLOCK_LESSON': {
      // Manual unlock (the lessons-list confirm popup). No-op for an unknown id or
      // one already reachable, so existing stars/progress are never clobbered.
      const { lessonId } = action
      if (!LESSON_MAP[lessonId] || isUnlockedStatus(state.progress[lessonId]?.status)) return state
      return {
        ...state,
        progress: {
          ...state.progress,
          [lessonId]: { status: 'unlocked', stars: 0, bestAssessment: 0 },
        },
      }
    }

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
  startLesson: (lessonId: string, mode?: PracticeMode) => void
  stepComplete: () => void
  retryStep: () => void
  assessAnswer: (correct: boolean) => void
  exitLesson: () => void
  resetProgress: () => void
  unlockLesson: (lessonId: string) => void
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

  const startLesson = useCallback(
    (lessonId: string, mode?: PracticeMode) => dispatch({ type: 'START_LESSON', lessonId, mode }),
    [],
  )
  const stepComplete = useCallback(() => dispatch({ type: 'STEP_COMPLETE' }), [])
  const retryStep = useCallback(() => dispatch({ type: 'STEP_RETRY' }), [])
  const assessAnswer = useCallback((correct: boolean) => dispatch({ type: 'ASSESS_ANSWER', correct }), [])
  const exitLesson = useCallback(() => dispatch({ type: 'EXIT_LESSON' }), [])
  const resetProgress = useCallback(() => dispatch({ type: 'RESET_PROGRESS' }), [])
  const unlockLesson = useCallback((lessonId: string) => dispatch({ type: 'UNLOCK_LESSON', lessonId }), [])

  const value = useMemo<LessonsApi>(
    () => ({
      ...state,
      startLesson,
      stepComplete,
      retryStep,
      assessAnswer,
      exitLesson,
      resetProgress,
      unlockLesson,
      isUnlocked: (id: string) => isUnlockedStatus(state.progress[id]?.status),
    }),
    [state, startLesson, stepComplete, retryStep, assessAnswer, exitLesson, resetProgress, unlockLesson],
  )

  return <LessonsContext.Provider value={value}>{children}</LessonsContext.Provider>
}

export function useLessons(): LessonsApi {
  const ctx = useContext(LessonsContext)
  if (!ctx) throw new Error('useLessons must be used within a LessonsProvider')
  return ctx
}
