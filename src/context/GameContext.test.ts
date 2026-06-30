import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  reducer,
  initialState,
  STARTING_LIVES,
  MISSION_GOAL,
  GameProvider,
  useGame,
  type GameState,
  type GameMode,
} from '@/context/GameContext'
import { generateQuestion } from '@/utils/mathGenerator'

/** A 'playing' state with a real easy question, for exercising ANSWER/NEXT. */
function playing(score = 0, best = 0, lives = STARTING_LIVES, mode: GameMode = 'endless'): GameState {
  return {
    ...initialState(best),
    status: 'playing',
    mode,
    score,
    best,
    lives,
    currentQuestion: generateQuestion('easy'),
  }
}

/** A value that is provably different from `expected` (so the answer is wrong). */
function wrongFor(expected: number): number {
  return expected === 0 ? 1 : 0
}

describe('initialState', () => {
  it('starts idle with STARTING_LIVES, level 1, and the given best', () => {
    const s = initialState(7)
    expect(s.status).toBe('idle')
    expect(s.lives).toBe(STARTING_LIVES)
    expect(s.level).toBe(1)
    expect(s.best).toBe(7)
    expect(s.currentQuestion).toBeNull()
    expect(s.lastAnswer).toBeNull()
  })
})

describe('reducer', () => {
  describe('START', () => {
    it('moves to playing with an easy question, preserving best', () => {
      const after = reducer(initialState(42), { type: 'START', mode: 'timed' })
      expect(after.status).toBe('playing')
      expect(after.mode).toBe('timed')
      expect(after.difficulty).toBe('easy')
      expect(after.currentQuestion).not.toBeNull()
      expect(after.best).toBe(42)
      expect(after.score).toBe(0)
      expect(after.lives).toBe(STARTING_LIVES)
    })
  })

  describe('ANSWER', () => {
    it('correct: bumps score/streak/best and stays playing', () => {
      const s = playing(0, 0)
      const expected = s.currentQuestion!.answer
      const after = reducer(s, { type: 'ANSWER', given: expected })
      expect(after.score).toBe(1)
      expect(after.streak).toBe(1)
      expect(after.best).toBe(1)
      expect(after.level).toBe(1) // floor(1/5) + 1
      expect(after.difficulty).toBe('easy')
      expect(after.status).toBe('playing')
      expect(after.lives).toBe(STARTING_LIVES)
      expect(after.lastAnswer).toMatchObject({ correct: true, given: expected, expected })
    })

    it('wrong: loses a life, resets streak, keeps score/best', () => {
      const s = playing(2, 5, 3)
      const after = reducer(s, { type: 'ANSWER', given: wrongFor(s.currentQuestion!.answer) })
      expect(after.lives).toBe(2)
      expect(after.streak).toBe(0)
      expect(after.status).toBe('playing')
      expect(after.score).toBe(2)
      expect(after.best).toBe(5)
      expect(after.lastAnswer).toMatchObject({ correct: false })
    })

    it('three wrong answers reach status lost', () => {
      let s = playing(0, 0, STARTING_LIVES)
      for (let i = 0; i < STARTING_LIVES; i++) {
        s = reducer(s, { type: 'ANSWER', given: wrongFor(s.currentQuestion!.answer) })
      }
      expect(s.status).toBe('lost')
      expect(s.lives).toBe(0)
    })

    it('is a no-op when not playing (idle guard)', () => {
      const s = initialState(0)
      expect(reducer(s, { type: 'ANSWER', given: 5 })).toBe(s)
    })

    it('missions mode wins when the goal is reached', () => {
      let s = playing(MISSION_GOAL - 1, 0, STARTING_LIVES, 'missions')
      s = reducer(s, { type: 'ANSWER', given: s.currentQuestion!.answer })
      expect(s.status).toBe('won')
      expect(s.score).toBe(MISSION_GOAL)
    })

    it('endless mode does not win on score', () => {
      let s = playing(999, 0, STARTING_LIVES, 'endless')
      s = reducer(s, { type: 'ANSWER', given: s.currentQuestion!.answer })
      expect(s.status).toBe('playing')
    })
  })

  describe('NEXT', () => {
    it('provides a new question and clears lastAnswer while playing', () => {
      const after = reducer(playing(), { type: 'NEXT' })
      expect(after.status).toBe('playing')
      expect(after.currentQuestion).not.toBeNull()
      expect(after.lastAnswer).toBeNull()
    })

    it('is a no-op when not playing', () => {
      const s = initialState(0)
      expect(reducer(s, { type: 'NEXT' })).toBe(s)
    })
  })

  describe('RESET', () => {
    it('returns to idle while preserving best', () => {
      const after = reducer(playing(9, 12), { type: 'RESET' })
      expect(after.status).toBe('idle')
      expect(after.best).toBe(12)
      expect(after.score).toBe(0)
      expect(after.currentQuestion).toBeNull()
    })
  })

  describe('HYDRATE_BEST', () => {
    it('sets best without touching other fields', () => {
      const after = reducer(playing(3, 0), { type: 'HYDRATE_BEST', best: 99 })
      expect(after.best).toBe(99)
      expect(after.score).toBe(3)
    })
  })

  describe('TIME_UP', () => {
    it('ends a playing round as lost', () => {
      const after = reducer(playing(), { type: 'TIME_UP' })
      expect(after.status).toBe('lost')
    })

    it('is a no-op when not playing', () => {
      const s = initialState(0)
      expect(reducer(s, { type: 'TIME_UP' })).toBe(s)
    })
  })
})

describe('useGame hook', () => {
  it('throws when used outside a GameProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useGame())).toThrow(/within a GameProvider/)
    spy.mockRestore()
  })

  it('exposes the game API inside a provider and can start a round', () => {
    const { result } = renderHook(() => useGame(), { wrapper: GameProvider })
    expect(result.current.status).toBe('idle')
    act(() => result.current.start('endless'))
    expect(result.current.status).toBe('playing')
    expect(result.current.currentQuestion).not.toBeNull()
  })
})
