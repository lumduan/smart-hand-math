import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AppSettingsProvider } from '@/context/AppSettingsContext'
import { useTts } from '@/hooks/useTts'

// --- A controllable fake SpeechSynthesis + utterance ------------------------

class FakeUtterance {
  text: string
  lang = ''
  rate = 1
  pitch = 1
  volume = 1
  voice: SpeechSynthesisVoice | null = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor(text: string) {
    this.text = text
  }
}

function makeSynth() {
  const state = { spoken: [] as FakeUtterance[], speaking: false }
  const synth = {
    speak: vi.fn((u: FakeUtterance) => {
      state.spoken.push(u)
      state.speaking = true
    }),
    cancel: vi.fn(() => {
      state.speaking = false
    }),
    resume: vi.fn(),
    pause: vi.fn(),
    getVoices: vi.fn(() => [
      { lang: 'en-US', localService: true, name: 'Local EN', default: true, voiceURI: 'local' },
      { lang: 'en-GB', localService: false, name: 'Remote EN', default: false, voiceURI: 'remote' },
    ]),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    get speaking() {
      return state.speaking
    },
  }
  return { synth, state }
}

// --- Unsupported environment (real jsdom: no SpeechSynthesis) ----------------

describe('useTts — unsupported environment', () => {
  it('reports supported=false and every method is a safe no-op', () => {
    const { result } = renderHook(() => useTts(), { wrapper: AppSettingsProvider })
    expect(result.current.supported).toBe(false)
    expect(result.current.hasVoices).toBe(false)
    expect(result.current.speaking).toBe(false)
    expect(() => {
      act(() => {
        result.current.speak('hello there')
        result.current.cancel()
      })
    }).not.toThrow()
    expect(result.current.speaking).toBe(false)
  })
})

// --- Supported environment (stubbed globals) --------------------------------

describe('useTts — supported environment', () => {
  let synth: ReturnType<typeof makeSynth>['synth']
  let state: ReturnType<typeof makeSynth>['state']

  beforeEach(() => {
    localStorage.clear()
    const made = makeSynth()
    synth = made.synth
    state = made.state
    vi.stubGlobal('speechSynthesis', synth)
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('detects support and speaks with kid-tuned rate/pitch + settings volume', () => {
    const { result } = renderHook(() => useTts(), { wrapper: AppSettingsProvider })
    expect(result.current.supported).toBe(true)
    expect(result.current.hasVoices).toBe(true) // stubbed getVoices() returns voices

    act(() => result.current.speak('count to four'))

    expect(synth.speak).toHaveBeenCalledOnce()
    const u = state.spoken[0]
    expect(u.text).toBe('count to four')
    expect(u.rate).toBeCloseTo(0.9)
    expect(u.pitch).toBeCloseTo(1.05)
    expect(u.volume).toBeCloseTo(0.6) // default volume from AppSettings
    expect(result.current.speaking).toBe(true)
  })

  it('prefers an English on-device voice', () => {
    const { result } = renderHook(() => useTts(), { wrapper: AppSettingsProvider })
    act(() => result.current.speak('hi'))
    expect(state.spoken[0].voice).toMatchObject({ name: 'Local EN', localService: true })
  })

  it('respects a per-call rate/pitch override', () => {
    const { result } = renderHook(() => useTts(), { wrapper: AppSettingsProvider })
    act(() => result.current.speak('slow', { rate: 0.5, pitch: 1.5 }))
    expect(state.spoken[0].rate).toBeCloseTo(0.5)
    expect(state.spoken[0].pitch).toBeCloseTo(1.5)
  })

  it('fires onEnd and clears `speaking` when the utterance finishes', () => {
    const onEnd = vi.fn()
    const { result } = renderHook(() => useTts(), { wrapper: AppSettingsProvider })
    act(() => result.current.speak('done soon', { onEnd }))
    expect(result.current.speaking).toBe(true)

    act(() => state.spoken[0].onend?.())
    expect(onEnd).toHaveBeenCalledOnce()
    expect(result.current.speaking).toBe(false)
  })

  it('cancel() stops speech and detaches callbacks so a late onEnd cannot fire', () => {
    const onEnd = vi.fn()
    const { result } = renderHook(() => useTts(), { wrapper: AppSettingsProvider })
    act(() => result.current.speak('interrupt me', { onEnd }))
    const u = state.spoken[0]

    act(() => result.current.cancel())
    expect(synth.cancel).toHaveBeenCalled()
    expect(result.current.speaking).toBe(false)
    // Handler detached → a stray late callback is a no-op.
    expect(u.onend).toBeNull()
    u.onend?.()
    expect(onEnd).not.toHaveBeenCalled()
  })

  it('a new speak() supersedes the previous utterance without firing its onEnd', () => {
    const first = vi.fn()
    const { result } = renderHook(() => useTts(), { wrapper: AppSettingsProvider })
    act(() => result.current.speak('first', { onEnd: first }))
    const firstUtter = state.spoken[0]

    act(() => result.current.speak('second'))
    // The superseded utterance's callback is detached.
    firstUtter.onend?.()
    expect(first).not.toHaveBeenCalled()
    expect(synth.speak).toHaveBeenCalledTimes(2)
  })

  it('does not speak while muted', () => {
    localStorage.setItem('smartmath.settings', JSON.stringify({ muted: true, volume: 0.6 }))
    const { result } = renderHook(() => useTts(), { wrapper: AppSettingsProvider })
    act(() => result.current.speak('should be silent'))
    expect(synth.speak).not.toHaveBeenCalled()
  })

  it('nudges resume() periodically to defeat the Chrome pause bug, then self-clears', () => {
    vi.useFakeTimers()
    try {
      const { result } = renderHook(() => useTts(), { wrapper: AppSettingsProvider })
      act(() => result.current.speak('a longer sentence for the resume workaround'))
      expect(synth.resume).not.toHaveBeenCalled()

      act(() => vi.advanceTimersByTime(10_000))
      expect(synth.resume).toHaveBeenCalledTimes(1)

      // Once speech ends the interval self-clears — no further nudges.
      act(() => {
        state.speaking = false
        state.spoken[0].onend?.()
      })
      act(() => vi.advanceTimersByTime(30_000))
      expect(synth.resume).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })
})
