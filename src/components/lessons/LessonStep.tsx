import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CameraView } from '@/components/camera/CameraView'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { HoldRing } from '@/components/lessons/HoldRing'
import { NumberPad } from '@/components/lessons/NumberPad'
import { useAppSettings } from '@/context/AppSettingsContext'
import { useAudio } from '@/hooks/useAudio'
import { useAutoSubmit } from '@/hooks/useAutoSubmit'
import { useTts } from '@/hooks/useTts'
import { useStrings } from '@/i18n/useStrings'
import { resolveStep, spokenExpression } from '@/utils/lessonsContent'
import { burst } from '@/utils/confetti'
import type { LessonStep } from '@/content/lessons'

// Lesson pacing (gentler than the Play game's auto-submit timings).
const WATCH_MIN_MS = 2500 // a `watch` visual shows at least this long before Next enables
const LESSON_PROMPT_MS = 1000 // T1: hold the value steady this long → ring appears
const LESSON_CONFIRM_MS = 800 // T2: keep holding → commit
// Two-hand (0–99) holds are wobblier for small kids — give the pose more time.
const LESSON_PROMPT_MS_2H = 1400
const LESSON_CONFIRM_MS_2H = 1200
const CORRECT_PAUSE_MS = 900 // show the green tick before advancing
const TRY_AGAIN_MS = 1200 // show the red cross (assessment miss) before advancing
// When narration IS spoken, Next normally enables on the speech's `onend`. This
// cap is a safety net so a dropped/error'd utterance can never leave Next stuck.
const SPEECH_CAP_MS = 12000

interface LessonStepProps {
  step: LessonStep
  onComplete: () => void
  /** Assessment-phase callback (grades the attempt); drives assessment advance. */
  onAttempt?: (correct: boolean) => void
  /** A wrong answer during a teaching step (feeds the star rating). */
  onRetry?: () => void
  /** True during the assessment phase: commit any held value and grade it. */
  assessment?: boolean
}

/**
 * Dispatches on `step.kind` — all six kinds are built. Advancement is the
 * parent's job; this component only signals via callbacks. `showMe` and `solve`
 * share one camera-answer view; `count`/`compare`/`choose` are tap-based.
 */
export function LessonStep({ step, onComplete, onAttempt, onRetry, assessment = false }: LessonStepProps) {
  switch (step.kind) {
    case 'watch':
      return <WatchView step={step} onComplete={onComplete} />
    case 'showMe':
    case 'solve':
      return (
        <FingerAnswerView
          step={step}
          assessment={assessment}
          onComplete={onComplete}
          onAttempt={onAttempt}
          onRetry={onRetry}
        />
      )
    case 'choose':
      return (
        <ChooseView step={step} assessment={assessment} onComplete={onComplete} onAttempt={onAttempt} onRetry={onRetry} />
      )
    case 'count':
      return (
        <CountView step={step} assessment={assessment} onComplete={onComplete} onAttempt={onAttempt} onRetry={onRetry} />
      )
    case 'compare':
      return (
        <CompareView step={step} assessment={assessment} onComplete={onComplete} onAttempt={onAttempt} onRetry={onRetry} />
      )
    default:
      // Unknown/unhandled kind — render nothing rather than returning undefined
      // (which React treats as an error and would blank the whole page).
      return null
  }
}

/**
 * Narrated demo. The narration is spoken on mount (Phase B); Next enables when
 * the speech ends. Where speech is muted or unsupported it falls back to a
 * timer (WATCH_MIN_MS) so a non-reader still gets the minimum look-time.
 */
