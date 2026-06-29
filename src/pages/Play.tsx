import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CameraView } from '@/components/camera/CameraView'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { Modal } from '@/components/common/Modal'
import { LevelBadge } from '@/components/game/LevelBadge'
import { ScoreBoard } from '@/components/game/ScoreBoard'
import { useGame } from '@/context/GameContext'
import { useAudio } from '@/hooks/useAudio'

const STARTING_LIVES = 3
/** Anti-tremor gate: the answer must be held steady this long before it commits. */
const ANSWER_HOLD_MS = 500
/** Largest answer the player can show with two Soroban hands. */
const MAX_ANSWER = 99

export function Play() {
  const {
    status,
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
    reset,
  } = useGame()
  const audio = useAudio()
  const [detected, setDetected] = useState<number>(-1)
  const [padValue, setPadValue] = useState('')

  // Confirmation window + per-question lock to avoid double submissions.
  const confirmStartedAt = useRef(0)
  const submittedFor = useRef<string | null>(null)

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
    if (lastAnswer.correct) audio.playCorrect()
    else audio.playWrong()
    if (status === 'lost') return
    const delay = lastAnswer.correct ? 900 : 1500
    const t = setTimeout(() => next(), delay)
    return () => clearTimeout(t)
  }, [lastAnswer, status, audio, next])

  const gameOver = status === 'lost' || status === 'won'

  // ---- Idle / start screen -------------------------------------------------
  if (status === 'idle') {
    return (
      <div className="mx-auto max-w-xl text-center">
        <Card>
          <h1 className="font-display text-3xl font-extrabold text-brand-primary">Ready to play?</h1>
          <p className="mt-2 text-base-content/70">
            Answer each question by holding up the right number of fingers. You have{' '}
            {STARTING_LIVES} lives — how high can you score?
          </p>
          <div className="mt-6 flex justify-center">
            <Button size="lg" variant="primary" onClick={start}>
              ▶️ Start game
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // ---- Active round --------------------------------------------------------
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <LevelBadge level={level} difficulty={difficulty} />
        <ScoreBoard score={score} best={best} streak={streak} />
      </div>

      <div className="flex items-center justify-center gap-1 text-2xl">
        {Array.from({ length: STARTING_LIVES }).map((_, i) => (
          <span key={i}>{i < lives ? '❤️' : '🤍'}</span>
        ))}
      </div>

      {currentQuestion && (
        <Card className="items-center text-center">
          <p className="font-display text-base-content/60">Show the answer with your fingers</p>
          <div className="my-2 font-display text-7xl font-extrabold text-brand-primary">
            {currentQuestion.text} = ?
          </div>

          {lastAnswer ? (
            <div
              className={`badge badge-lg font-display ${lastAnswer.correct ? 'badge-success' : 'badge-error'} animate-pop`}
            >
              {lastAnswer.correct
                ? `✅ Correct! It's ${lastAnswer.expected}`
                : `❌ Oops, you showed ${lastAnswer.given}. It's ${lastAnswer.expected}`}
            </div>
          ) : (
            <div className="badge badge-lg badge-ghost font-display">
              {detected < 0 ? '✋ Waiting for your hand…' : `You're showing ${detected}`}
            </div>
          )}
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <CameraView onNumberChange={setDetected} />

        {/* Fallback number entry for accessibility / no-camera testing */}
        <Card>
          <p className="font-display font-bold">No camera? Type your answer (0–99):</p>
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
              placeholder="?"
              aria-label="Type your answer"
            />
            <Button type="submit" variant="primary" disabled={!!lastAnswer || padValue === ''}>
              Submit
            </Button>
          </form>
          <p className="mt-3 text-sm text-base-content/60">
            With the camera, hold the right finger value in view for ~½ second to auto-answer.
            Left hand = tens, right hand = ones (e.g. 3 on the left + 7 on the right = 37).
          </p>
        </Card>
      </div>

      <Modal open={gameOver} onClose={reset} dismissable={false} title={status === 'won' ? '🎉 You won!' : '💀 Game over'}>
        <div className="text-center">
          <p className="font-display text-2xl">
            You scored <span className="font-bold text-brand-primary">{score}</span>
          </p>
          <p className="text-base-content/60">Best: {best}</p>
          <div className="mt-5 flex justify-center gap-3">
            <Button variant="primary" onClick={start}>🔁 Play again</Button>
            <Link to="/">
              <Button variant="ghost">🏠 Home</Button>
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  )
}
