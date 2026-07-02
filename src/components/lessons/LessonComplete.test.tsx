import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppSettingsProvider } from '@/context/AppSettingsContext'
import { LessonComplete } from '@/components/lessons/LessonComplete'
import { CURRICULUM } from '@/content/lessons'
import type { ActiveLesson, Stars } from '@/context/LessonsContext'

vi.mock('@/utils/confetti', () => ({ burst: vi.fn(), celebrate: vi.fn(), finale: vi.fn() }))

const lesson = CURRICULUM[0]
const activeAt = (score: number): ActiveLesson => ({
  lessonId: lesson.id,
  phase: 'complete',
  stepIndex: 0,
  assessmentIndex: lesson.assessment.questions - 1,
  assessmentScore: score,
  attempts: 0,
  assessment: [],
})

function renderLC(score: number, stars: Stars = 3) {
  render(
    <MemoryRouter>
      <AppSettingsProvider>
        <LessonComplete lesson={lesson} active={activeAt(score)} stars={stars} onExit={vi.fn()} onRestart={vi.fn()} />
      </AppSettingsProvider>
    </MemoryRouter>,
  )
}

describe('LessonComplete', () => {
  it('shows the pass message, stars, and both actions when passed', () => {
    renderLC(5, 3) // 5/5 ≥ threshold 4
    expect(screen.getByText(/Lesson complete/)).toBeInTheDocument()
    expect(screen.getByLabelText('3 stars')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Try again/ })).toBeInTheDocument() // "Play again"
    expect(screen.getByRole('link', { name: /Back to lessons/ })).toBeInTheDocument()
  })

  it('shows the gentle fail message when not passed', () => {
    renderLC(1)
    expect(screen.getByText(/Good try/)).toBeInTheDocument()
  })
})
