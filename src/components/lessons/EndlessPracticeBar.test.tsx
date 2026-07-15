import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppSettingsProvider } from '@/context/AppSettingsContext'
import { EndlessPracticeBar } from '@/components/lessons/EndlessPracticeBar'
import { CURRICULUM, type Lesson } from '@/content/lessons'

const FIRST = CURRICULUM[0]
const LAST = CURRICULUM[CURRICULUM.length - 1]

function renderBar(lesson: Lesson, round: number, passed: boolean) {
  render(
    <MemoryRouter>
      <AppSettingsProvider>
        <EndlessPracticeBar lesson={lesson} round={round} passed={passed} onExit={vi.fn()} />
      </AppSettingsProvider>
    </MemoryRouter>,
  )
}

describe('EndlessPracticeBar', () => {
  it('shows the round counter and the End action', () => {
    renderBar(FIRST, 3, true)
    expect(screen.getByText(/Round 3/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /End/ })).toBeInTheDocument()
  })

  it('shows Next lesson when passed and a next lesson exists', () => {
    renderBar(FIRST, 1, true)
    expect(screen.getByRole('link', { name: /Next lesson/ })).toBeInTheDocument()
  })

  it('hides Next lesson when not passed', () => {
    renderBar(FIRST, 1, false)
    expect(screen.queryByRole('link', { name: /Next lesson/ })).not.toBeInTheDocument()
  })

  it('hides Next lesson on the last lesson even when passed', () => {
    renderBar(LAST, 1, true)
    expect(screen.queryByRole('link', { name: /Next lesson/ })).not.toBeInTheDocument()
  })
})
