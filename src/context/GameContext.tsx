import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import {
  difficultyForScore,
  generateQuestion,
  type Difficulty,
  type MathQuestion,
} from '@/utils/mathGenerator'

export type GameStatus = 'idle' | 'playing' | 'won' | 'lost'

export interface AnswerResult {
  correct: boolean
  given: number
  expected: number
}

export interface GameState {
  status: GameStatus
  score: number
  best: number
  streak: number
  lives: number
  level: number
  difficulty: Difficulty
  currentQuestion: MathQuestion | null
  lastAnswer: AnswerResult | null
}

export type Action =
  | { type: 'START' }
  | { type: 'ANSWER'; given: number }
  | { type: 'NEXT' }
  | { type: 'RESET' }
  | { type: 'HYDRATE_BEST'; best: number }

export const STARTING_LIVES = 3

function levelForScore(score: number): number {
  return Math.floor(score / 5) + 1
}

export function initialState(best = 0): GameState {
  return {
    status: 'idle',
    score: 0,
    best,
    streak: 0,
    lives: STARTING_LIVES,
    level: 1,
    difficulty: 'easy',
    currentQuestion: null,
    lastAnswer: null,
  }
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'HYDRATE_BEST':
      return { ...state, best: action.best }

    case 'START': {
      const difficulty = difficultyForScore(0)
      return {
        ...initialState(state.best),
        status: 'playing',
        difficulty,
        currentQuestion: generateQuestion(difficulty),
      }
    }

    case 'ANSWER': {
      if (state.status !== 'playing' || !state.currentQuestion) return state
      const expected = state.currentQuestion.answer
      const correct = action.given === expected

      if (correct) {
        const score = state.score + 1
        return {
          ...state,
          score,
          best: Math.max(state.best, score),
          streak: state.streak + 1,
          level: levelForScore(score),
          difficulty: difficultyForScore(score),
          lastAnswer: { correct: true, given: action.given, expected },
        }
      }
      const lives = state.lives - 1
      return {
        ...state,
        lives,
        streak: 0,
        status: lives <= 0 ? 'lost' : 'playing',
        lastAnswer: { correct: false, given: action.given, expected },
      }
    }

    case 'NEXT': {
      if (state.status !== 'playing') return state
      return {
        ...state,
        currentQuestion: generateQuestion(state.difficulty),
        lastAnswer: null,
      }
    }

    case 'RESET':
      return initialState(state.best)

    default:
      return state
  }
}

const BEST_KEY = 'smartmath.best'

interface GameApi extends GameState {
  start: () => void
  answer: (given: number) => void
  next: () => void
  reset: () => void
}

const GameContext = createContext<GameApi | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    let best = 0
    try {
      best = Number(localStorage.getItem(BEST_KEY) ?? 0) || 0
    } catch {
      /* ignore */
    }
    return initialState(best)
  })

  // Persist best score.
  useEffect(() => {
    try {
      localStorage.setItem(BEST_KEY, String(state.best))
    } catch {
      /* ignore */
    }
  }, [state.best])

  const start = useCallback(() => dispatch({ type: 'START' }), [])
  const answer = useCallback((given: number) => dispatch({ type: 'ANSWER', given }), [])
  const next = useCallback(() => dispatch({ type: 'NEXT' }), [])
  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  const value = useMemo<GameApi>(
    () => ({ ...state, start, answer, next, reset }),
    [state, start, answer, next, reset],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameApi {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used within a GameProvider')
  return ctx
}
