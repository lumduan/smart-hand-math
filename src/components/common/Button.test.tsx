import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/common/Button'

describe('Button', () => {
  it('renders its children as the accessible name', () => {
    render(<Button>Start</Button>)
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument()
  })

  it.each([
    ['primary', 'btn-primary'],
    ['secondary', 'btn-secondary'],
    ['accent', 'btn-accent'],
    ['ghost', 'btn-ghost'],
    ['success', 'btn-success'],
    ['danger', 'btn-error'],
  ] as const)('variant %s applies class %s', (variant, cls) => {
    render(<Button variant={variant}>x</Button>)
    expect(screen.getByRole('button')).toHaveClass(cls)
  })

  it.each([
    ['sm', 'btn-sm'],
    ['md', 'btn-md'],
    ['lg', 'btn-lg'],
  ] as const)('size %s applies class %s', (size, cls) => {
    render(<Button size={size}>x</Button>)
    expect(screen.getByRole('button')).toHaveClass(cls)
  })

  it('defaults to primary / md', () => {
    render(<Button>x</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('btn-primary')
    expect(btn).toHaveClass('btn-md')
  })

  it('fires onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Go</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('is disabled when the disabled prop is set', () => {
    render(<Button disabled>x</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
