import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CameraView } from '@/components/camera/CameraView'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { HoldRing } from '@/components/lessons/HoldRing'
import { useAudio } from '@/hooks/useAudio'
import { useAutoSubmit } from '@/hooks/useAutoSubmit'
import { useStrings } from '@/i18n/useStrings'
import { resolveStep } from '@/utils/lessonsContent'
import { burst } from '@/utils/confetti'
import type { LessonStep } from '@/content/lessons'

// Lesson pacing (gentler than the Play game's auto-submit timings).
const WATCH_MIN_MS = 2500 // a `watch` visual shows at least this long before Next enables
const LESSON_PROMPT_MS = 1000 // T1: hold the value steady this long → ring appears
const LESSON_CONFIRM_MS = 800 // T2: keep holding → commit
const CORRECT_PAUSE_MS = 900 // show the green tick before advancing
const TRY_AGAIN_MS = 1200 // show the red cross (assessment miss) before advancing

interface LessonStepProps {
  step: LessonStep
  onComplete: () => void
  /** Assessment-phase callback (grades the attempt); drives assessment advance. */
  onAttempt?: (correct: boolean) => void
  /** True during the assessment phase: commit any held value and grade it. */
  assessment?: boolean
}

/**
 * Dispatches on `step.kind`. Phase A implements `watch` + `showMe`; the other
 * kinds render a prompt + Next (filled in by Phase C). Advancement is the
 * parent's job — this component only signals completion via callbacks.
 */
export function LessonStep({ step, onComplete, onAttempt, assessment = false }: LessonStepProps) {
  switch (step.kind) {
    case 'watch':
      return <WatchView step={step} onComplete={onComplete} />
    case 'showMe':
      return <ShowMeView step={step} onComplete={onComplete} onAttempt={onAttempt} assessment={assessment} />
    default:
      return <PromptView step={step} onComplete={onComplete} />
  }
}

/** Narrated demo. Phase A: no TTS — Next enables after WATCH_MIN_MS. */
function WatchView({ step, onComplete }: { step: Extract<LessonStep, { kind: 'watch' }>; onComplete: () => void }) {
  const t = useStrings()
  const audio = useAudio()
  const [ready, setReady] = useState(false)
  const minMs = step.minDurationMs ?? WATCH_MIN_MS

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), minMs)
    return () => window.clearTimeout(id)
  }, [minMs])

  const visual = Array.isArray(step.visual) ? step.visual.join('   ') : step.visual

  return (
    <Card className="items-center text-center">
      <p className="font-display text-lg text-base-content/70">{resolveStep(step, t.lessons)}</p>
      <motion.div
        key={step.id}
        className="my-3 font-display text-7xl font-extrabold text-primary"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        {visual}
      </motion.div>
      <Button variant="primary" disabled={!ready} onClick={() => { audio.playClick(); onComplete() }}>
        {ready ? t.lessons.next : t.lessons.listen}
      </Button>
    </Card>
  )
}

/** Hold up the target number of fingers; camera-validated. */
function ShowMeView({
  step,
  onComplete,
  onAttempt,
  assessment,
}: {
  step: Extract<LessonStep, { kind: 'showMe' }>
  onComplete: () => void
  onAttempt?: (correct: boolean) => void
  assessment: boolean
}) {
  const t = useStrings()
  const audio = useAudio()
  const target = step.target
  const [detected, setDetected] = useState(-1)
  const [feedback, setFeedback] = useState<null | 'correct' | 'wrong'>(null)
  const doneRef = useRef(false)

  // The parent reuses this view across consecutive `showMe` steps (so the camera
  // stays live). Reset per-step interaction state when the step id changes;
  // useAutoSubmit resets its hold via `questionId` on its own.
  useEffect(() => {
    doneRef.current = false
    setFeedback(null)
  }, [step.id])

  // Teaching: the hold only arms on the CORRECT value (a wrong one held forever
  // never commits). Assessment: any held value commits and is graded.
  const pending = useAutoSubmit({
    enabled: true,
    promptMs: step.promptMs ?? LESSON_PROMPT_MS,
    confirmMs: step.confirmMs ?? LESSON_CONFIRM_MS,
    detected,
    canSubmit: !doneRef.current && (assessment ? detected >= 0 : detected === target),
    questionId: step.id,
    commit: (n: number) => {
      if (doneRef.current) return
      doneRef.current = true
      const correct = assessment ? n === target : true
      setFeedback(correct ? 'correct' : 'wrong')
      if (correct) {
        audio.playCorrect()
        burst()
      } else {
        audio.playWrong()
      }
      window.setTimeout(() => {
        if (assessment) onAttempt?.(correct)
        else onComplete()
      }, correct ? CORRECT_PAUSE_MS : TRY_AGAIN_MS)
    },
  })

  return (
    <div className="space-y-4">
      <Card className="items-center text-center">
        <p className="font-display text-lg text-base-content/70">{resolveStep(step, t.lessons)}</p>
        <div className="my-2 font-display text-7xl font-extrabold text-primary">{target}</div>
        {feedback === 'correct' ? (
          <motion.div
            className="badge badge-lg badge-success font-display"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            ✅
          </motion.div>
        ) : feedback === 'wrong' ? (
          <motion.div
            className="badge badge-lg badge-error font-display"
            initial={{ x: 0 }}
            animate={{ x: [0, -8, 8, -6, 6, 0] }}
            transition={{ duration: 0.4 }}
          >
            ❌
          </motion.div>
        ) : pending ? (
          <div className="flex flex-col items-center gap-1">
            <HoldRing value={pending.value} progress={pending.progress} />
            <span className="text-sm text-base-content/70">{t.play.autoPromptCancel}</span>
          </div>
        ) : (
          <div className="badge badge-lg badge-ghost font-display">
            {detected < 0 ? t.play.waiting : t.play.showing(detected)}
          </div>
        )}
      </Card>

      <CameraView digitMode numHands={step.numHands ?? 1} onNumberChange={setDetected} />
    </div>
  )
}

/** Placeholder for `count` / `choose` / `compare` / `solve` (Phase C views). */
function PromptView({ step, onComplete }: { step: LessonStep; onComplete: () => void }) {
  const t = useStrings()
  const audio = useAudio()
  return (
    <Card className="items-center text-center">
      <p className="font-display text-lg">{resolveStep(step, t.lessons)}</p>
      <Button variant="primary" className="mt-3" onClick={() => { audio.playClick(); onComplete() }}>
        {t.lessons.next}
      </Button>
    </Card>
  )
}