function WatchView({ step, onComplete }: { step: Extract<LessonStep, { kind: 'watch' }>; onComplete: () => void }) {
  const t = useStrings()
  const audio = useAudio()
  const tts = useTts()
  const { muted } = useAppSettings()
  const ttsRef = useRef(tts)
  ttsRef.current = tts
  const [ready, setReady] = useState(false)
  const minMs = step.minDurationMs ?? WATCH_MIN_MS
  const narration = resolveStep(step, t.lessons)
  // Require an actual voice: a browser can report `supported` yet have none, in
  // which case speech never fires `onend` — gate on hasVoices so Next falls back
  // to the minDuration timer instead of waiting the full SPEECH_CAP_MS.
  const willSpeak = tts.supported && tts.hasVoices && !muted && narration.length > 0

  useEffect(() => {
    setReady(false)
    const speech = ttsRef.current
    if (willSpeak) {
      speech.speak(narration, { onEnd: () => setReady(true) })
      // Safety net: enable Next even if `onend` never arrives (speech error).
      const cap = window.setTimeout(() => setReady(true), SPEECH_CAP_MS)
      return () => {
        window.clearTimeout(cap)
        speech.cancel()
      }
    }
    // No speech (muted / unsupported): enable after the minimum look-time.
    const id = window.setTimeout(() => setReady(true), minMs)
    return () => window.clearTimeout(id)
  }, [step.id, narration, minMs, willSpeak])

  // Worded visuals are localized (`t.lessons.visuals[id]`); pure glyph visuals stay
  // inline on the step. A missing id is undefined at runtime despite the Record type.
  const localizedVisual = t.lessons.visuals[step.id]
  const visual =
    typeof localizedVisual === 'string'
      ? localizedVisual
      : step.visual == null
        ? ''
        : Array.isArray(step.visual)
          ? step.visual.join('   ')
          : step.visual

  return (
    <Card className="items-center text-center">
      <p className="font-display text-lg text-base-content/70">{narration}</p>
      <motion.div
        key={step.id}
        className="my-3 font-display text-7xl font-extrabold text-primary"
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        {visual}
      </motion.div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {willSpeak && (
          <Button variant="ghost" onClick={() => ttsRef.current.speak(narration)}>
            {t.lessons.replay}
          </Button>
        )}
        <Button variant="primary" disabled={!ready} onClick={() => { audio.playClick(); onComplete() }}>
          {ready ? t.lessons.next : t.lessons.listen}
        </Button>
      </div>
    </Card>
  )
}

/**
 * Shared camera-answer view for `showMe` (reproduce a digit) and `solve` (work
 * out `a ± b` and show the answer). While teaching, the hold arms only on the
 * correct value, so the camera never commits a wrong answer; the number-pad
 * fallback (no-camera play) can, and a wrong pad answer is a gentle "try again"
 * that counts as a retry (feeds the star rating). Assessment grades whatever is
 * submitted (camera or pad) and advances.
 */
function FingerAnswerView({
  step,
  assessment,
  onComplete,
  onAttempt,
  onRetry,
}: {
  step: Extract<LessonStep, { kind: 'showMe' | 'solve' }>
  assessment: boolean
  onComplete: () => void
  onAttempt?: (correct: boolean) => void
  onRetry?: () => void
}) {
  const t = useStrings()
  const audio = useAudio()
  const tts = useTts()
  const { muted } = useAppSettings()
  const ttsRef = useRef(tts)
  ttsRef.current = tts

  const expected = step.kind === 'showMe' ? step.target : step.answer
  const glyph = step.kind === 'showMe' ? String(step.target) : step.display
  const numHands = step.numHands ?? 1
  const prompt = resolveStep(step, t.lessons)
  // Spoken text: authored narration wins; a generated `solve` with none speaks
  // the expression itself ("two plus three") so a pre-reader hears the problem.
  const authored = t.lessons.steps[step.id]
  const spoken =
    typeof authored === 'string' ? authored : step.kind === 'solve' ? spokenExpression(step.display) : prompt
  const canReplay = tts.supported && tts.hasVoices && !muted

  const [detected, setDetected] = useState(-1)
  const [feedback, setFeedback] = useState<null | 'correct' | 'wrong'>(null)
  const [locked, setLocked] = useState(false)
  const doneRef = useRef(false)

  // Reset per-step state + narrate whenever the step id changes (the parent
  // reuses this instance across consecutive steps so the camera stays live).
  useEffect(() => {
    doneRef.current = false
    setLocked(false)
    setFeedback(null)
    setDetected(-1)
    ttsRef.current.speak(spoken)
    return () => ttsRef.current.cancel()
  }, [step.id, spoken])

  // Grade a submitted value (camera hold or pad).
  const grade = (n: number) => {
    if (doneRef.current) return
    const correct = n === expected
    if (!assessment && !correct) {
      // Teaching miss (only reachable via the pad): gentle nudge, count a retry, stay put.
      setFeedback('wrong')
      audio.playTryAgain()
      ttsRef.current.speak(t.lessons.tryAgain)
      onRetry?.()
      window.setTimeout(() => setFeedback(null), TRY_AGAIN_MS)
      return
    }
    doneRef.current = true
    setLocked(true)
    setFeedback(correct ? 'correct' : 'wrong')
    if (correct) {
      audio.play(assessment ? 'correct' : 'stepComplete')
      burst()
      ttsRef.current.speak(t.lessons.spokenGreat)
    } else {
      audio.playTryAgain()
      ttsRef.current.speak(t.lessons.tryAgain)
    }
    window.setTimeout(() => {
      if (assessment) onAttempt?.(correct)
      else onComplete()
    }, correct ? CORRECT_PAUSE_MS : TRY_AGAIN_MS)
  }

  // Teaching: the hold only arms on the correct value. Assessment: any value grades.
  const pending = useAutoSubmit({
    enabled: true,
    promptMs: step.promptMs ?? (numHands === 2 ? LESSON_PROMPT_MS_2H : LESSON_PROMPT_MS),
    confirmMs: step.confirmMs ?? (numHands === 2 ? LESSON_CONFIRM_MS_2H : LESSON_CONFIRM_MS),
    detected,
    canSubmit: !doneRef.current && (assessment ? detected >= 0 : detected === expected),
    questionId: step.id,
    commit: grade,
  })

  return (
    <div className="space-y-4">
      <Card className="items-center text-center">
        <p className="font-display text-lg text-base-content/70">{prompt}</p>
        {canReplay && (
          <button
            type="button"
            className="btn btn-ghost btn-sm rounded-full font-display"
            onClick={() => ttsRef.current.speak(spoken)}
          >
            {t.lessons.replay}
          </button>
        )}
        <div className="my-2 font-display text-6xl font-extrabold text-primary">{glyph}</div>
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

      {/* One-hand steps read a handedness-independent digit (0–9); two-hand steps
          read place value (0–99) via handsToNumber, so digitMode is off there. */}
      <CameraView digitMode={numHands === 1} numHands={numHands} onNumberChange={setDetected} />

      <NumberPad
        key={step.id}
        max={numHands === 2 ? 99 : 9}
        disabled={locked}
        onSubmit={grade}
        title={t.lessons.padTitle}
        submitLabel={t.lessons.padSubmit}
        ariaLabel={t.lessons.padAria}
      />
    </div>
  )
}

