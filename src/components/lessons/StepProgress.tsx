import { motion } from 'framer-motion'

interface StepProgressProps {
  /** Teaching steps (id only is needed; drawn as one dot each). */
  steps: readonly { id: string }[]
  /** 0-based index of the current teaching step. Pass `steps.length` while assessing. */
  current: number
  /** Assessment phase: render the checkpoint pill and mark all teach dots done. */
  assessing?: boolean
  assessmentIndex?: number
  assessmentTotal?: number
}

/**
 * A row of dots showing lesson progress: done (✓) / current (primary ring) /
 * future (ghost), plus a 🎯 checkpoint pill during the assessment phase.
 */
export function StepProgress({
  steps,
  current,
  assessing = false,
  assessmentIndex = 0,
  assessmentTotal = 0,
}: StepProgressProps) {
  return (
    <motion.div layout className="flex flex-wrap items-center justify-center gap-1.5">
      {steps.map((s, i) => {
        const state: 'done' | 'current' | 'future' = i < current ? 'done' : i === current ? 'current' : 'future'
        const cls =
          state === 'done'
            ? 'badge-success'
            : state === 'current'
              ? 'badge-primary ring-2 ring-primary/40 scale-110'
              : 'badge-ghost opacity-50'
        return (
          <span key={s.id} className={`badge badge-md font-display ${cls}`} aria-label={`Step ${i + 1}`}>
            {state === 'done' ? '✓' : i + 1}
          </span>
        )
      })}
      {assessing && (
        <span className="badge badge-md badge-warning font-display">
          🎯 {assessmentIndex + 1}/{assessmentTotal}
        </span>
      )}
    </motion.div>
  )
}
