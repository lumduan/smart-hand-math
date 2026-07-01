import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

function Boom(): never {
  throw new Error('kaboom-test-error')
}

describe('ErrorBoundary', () => {
  it('renders its children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <div>hello child</div>
      </ErrorBoundary>,
    )
    expect(screen.getByText('hello child')).toBeInTheDocument()
  })

  it('catches a child throw and shows a recoverable card with the error message', () => {
    // React logs the caught error to console.error — silence it for a clean run.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Oops! Something broke')).toBeInTheDocument()
    expect(screen.getByText('kaboom-test-error')).toBeInTheDocument() // surfaced for reporting
    expect(screen.getByRole('button', { name: /Start over/ })).toBeInTheDocument()
    spy.mockRestore()
  })
})
