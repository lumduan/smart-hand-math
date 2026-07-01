import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { AppSettingsProvider } from '@/context/AppSettingsContext'
import { LessonStep } from '@/components/lessons/LessonStep'
import type { LessonStep as Step } from '@/content/lessons'

// Keep the MediaPipe camera graph + confetti out of jsdom; ChooseView uses neither.
vi.mock('@/components/camera/CameraView', () => ({ CameraView: () => null }))
vi.mock('@/utils/confetti', () => ({ burst: vi.fn(), celebrate: vi.fn(), finale: vi.fn() }))

const chooseStep: Step = { id: 't-choose', kind: 'choose', display: '1 + ? = 4', options: [2, 3, 4], answer: 3 }

function renderChoose(assessment = false) {
  const onComplete = vi.fn()
  const onAttempt = vi.fn()
  const onRetry = vi.fn()
  render(
    <AppSettingsProvider>
      <LessonStep
        step={chooseStep}
        assessment={assessment}
        onComplete={onComplete}
        onAttempt={onAttempt}
        onRetry={onRetry}
      />
    </AppSettingsProvider>,
  )
  return { onComplete, onAttempt, onRetry }
}

describe('LessonStep — ChooseView', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('renders the expression and one button per option', () => {
    renderChoose()
    expect(screen.getByText('1 + ? = 4')).toBeInTheDocument()
    for (const n of ['2', '3', '4']) {
      expect(screen.getByRole('button', { name: n })).toBeInTheDocument()
    }
  })

  it('a wrong teaching pick counts a retry and does not advance', () => {
    const { onComplete, onAttempt, onRetry } = renderChoose()
    fireEvent.click(screen.getByRole('button', { name: '2' }))
    expect(onRetry).toHaveBeenCalledOnce()
    expect(onComplete).not.toHaveBeenCalled()
    expect(onAttempt).not.toHaveBeenCalled()
  })

  it('a correct teaching pick advances via onComplete (after the pause)', () => {
    const { onComplete, onRetry } = renderChoose()
    fireEvent.click(screen.getByRole('button', { name: '3' }))
    expect(onRetry).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1000))
    expect(onComplete).toHaveBeenCalledOnce()
  })
})
