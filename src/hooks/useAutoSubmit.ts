import { useCallback, useEffect, useRef, useState } from 'react'

export interface AutoSubmitPending {
  /** The finger value being submitted. */
  value: number
  /** 0..1 — how far through the confirm window (T2) the hold is. */
  progress: number
}

export interface UseAutoSubmitArgs {
  /** Master switch; when false the hook is inert (caller uses the legacy path). */
  enabled: boolean
  /** T1 — how long the value must stay constant before the prompt appears. */
  promptMs: number
  /** T2 — how long after the prompt until the value commits. */
  confirmMs: number
  /** Denoised finger value, or -1 when no hand is visible. */
  detected: number
  /** Whether submission is currently allowed (playing, no answer yet, question present). */
  canSubmit: boolean
  /** Current question id; changing it resets the hold. */
  questionId: string | null
  /** Invoked with the held value once the confirm window elapses. */
  commit: (n: number) => void
}

/** Tick rate for the timer loop + progress-ring updates (~20 fps). */
const TICK_MS = 50

/**
 * Two-stage gesture auto-submit (Phase 8.2). After `detected` stays constant for
 * `promptMs`, a pending prompt surfaces (with a 0..1 progress over `confirmMs`);
 * once progress reaches 1 the value is committed. Any value change, or a lost
 * hand (`-1`), cancels immediately. Reset on `questionId` change so a hold never
 * carries across questions.
 *
 * Time-driven (setInterval) rather than "effect re-fires on `detected` change":
 * that older pattern is jitter-dependent and skips a perfectly still hand (React
 * bails out of a re-render when `detected` is unchanged). See RFC-0003.
 */
export function useAutoSubmit({
  enabled,
  promptMs,
  confirmMs,
  detected,
  canSubmit,
  questionId,
  commit,
}: UseAutoSubmitArgs): AutoSubmitPending | null {
  const [pending, setPending] = useState<AutoSubmitPending | null>(null)

  // Latest props read inside the interval without re-arming it each frame.
  const detectedRef = useRef(detected)
  const commitRef = useRef(commit)
  detectedRef.current = detected
  commitRef.current = commit

  // Timing state — read/written only inside the loop, never reactive.
  const stableSinceRef = useRef(0) // ts the current value first held; 0 = idle
  const promptAtRef = useRef(0) // ts the prompt appeared; 0 = no prompt
  const pendingValueRef = useRef<number | null>(null)
  const lastValueRef = useRef<number>(-1)

  const reset = useCallback(() => {
    stableSinceRef.current = 0
    promptAtRef.current = 0
    pendingValueRef.current = null
    setPending((p) => (p ? null : p))
  }, [])

  // Reset when the question changes — a hold never carries across questions.
  useEffect(() => {
    lastValueRef.current = -1
    reset()
  }, [questionId, reset])

  useEffect(() => {
    if (!enabled || !canSubmit) {
      reset()
      return
    }
    const id = window.setInterval(() => {
      const v = detectedRef.current

      // No hand: cancel any in-flight prompt and stay idle.
      if (v < 0) {
        if (pendingValueRef.current !== null) reset()
        return
      }
      // Value changed: restart the stability measurement (cancels the prompt).
      if (v !== lastValueRef.current) {
        lastValueRef.current = v
        stableSinceRef.current = performance.now()
        if (pendingValueRef.current !== null) reset()
        return
      }

      // Stable value — arm the stability clock if needed.
      if (stableSinceRef.current === 0) stableSinceRef.current = performance.now()
      const now = performance.now()
      const held = now - stableSinceRef.current

      // T1 reached and no prompt yet: raise it.
      if (pendingValueRef.current === null) {
        if (held >= promptMs) {
          pendingValueRef.current = v
          promptAtRef.current = now
          setPending({ value: v, progress: 0 })
        }
        return
      }

      // Prompt is up: advance the confirm window (T2).
      const progress = Math.min(1, (now - promptAtRef.current) / confirmMs)
      setPending({ value: pendingValueRef.current, progress })
      if (progress >= 1) {
        const value = pendingValueRef.current
        reset()
        commitRef.current(value)
      }
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [enabled, canSubmit, promptMs, confirmMs, reset])

  return pending
}