/** Multiple choice: tap the correct option (used by teaching `choose` steps). */
function ChooseView({
  step,
  assessment,
  onComplete,
  onAttempt,
  onRetry,
}: {
  step: Extract<LessonStep, { kind: 'choose' }>
  assessment: boolean
  onComplete: () => void
  onAttempt?: (correct: boolean) => void
  onRetry?: () => void
}) {
  const t = useStrings()
  const audio = useAudio()
  const tts = useTts()
  const { muted } = useAppSettings()
  const ttsRef = useRef(tts)
  ttsRef.current = tts
  const prompt = resolveStep(step, t.lessons)
  const canReplay = tts.supported && tts.hasVoices && !muted

  const [picked, setPicked] = useState<number | null>(null)
  const [locked, setLocked] = useState(false)
  const doneRef = useRef(false)

  useEffect(() => {
    doneRef.current = false
    setLocked(false)
    setPicked(null)
    ttsRef.current.speak(prompt)
    return () => ttsRef.current.cancel()
  }, [step.id, prompt])

  const choose = (value: number) => {
    if (doneRef.current) return
    const correct = value === step.answer
    setPicked(value)
    if (!assessment && !correct) {
      // Teaching miss: gentle nudge, count a retry, let them pick again.
      audio.playTryAgain()
      ttsRef.current.speak(t.lessons.tryAgain)
      onRetry?.()
      window.setTimeout(() => setPicked(null), TRY_AGAIN_MS)
      return
    }
    doneRef.current = true
    setLocked(true)
    if (correct) {
      audio.play(assessment ? 'correct' : 'stepComplete')
      burst()
      ttsRef.current.speak(t.lessons.spokenGreat)
    } else {
      audio.playTryAgain()
      ttsRef.current.speak(t.lessons.tryAgain)
    }
    window.setTimeout(() => {
      if (assessment) onAttempt?.(correct)
      else onComplete()
    }, correct ? CORRECT_PAUSE_MS : TRY_AGAIN_MS)
  }

  return (
    <Card className="items-center text-center">
      <p className="font-display text-lg text-base-content/70">{prompt}</p>
      {canReplay && (
        <button
          type="button"
          className="btn btn-ghost btn-sm rounded-full font-display"
          onClick={() => ttsRef.current.speak(prompt)}
        >
          {t.lessons.replay}
        </button>
      )}
      <div className="my-2 font-display text-6xl font-extrabold text-primary">{step.display}</div>
      <div className="flex flex-wrap justify-center gap-3">
        {step.options.map((opt) => {
          const isPicked = picked === opt
          const variant = isPicked ? (opt === step.answer ? 'success' : 'danger') : 'accent'
          return (
            <Button key={opt} variant={variant} size="lg" disabled={locked} onClick={() => choose(opt)}>
              {opt}
            </Button>
          )
        })}
      </div>
      {picked !== null && (
        <div className={`badge badge-lg font-display mt-1 ${picked === step.answer ? 'badge-success' : 'badge-error'}`}>
          {picked === step.answer ? '✅' : '❌'}
        </div>
      )}
    </Card>
  )
}

