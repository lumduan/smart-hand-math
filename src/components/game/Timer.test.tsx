import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { Timer } from '@/components/game/Timer'

afterEach(() => {
  vi.useRealTimers()
})

describe('Timer', () => {
  it('renders the initial remaining seconds', () => {
    render(<Timer seconds={10} />)
    expect(screen.getByText('⏱ 10s')).toBeInTheDocument()
  })

  it('counts down one second per tick', () => {
    vi.useFakeTimers()
    render(<Timer seconds={10} />)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByText('⏱ 9s')).toBeInTheDocument()
  })

  it('fires onExpire exactly once when it reaches zero', () => {
    vi.useFakeTimers()
    const onExpire = vi.fn()
    render(<Timer seconds={3} onExpire={onExpire} />)
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(onExpire).toHaveBeenCalledOnce()
    expect(screen.getByText('⏱ 0s')).toBeInTheDocument()
  })

  it('switches to urgent styling at 5 seconds or fewer', () => {
    vi.useFakeTimers()
    const { container } = render(<Timer seconds={6} />)
    expect(container.firstElementChild).toHaveClass('badge-ghost')
    act(() => {
      vi.advanceTimersByTime(1000) // 6 → 5
    })
    expect(container.firstElementChild).toHaveClass('badge-error')
    expect(container.firstElementChild).toHaveClass('animate-pulse')
  })

  it('does not tick while running is false', () => {
    vi.useFakeTimers()
    const onExpire = vi.fn()
    render(<Timer seconds={5} running={false} onExpire={onExpire} />)
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(screen.getByText('⏱ 5s')).toBeInTheDocument()
    expect(onExpire).not.toHaveBeenCalled()
  })
})
