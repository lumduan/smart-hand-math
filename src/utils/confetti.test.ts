import { describe, it, expect, vi, beforeEach } from 'vitest'
import confetti from 'canvas-confetti'
import { burst, celebrate, finale } from '@/utils/confetti'

vi.mock('canvas-confetti', () => ({ default: vi.fn() }))

describe('confetti presets', () => {
  beforeEach(() => vi.mocked(confetti).mockClear())

  it('burst fires canvas-confetti once', () => {
    burst()
    expect(confetti).toHaveBeenCalledOnce()
  })

  it('celebrate uses more particles than burst', () => {
    celebrate()
    const opts = vi.mocked(confetti).mock.calls[0][0]!
    expect(opts.particleCount).toBeGreaterThan(28)
  })

  it('finale uses the most particles', () => {
    finale()
    const opts = vi.mocked(confetti).mock.calls[0][0]!
    expect(opts.particleCount).toBeGreaterThan(80)
  })

  it('every preset respects prefers-reduced-motion', () => {
    burst()
    celebrate()
    finale()
    for (const call of vi.mocked(confetti).mock.calls) {
      expect(call[0]?.disableForReducedMotion).toBe(true)
    }
  })
})
