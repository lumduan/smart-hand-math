import { useState } from 'react'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'

interface NumberPadProps {
  /** Highest acceptable answer (single-hand lessons pass 9). */
  max: number
  /** Disable entry (e.g. once the step is graded). */
  disabled?: boolean
  /** Receives the parsed, clamped [0, max] answer on submit. */
  onSubmit: (n: number) => void
  title: string
  submitLabel: string
  ariaLabel: string
  placeholder?: string
}

/**
 * Number-entry fallback so a lesson's camera steps stay playable without a
 * webcam (CLAUDE.md §14) and testable in jsdom. Mirrors the Play page's inline
 * pad; owns its draft value and clears on submit. Grading/audio is the caller's
 * job — this only reports a valid number.
 */
export function NumberPad({
  max,
  disabled = false,
  onSubmit,
  title,
  submitLabel,
  ariaLabel,
  placeholder = '?',
}: NumberPadProps) {
  const [value, setValue] = useState('')

  const submit = () => {
    if (value === '') return
    const parsed = parseInt(value, 10)
    if (Number.isNaN(parsed)) return
    setValue('')
    onSubmit(Math.max(0, Math.min(max, parsed)))
  }

  return (
    <Card>
      <p className="font-display text-sm text-base-content/70">{title}</p>
      <form
        className="mt-2 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <input
          type="number"
          min={0}
          max={max}
          inputMode="numeric"
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          className="input input-bordered w-20 font-display text-lg"
          placeholder={placeholder}
          aria-label={ariaLabel}
        />
        <Button type="submit" variant="secondary" disabled={disabled || value === ''}>
          {submitLabel}
        </Button>
      </form>
    </Card>
  )
}
