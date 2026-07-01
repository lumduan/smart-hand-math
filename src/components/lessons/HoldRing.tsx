import type { CSSProperties } from 'react'

interface HoldRingProps {
  /** The finger value currently being held. */
  value: number
  /** 0..1 — how far through the confirm window the hold is. */
  progress: number
}

/**
 * Radial hold-to-confirm ring, extracted from the Play page's inline ring so
 * the lesson `showMe` / `solve` views can share it. DaisyUI `radial-progress`
 * driven by the `--value` CSS variable.
 */
export function HoldRing({ value, progress }: HoldRingProps) {
  return (
    <div
      className="radial-progress text-primary font-display"
      style={
        {
          '--value': progress * 100,
          '--size': '3rem',
          '--thickness': '5px',
        } as CSSProperties
      }
      role="status"
      aria-live="polite"
    >
      {value}
    </div>
  )
}
