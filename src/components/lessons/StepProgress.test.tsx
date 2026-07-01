import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StepProgress } from '@/components/lessons/StepProgress'

describe('StepProgress', () => {
  it('renders one labeled dot per step with done/current/future content', () => {
    render(<StepProgress steps={[{ id: 'a' }, { id: 'b' }, { id: 'c' }]} current={1} />)
    expect(screen.getByLabelText('Step 1')).toHaveTextContent('✓') // done
    expect(screen.getByLabelText('Step 2')).toHaveTextContent('2') // current
    expect(screen.getByLabelText('Step 3')).toHaveTextContent('3') // future
  })

  it('marks all steps done and shows the checkpoint pill while assessing', () => {
    render(
      <StepProgress
        steps={[{ id: 'a' }, { id: 'b' }]}
        current={2}
        assessing
        assessmentIndex={0}
        assessmentTotal={5}
      />,
    )
    expect(screen.getByLabelText('Step 1')).toHaveTextContent('✓')
    expect(screen.getByLabelText('Step 2')).toHaveTextContent('✓')
    expect(screen.getByText(/🎯 1\/5/)).toBeInTheDocument()
  })
})
