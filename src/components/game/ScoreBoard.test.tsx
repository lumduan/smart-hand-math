import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreBoard } from '@/components/game/ScoreBoard'

describe('ScoreBoard', () => {
  it('always shows the score', () => {
    render(<ScoreBoard score={7} />)
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('hides the streak badge at 0 and 1, shows it from 2+', () => {
    const { rerender } = render(<ScoreBoard score={1} streak={1} />)
    expect(screen.queryByText(/🔥/)).toBeNull()
    rerender(<ScoreBoard score={1} streak={2} />)
    expect(screen.getByText(/🔥 2/)).toBeInTheDocument()
  })

  it('hides best when undefined but shows it for 0 when provided', () => {
    const { rerender } = render(<ScoreBoard score={1} />)
    expect(screen.queryByText(/🏆/)).toBeNull()
    rerender(<ScoreBoard score={1} best={0} />)
    expect(screen.getByText(/🏆 0/)).toBeInTheDocument()
  })
})
