import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Card } from '@/components/common/Card'

describe('Card', () => {
  it('renders children and styles the outer card', () => {
    const { container, getByText } = render(<Card>Hello</Card>)
    expect(getByText('Hello')).toBeInTheDocument()
    expect(container.firstElementChild).toHaveClass('card')
    expect(container.firstElementChild).toHaveClass('rounded-3xl')
  })

  it('places children inside a card-body wrapper', () => {
    const { container } = render(<Card>Hello</Card>)
    expect(container.firstElementChild?.firstElementChild).toHaveClass('card-body')
  })

  it('spreads extra props onto the outer element', () => {
    const { container } = render(<Card data-testid="card">X</Card>)
    expect(container.firstElementChild).toHaveAttribute('data-testid', 'card')
  })
})
