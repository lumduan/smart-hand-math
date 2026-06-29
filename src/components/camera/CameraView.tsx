import { useCallback, useEffect, useRef } from 'react'
import { useHandTracker } from '@/hooks/useHandTracker'
import { useAudio } from '@/hooks/useAudio'
import { useAppSettings } from '@/context/AppSettingsContext'
import { useStrings } from '@/i18n/useStrings'
import { handsToNumber, type TrackedHand } from '@/utils/fingerMathLogic'

/** MediaPipe hand skeleton edges, used to draw the landmark overlay. */
const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], // thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // index
  [5, 9], [9, 10], [10, 11], [11, 12], // middle
  [9, 13], [13, 14], [14, 15], [15, 16], // ring
  [13, 17], [17, 18], [18, 19], [19, 20], // pinky
  [0, 17], // palm base
]

const FINGER_TIPS = new Set([4, 8, 12, 16, 20])

/** Rolling-window size for per-frame denoise (jitter from trembling hands). */
const DENOISE_FRAMES = 6

interface CameraViewProps {
  /**
   * Denoised finger number (0..99 via Soroban place value), or -1 when no hand
   * is visible. NOTE: this is the *live* smoothed number; the answer "commit
   * hold" (must stay constant ~500ms) is enforced by the consumer (Play page).
   */
  onNumberChange?: (count: number) => void
  numHands?: number
  className?: string
}

/**
 * Webcam + MediaPipe canvas wrapper. Runs the hand tracker, draws the skeleton
 * overlay, denoises the per-frame reading, and reports a stabilized number via
 * `onNumberChange`.
 */
export function CameraView({ onNumberChange, numHands = 2, className = '' }: CameraViewProps) {
  const { mirrored, setCameraPermission } = useAppSettings()
  const audio = useAudio()
  const t = useStrings()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const recentValues = useRef<number[]>([])

  const draw = useCallback((hands: TrackedHand[]) => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return
    if (video.videoWidth && canvas.width !== video.videoWidth) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!hands.length) return

    ctx.lineWidth = Math.max(2, canvas.width * 0.008)
    ctx.strokeStyle = '#65c3c8'
    ctx.fillStyle = '#eeaf3a'

    for (const hand of hands) {
      const lm = hand.landmarks
      for (const [a, b] of HAND_CONNECTIONS) {
        ctx.beginPath()
        ctx.moveTo(lm[a].x * canvas.width, lm[a].y * canvas.height)
        ctx.lineTo(lm[b].x * canvas.width, lm[b].y * canvas.height)
        ctx.stroke()
      }
      for (let i = 0; i < lm.length; i++) {
        const r = FINGER_TIPS.has(i) ? canvas.width * 0.012 : canvas.width * 0.007
        ctx.beginPath()
        ctx.arc(lm[i].x * canvas.width, lm[i].y * canvas.height, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }, [])

  const handleLandmarks = useCallback(
    (hands: TrackedHand[]) => {
      draw(hands)

      // Raw Soroban number for this frame; -1 = no hand visible (so a true 0
      // stays distinguishable from "no input").
      const raw = hands.length ? handsToNumber(hands) : -1

      // Denoise by reporting the most frequent value in the rolling window.
      const buffer = recentValues.current
      buffer.push(raw)
      if (buffer.length > DENOISE_FRAMES) buffer.shift()

      const tally = new Map<number, number>()
      for (const value of buffer) tally.set(value, (tally.get(value) ?? 0) + 1)
      let bestValue = raw
      let bestCount = -1
      for (const [value, count] of tally) {
        if (count > bestCount) {
          bestValue = value
          bestCount = count
        }
      }
      onNumberChange?.(bestValue)
    },
    [draw, onNumberChange],
  )

  const { status, error, start, stop } = useHandTracker({
    videoRef,
    onLandmarks: handleLandmarks,
    numHands,
  })

  // Reflect tracker status into the global camera-permission state.
  useEffect(() => {
    if (status === 'ready') setCameraPermission('granted')
    else if (status === 'error') setCameraPermission('denied')
  }, [status, setCameraPermission])

  const isLive = status === 'ready' || status === 'loading'

  return (
    <div className={`relative w-full overflow-hidden rounded-3xl bg-black aspect-video ${className}`}>
      {/* Mirrored wrapper: video + skeleton overlay flip together */}
      <div className="absolute inset-0" style={{ transform: mirrored ? 'scaleX(-1)' : 'none' }}>
        <video ref={videoRef} className="h-full w-full object-cover" playsInline muted autoPlay />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />
      </div>

      {/* HUD (never mirrored) */}
      <div className="absolute inset-0 flex flex-col items-center justify-between p-3 pointer-events-none">
        <div className="flex w-full items-center justify-between">
          {status === 'idle' && <span className="badge badge-ghost font-display">{t.camera.off}</span>}
          {status === 'loading' && (
            <span className="badge badge-warning font-display animate-pulse">{t.camera.loading}</span>
          )}
          {status === 'ready' && <span className="badge badge-success font-display">{t.camera.ready}</span>}
          {status === 'error' && <span className="badge badge-error font-display">{t.camera.blocked}</span>}
        </div>

        <div className="pointer-events-auto">
          {!isLive ? (
            <button
              className="btn btn-primary btn-circle shadow-lg"
              onClick={() => {
                audio.playClick()
                void start()
              }}
              aria-label={t.camera.startAria}
            >
              ▶️
            </button>
          ) : (
            <button
              className="btn btn-ghost btn-circle bg-black/40 text-white shadow-lg"
              onClick={() => {
                audio.playClick()
                stop()
              }}
              aria-label={t.camera.stopAria}
            >
              ⏹️
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="absolute bottom-2 left-2 right-2 rounded-xl bg-error/90 p-3 text-center text-sm text-white">
          <p className="font-display font-bold">{t.camera.errorTitle}</p>
          <p className="mt-1">{t.camera.errorBody(error)}</p>
        </div>
      )}
    </div>
  )
}
