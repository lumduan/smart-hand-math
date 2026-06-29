import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LevelBadge } from '@/components/game/LevelBadge'

describe('LevelBadge', () => {
  it('shows the level number', () => {
    render(<LevelBadge level={3} />)
    expect(screen.getByText('Level 3')).toBeInTheDocument()
  })

  it.each([
    ['easy', 'badge-success', 'Easy'],
    ['medium', 'badge-warning', 'Medium'],
    ['hard', 'badge-error', 'Hard'],
  ] as const)('difficulty %s → %s class + %s label', (difficulty, cls, label) => {
    const { container } = render(<LevelBadge level={1} difficulty={difficulty} />)
    expect(container.firstElementChild).toHaveClass(cls)
    expect(screen.getByText(`· ${label}`)).toBeInTheDocument()
  })

  it('defaults to easy styling', () => {
    const { container } = render(<LevelBadge level={1} />)
    expect(container.firstElementChild).toHaveClass('badge-success')
  })
})
