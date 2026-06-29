import { useEffect, useRef, useState } from 'react'
import { useAudio } from '@/hooks/useAudio'
import { useStrings } from '@/i18n/useStrings'

interface TimerProps {
  /** Countdown duration in seconds. Restart by changing the `key` of the component. */
  seconds: number
  running?: boolean
  onExpire?: () => void
}

/** Simple countdown timer display. */
export function Timer({ seconds, running = true, onExpire }: TimerProps) {
  const [remaining, setRemaining] = useState(seconds)
  const onExpireRef = useRef(onExpire)
  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  const audio = useAudio()
  const t = useStrings()
  // Tick during the final, urgent seconds.
  useEffect(() => {
    if (running && remaining > 0 && remaining <= 5) audio.playTick()
  }, [remaining, running, audio])

  useEffect(() => {
    setRemaining(seconds)
    if (!running) return
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          onExpireRef.current?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [seconds, running])

  const urgent = remaining <= 5
  return (
    <div
      className={`badge badge-lg font-display tabular-nums ${urgent ? 'badge-error animate-pulse' : 'badge-ghost'}`}
    >
      {t.game.timer(remaining)}
    </div>
  )
}