/** Randomly order two options (Unit 1 uses 2 choices). */
function shuffle2(a: number, b: number): number[] {
  return Math.random() < 0.5 ? [a, b] : [b, a]
}

/** Count the objects (tap each → tick), then pick the total (Unit 1). */
function CountView({
  step,
  assessment,
  onComplete,
  onAttempt,
  onRetry,
}: {
  step: Extract<LessonStep, { kind: 'count' }>
  assessment: boolean
  onComplete: () => void
  onAttempt?: (correct: boolean) => void
  onRetry?: () => void
}) {
  const t = useStrings()
  const audio = useAudio()
  const tts = useTts()
  const { muted } = useAppSettings()
  const ttsRef = useRef(tts)
  ttsRef.current = tts
  const prompt = resolveStep(step, t.lessons)
  const canReplay = tts.supported && tts.hasVoices && !muted

  const [tapped, setTapped] = useState<ReadonlySet<number>>(new Set())
  const [picked, setPicked] = useState<number | null>(null)
  const [locked, setLocked] = useState(false)
  const doneRef = useRef(false)

  // Two options: the true count + a near distractor.
  const options = useMemo(() => shuffle2(step.count, step.count === 0 ? 1 : step.count - 1), [step.count])

  useEffect(() => {
    doneRef.current = false
    setLocked(false)
    setPicked(null)
    setTapped(new Set())
    ttsRef.current.speak(prompt)
    return () => ttsRef.current.cancel()
  }, [step.id, prompt])

  const tap = (i: number) => {
    audio.playTick()
    setTapped((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const choose = (value: number) => {
    if (doneRef.current) return
    const correct = value === step.count
    setPicked(value)
    if (!assessment && !correct) {
      audio.playTryAgain()
      ttsRef.current.speak(t.lessons.tryAgain)
      onRetry?.()
      window.setTimeout(() => setPicked(null), TRY_AGAIN_MS)
      return
    }
    doneRef.current = true
    setLocked(true)
    if (correct) {
      audio.play(assessment ? 'correct' : 'stepComplete')
      burst()
      ttsRef.current.speak(t.lessons.spokenGreat)
    } else {
      audio.playTryAgain()
      ttsRef.current.speak(t.lessons.tryAgain)
    }
    window.setTimeout(() => {
      if (assessment) onAttempt?.(correct)
      else onComplete()
    }, correct ? CORRECT_PAUSE_MS : TRY_AGAIN_MS)
  }

  return (
    <Card className="items-center text-center">
      <p className="font-display text-lg text-base-content/70">{prompt}</p>
      {canReplay && (
        <button
          type="button"
          className="btn btn-ghost btn-sm rounded-full font-display"
          onClick={() => ttsRef.current.speak(prompt)}
        >
          {t.lessons.replay}
        </button>
      )}
      <div className="my-3 flex min-h-[3.5rem] flex-wrap items-center justify-center gap-2">
        {step.count === 0 ? (
          <span className="font-display text-2xl text-base-content/50">🚫</span>
        ) : (
          Array.from({ length: step.count }, (_, i) => (
            <button
              key={i}
              type="button"
              aria-label={t.lessons.countObjectAria}
              className={`text-5xl transition-transform ${tapped.has(i) ? 'scale-110' : 'opacity-60'}`}
              onClick={() => tap(i)}
            >
              {step.object}
            </button>
          ))
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {options.map((opt) => {
          const isPicked = picked === opt
          const variant = isPicked ? (opt === step.count ? 'success' : 'danger') : 'accent'
          return (
            <Button key={opt} variant={variant} size="lg" disabled={locked} onClick={() => choose(opt)}>
              {opt}
            </Button>
          )
        })}
      </div>
      {picked !== null && (
        <div className={`badge badge-lg font-display mt-2 ${picked === step.count ? 'badge-success' : 'badge-error'}`}>
          {picked === step.count ? '✅' : '❌'}
        </div>
      )}
    </Card>
  )
}

/** Compare two groups; tap the one with more (or "Same"). (Unit 1.) */
function CompareView({
  step,
  assessment,
  onComplete,
  onAttempt,
  onRetry,
}: {
  step: Extract<LessonStep, { kind: 'compare' }>
  assessment: boolean
  onComplete: () => void
  onAttempt?: (correct: boolean) => void
  onRetry?: () => void
}) {
  const t = useStrings()
  const audio = useAudio()
  const tts = useTts()
  const { muted } = useAppSettings()
  const ttsRef = useRef(tts)
  ttsRef.current = tts
  const prompt = resolveStep(step, t.lessons)
  const canReplay = tts.supported && tts.hasVoices && !muted

  const [choice, setChoice] = useState<null | 'more' | 'fewer' | 'equal'>(null)
  const [locked, setLocked] = useState(false)
  const doneRef = useRef(false)

  useEffect(() => {
    doneRef.current = false
    setLocked(false)
    setChoice(null)
    ttsRef.current.speak(prompt)
    return () => ttsRef.current.cancel()
  }, [step.id, prompt])

  // Tapping picks a relation of LEFT vs right: left → 'more', right → 'fewer', Same → 'equal'.
  const pick = (relation: 'more' | 'fewer' | 'equal') => {
    if (doneRef.current) return
    const correct = relation === step.answer
    setChoice(relation)
    if (!assessment && !correct) {
      audio.playTryAgain()
      ttsRef.current.speak(t.lessons.tryAgain)
      onRetry?.()
      window.setTimeout(() => setChoice(null), TRY_AGAIN_MS)
      return
    }
    doneRef.current = true
    setLocked(true)
    if (correct) {
      audio.play(assessment ? 'correct' : 'stepComplete')
      burst()
      ttsRef.current.speak(t.lessons.spokenGreat)
    } else {
      audio.playTryAgain()
      ttsRef.current.speak(t.lessons.tryAgain)
    }
    window.setTimeout(() => {
      if (assessment) onAttempt?.(correct)
      else onComplete()
    }, correct ? CORRECT_PAUSE_MS : TRY_AGAIN_MS)
  }

  const groupClass = (side: 'more' | 'fewer') =>
    `flex flex-1 flex-wrap content-center justify-center gap-1 rounded-3xl border-4 p-3 text-4xl transition ${
      choice === side ? (side === step.answer ? 'border-success' : 'border-error') : 'border-base-300'
    }`

  return (
    <Card className="items-center text-center">
      <p className="font-display text-lg text-base-content/70">{prompt}</p>
      {canReplay && (
        <button
          type="button"
          className="btn btn-ghost btn-sm rounded-full font-display"
          onClick={() => ttsRef.current.speak(prompt)}
        >
          {t.lessons.replay}
        </button>
      )}
      <div className="my-3 flex w-full items-stretch gap-3">
        <button
          type="button"
          aria-label={t.lessons.compareLeftAria}
          disabled={locked}
          className={groupClass('more')}
          onClick={() => pick('more')}
        >
          {Array.from({ length: step.left.count }, (_, i) => (
            <span key={i}>{step.left.object}</span>
          ))}
        </button>
        <button
          type="button"
          aria-label={t.lessons.compareRightAria}
          disabled={locked}
          className={groupClass('fewer')}
          onClick={() => pick('fewer')}
        >
          {Array.from({ length: step.right.count }, (_, i) => (
            <span key={i}>{step.right.object}</span>
          ))}
        </button>
      </div>
      <Button
        variant={choice === 'equal' ? (step.answer === 'equal' ? 'success' : 'danger') : 'ghost'}
        disabled={locked}
        onClick={() => pick('equal')}
      >
        {t.lessons.same}
      </Button>
      {choice !== null && (
        <div className={`badge badge-lg font-display mt-2 ${choice === step.answer ? 'badge-success' : 'badge-error'}`}>
          {choice === step.answer ? '✅' : '❌'}
        </div>
      )}
    </Card>
  )
}
