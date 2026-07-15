import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppSettingsProvider } from '@/context/AppSettingsContext'
import { LessonComplete } from '@/components/lessons/LessonComplete'
import { CURRICULUM, type Lesson } from '@/content/lessons'
import type { ActiveLesson, Stars } from '@/context/LessonsContext'

vi.mock('@/utils/confetti', () => ({ burst: vi.fn(), celebrate: vi.fn(), finale: vi.fn() }))

const FIRST = CURRICULUM[0]
const LAST = CURRICULUM[CURRICULUM.length - 1]

const activeAt = (lesson: Lesson, score: number): ActiveLesson => ({
  lessonId: lesson.id,
  phase: 'complete',
  stepIndex: 0,
  assessmentIndex: lesson.assessment.questions - 1,
  assessmentScore: score,
  attempts: 0,
  assessment: [],
  practiceMode: 'normal',
  practiceRound: 0,
})

function renderLC(lesson: Lesson, score: number, stars: Stars = 3) {
  render(
    <MemoryRouter>
      <AppSettingsProvider>
        <LessonComplete
          lesson={lesson}
          active={activeAt(lesson, score)}
          stars={stars}
          onExit={vi.fn()}
          onRestart={vi.fn()}
          onPractice={vi.fn()}
        />
      </AppSettingsProvider>
    </MemoryRouter>,
  )
}

describe('LessonComplete', () => {
  it('shows the pass message, stars, and all actions when passed', () => {
    renderLC(FIRST, 5, 3) // 5/5 ≥ threshold 4
    expect(screen.getByText(/Lesson complete/)).toBeInTheDocument()
    expect(screen.getByLabelText('3 stars')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Try again/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Keep practicing/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Next lesson/ })).toBeInTheDocument()
  })

  it('shows the gentle fail message and hides Next lesson when not passed', () => {
    renderLC(FIRST, 1)
    expect(screen.getByText(/Good try/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Keep practicing/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Next lesson/ })).not.toBeInTheDocument()
  })

  it('hides Next lesson on the last lesson even when passed', () => {
    renderLC(LAST, LAST.assessment.questions, 3) // perfect score on the final lesson
    expect(screen.getByRole('button', { name: /Try again/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Next lesson/ })).not.toBeInTheDocument()
  })
})
