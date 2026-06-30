import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useAutoSubmit, type UseAutoSubmitArgs } from '@/hooks/useAutoSubmit'

let commit: ReturnType<typeof vi.fn>

const tick = (ms: number) => act(() => {
  vi.advanceTimersByTime(ms)
})

function setup(overrides: Partial<UseAutoSubmitArgs> = {}) {
  const initial: UseAutoSubmitArgs = {
    enabled: true,
    promptMs: 1000,
    confirmMs: 500,
    detected: -1,
    canSubmit: true,
    questionId: 'q1',
    commit,
    ...overrides,
  }
  const rendered = renderHook((p: UseAutoSubmitArgs) => useAutoSubmit(p), { initialProps: initial })
  return {
    result: rendered.result,
    set: (o: Partial<UseAutoSubmitArgs>) => rendered.rerender({ ...initial, ...o }),
  }
}

beforeEach(() => {
  // Vitest's default fake timers don't fake `performance`, which the hook uses
  // for monotonic timing — include it explicitly so `held` advances with the clock.
  vi.useFakeTimers({
    now: 0,
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'],
  })
  commit = vi.fn()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useAutoSubmit', () => {
  it('raises a pending prompt after promptMs and commits after +confirmMs', () => {
    const { result } = setup({ detected: 5, promptMs: 1000, confirmMs: 500 })

    tick(1000) // held ~950ms (stability starts at first tick) → not yet
    expect(result.current).toBeNull()

    tick(300) // past promptMs → prompt up (value 5)
    expect(result.current?.value).toBe(5)
    expect(result.current?.progress).toBeGreaterThanOrEqual(0)
    expect(commit).not.toHaveBeenCalled()

    tick(600) // past confirmMs → commit
    expect(commit).toHaveBeenCalledWith(5)
  })

  it('cancels the prompt when the held value changes', () => {
    const { result, set } = setup({ detected: 5, promptMs: 1000, confirmMs: 500 })
    tick(1300)
    expect(result.current?.value).toBe(5)

    set({ detected: 7 })
    tick(100) // next tick sees the new value → reset
    expect(result.current).toBeNull()
    expect(commit).not.toHaveBeenCalled()
  })

  it('resets when the question changes', () => {
    const { result, set } = setup({ detected: 5, promptMs: 1000, confirmMs: 500 })
    tick(1300)
    expect(result.current?.value).toBe(5)

    set({ questionId: 'q2' })
    expect(result.current).toBeNull()
  })

  it('never starts while disabled', () => {
    const { result } = setup({ enabled: false, detected: 5 })
    tick(3000)
    expect(result.current).toBeNull()
    expect(commit).not.toHaveBeenCalled()
  })

  it('is idle when canSubmit is false', () => {
    const { result } = setup({ detected: 5, canSubmit: false })
    tick(3000)
    expect(result.current).toBeNull()
    expect(commit).not.toHaveBeenCalled()
  })

  it('never raises a prompt when no hand is visible', () => {
    const { result } = setup({ detected: -1 })
    tick(3000)
    expect(result.current).toBeNull()
    expect(commit).not.toHaveBeenCalled()
  })

  it('does not commit twice for one held value', () => {
    const { result } = setup({ detected: 5, promptMs: 1000, confirmMs: 500 })
    tick(2000) // well past commit
    expect(commit).toHaveBeenCalledTimes(1)
    expect(result.current).toBeNull()
  })
})
