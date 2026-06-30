import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CameraView } from '@/components/camera/CameraView'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { Modal } from '@/components/common/Modal'
import { LevelBadge } from '@/components/game/LevelBadge'
import { ScoreBoard } from '@/components/game/ScoreBoard'
import { Timer } from '@/components/game/Timer'
import {
  MISSION_GOAL,
  STARTING_LIVES,
  TIMED_SECONDS,
  useGame,
} from '@/context/GameContext'
import { useAudio } from '@/hooks/useAudio'
import { useStrings } from '@/i18n/useStrings'
import { motion } from 'framer-motion'
import { burst, celebrate } from '@/utils/confetti'

/** Anti-tremor gate: the answer must be held steady this long before it commits. */
const ANSWER_HOLD_MS = 500
/** Largest answer the player can show with two Soroban hands. */
const MAX_ANSWER = 99

/** Idle-screen mode cards (icon/title/desc come from the i18n dictionary). */
const MODES = [
  { mode: 'endless', icon: '♾️' },
  { mode: 'timed', icon: '⏱️' },
  { mode: 'missions', icon: '🎯' },
] as const

export function Play() {
  const {
    status,
    mode,
    currentQuestion,
    score,
    best,
    streak,
    lives,
    level,
    difficulty,
    lastAnswer,
    start,
    answer,
    next,
    timeUp,
    reset,
  } = useGame()
  const audio = useAudio()
  const t = useStrings()
  const [detected, setDetected] = useState<number>(-1)
  const [padValue, setPadValue] = useState('')

  // Confirmation window + per-question lock to avoid double submissions.
  const confirmStartedAt = useRef(0)
  const submittedFor = useRef<string | null>(null)
  const prevLevelRef = useRef(level)

  const submit = useCallback(
    (n: number) => {
      if (status !== 'playing' || !currentQuestion) return
      if (submittedFor.current === currentQuestion.id) return
      submittedFor.current = currentQuestion.id
      answer(n)
    },
    [status, currentQuestion, answer],
  )

  const submitPad = useCallback(() => {
    const n = Math.max(0, Math.min(MAX_ANSWER, Number.parseInt(padValue, 10)))
    if (Number.isNaN(n)) return
    setPadValue('')
    submit(n)
  }, [padValue, submit])

  // Gesture-driven auto-submit: hold the correct finger count to confirm.
  useEffect(() => {
    if (status !== 'playing' || !currentQuestion || lastAnswer) return
    if (detected < 0 || detected !== currentQuestion.answer) {
      confirmStartedAt.current = 0
      return
    }
    if (confirmStartedAt.current === 0) confirmStartedAt.current = performance.now()
    const held = performance.now() - confirmStartedAt.current
    if (held >= ANSWER_HOLD_MS) submit(detected)
  }, [detected, status, currentQuestion, lastAnswer, submit])

  // After each answer: play a sound and advance (unless the game ended).
  useEffect(() => {
    if (!lastAnswer) return
    if (status === 'lost') {
      audio.playLose()
      return
    }
    if (status === 'won') {
      audio.playWin()
      celebrate()
      return
    }
    if (lastAnswer.correct) {
      audio.playCorrect()
      burst()
      if (streak > 0 && streak % 5 === 0) celebrate() // streak milestone
    } else {
      audio.playWrong()
    }
    const delay = lastAnswer.correct ? 900 : 1500
    const timer = setTimeout(() => next(), delay)
    return () => clearTimeout(timer)
  }, [lastAnswer, status, audio, next, streak])

  // Level-up reward: confetti when the level increases.
  useEffect(() => {
    if (level > prevLevelRef.current) celebrate()
    prevLevelRef.current = level
  }, [level])

  const gameOver = status === 'lost' || status === 'won'

  // Op-aware question prompt (comparison/sequence have their own wording).
  const prompt =
    currentQuestion?.op === 'compare'
      ? t.play.promptBigger
      : currentQuestion?.op === 'seq'
        ? t.play.promptNext
        : t.play.prompt

  // ---- Idle / mode-picker screen ------------------------------------------
  if (status === 'idle') {
    const modeCards = {
      endless: { title: t.play.modeEndless, desc: t.play.modeEndlessDesc },
      timed: { title: t.play.modeTimed, desc: t.play.modeTimedDesc(TIMED_SECONDS) },
      missions: { title: t.play.modeMissions, desc: t.play.modeMissionsDesc(MISSION_GOAL) },
    } as const
    return (
      <div className="mx-auto max-w-xl text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card>
            <h1 className="font-display text-3xl font-extrabold text-primary">{t.play.idleTitle}</h1>
            <p className="mt-2 text-base-content/70">{t.play.idleBody(STARTING_LIVES)}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {MODES.map((m) => (
                <button
                  key={m.mode}
                  className="flex h-auto flex-col gap-1 rounded-2xl border border-base-300 bg-base-100 px-3 py-4 font-display transition hover:border-primary hover:shadow-md"
                  onClick={() => {
                    audio.playClick()
                    start(m.mode)
                  }}
                  aria-label={modeCards[m.mode].title}
                >
                  <span className="text-3xl">{m.icon}</span>
                  <span className="text-lg font-extrabold">{modeCards[m.mode].title}</span>
                  <span className="text-xs font-normal text-base-content/60">{modeCards[m.mode].desc}</span>
                </button>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    )
  }

  // ---- Active round --------------------------------------------------------
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <LevelBadge level={level} difficulty={difficulty} />
        <div className="flex flex-wrap items-center gap-2">
          {mode === 'missions' && (
            <span className="badge badge-lg badge-accent font-display">
              {t.play.goalProgress(score, MISSION_GOAL)}
            </span>
          )}
          {mode === 'timed' && (
            <Timer seconds={TIMED_SECONDS} running={status === 'playing'} onExpire={timeUp} />
          )}
          <ScoreBoard score={score} best={best} streak={streak} />
        </div>
      </div>

      <div className="flex items-center justify-center gap-1 text-2xl">
        {Array.from({ length: STARTING_LIVES }).map((_, i) => (
          <span key={i}>{i < lives ? '❤️' : '🤍'}</span>
        ))}
      </div>

      {currentQuestion && (
        <Card className="items-center text-center">
          <p className="font-display text-base-content/60">{prompt}</p>
          <div className="my-2 font-display text-7xl font-extrabold text-primary">{currentQuestion.text}</div>

          {lastAnswer ? (
            <motion.div
              className={`badge badge-lg font-display ${lastAnswer.correct ? 'badge-success' : 'badge-error'}`}
              initial={{ scale: 0.6, opacity: 0, x: 0 }}
              animate={
                lastAnswer.correct
                  ? { scale: 1, opacity: 1, x: 0 }
                  : { scale: 1, opacity: 1, x: [0, -8, 8, -6, 6, 0] }
              }
              transition={{ duration: 0.4 }}
            >
              {lastAnswer.correct
                ? t.play.correct(lastAnswer.expected)
                : t.play.wrong(lastAnswer.given, lastAnswer.expected)}
            </motion.div>
          ) : (
            <div className="badge badge-lg badge-ghost font-display">
              {detected < 0 ? t.play.waiting : t.play.showing(detected)}
            </div>
          )}
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <CameraView onNumberChange={setDetected} />

        {/* Fallback number entry for accessibility / no-camera testing */}
        <Card>
          <p className="font-display font-bold">{t.play.padTitle}</p>
          <form
            className="mt-3 flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              submitPad()
            }}
          >
            <input
              type="number"
              min={0}
              max={MAX_ANSWER}
              inputMode="numeric"
              value={padValue}
              disabled={!!lastAnswer}
              onChange={(e) => setPadValue(e.target.value)}
              className="input input-bordered w-24 font-display text-lg"
              placeholder={t.play.padPlaceholder}
              aria-label={t.play.padAria}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!!lastAnswer || padValue === ''}
              onClick={() => audio.playClick()}
            >
              {t.play.padSubmit}
            </Button>
          </form>
          <p className="mt-3 text-sm text-base-content/60">{t.play.padHelper}</p>
        </Card>
      </div>

      <Modal
        open={gameOver}
        onClose={reset}
        dismissable={false}
        title={status === 'won' ? t.play.modalWon : t.play.modalLost}
      >
        <div className="text-center">
          <p className="font-display text-2xl">
            {t.play.youScored} <span className="font-bold text-primary">{score}</span>
          </p>
          <p className="text-base-content/60">{t.play.bestLabel(best)}</p>
          <div className="mt-5 flex justify-center gap-3">
            <Button variant="primary" onClick={reset}>
              {t.play.playAgain}
            </Button>
            <Link to="/">
              <Button variant="ghost">{t.play.home}</Button>
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  )
}
