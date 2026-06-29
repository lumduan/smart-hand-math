import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import type { Landmark, RawHandedness, TrackedHand } from '@/utils/fingerMathLogic'

export type TrackerStatus = 'idle' | 'loading' | 'ready' | 'error'

interface UseHandTrackerOptions {
  videoRef: RefObject<HTMLVideoElement>
  /** Called with the detected hands (landmarks + handedness) every fresh frame. */
  onLandmarks?: (hands: TrackedHand[]) => void
  /** Maximum hands to track (1 or 2). */
  numHands?: number
  /** Prefer GPU acceleration, fall back to CPU if it fails. */
  delegate?: 'GPU' | 'CPU'
}

interface UseHandTrackerResult {
  status: TrackerStatus
  error: string | null
  start: () => Promise<void>
  stop: () => void
}

const MODEL_URL =
  import.meta.env.VITE_MEDIAPIPE_MODEL_URL ??
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
const WASM_URL =
  import.meta.env.VITE_MEDIAPIPE_WASM_URL ??
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'

async function createLandmarker(numHands: number, delegate: 'GPU' | 'CPU'): Promise<HandLandmarker> {
  const fileset = await FilesetResolver.forVisionTasks(WASM_URL)
  try {
    return await HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: 'VIDEO',
      numHands,
    })
  } catch {
    // GPU init can fail in some browsers/contexts — retry on the CPU.
    return HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
      runningMode: 'VIDEO',
      numHands,
    })
  }
}

/**
 * Core hand-tracking hook. Owns the camera stream + MediaPipe HandLandmarker
 * lifecycle and runs a requestAnimationFrame detection loop, reporting
 * landmarks via `onLandmarks`.
 */
export function useHandTracker({
  videoRef,
  onLandmarks,
  numHands = 2,
  delegate = 'GPU',
}: UseHandTrackerOptions): UseHandTrackerResult {
  const [status, setStatus] = useState<TrackerStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const landmarkerRef = useRef<HandLandmarker | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const lastVideoTimeRef = useRef<number>(-1)
  const lastTsRef = useRef<number>(-1)

  // Keep the latest callback without restarting the rAF loop.
  const onLandmarksRef = useRef(onLandmarks)
  useEffect(() => {
    onLandmarksRef.current = onLandmarks
  }, [onLandmarks])

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = 0

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    landmarkerRef.current?.close()
    landmarkerRef.current = null

    lastVideoTimeRef.current = -1
    lastTsRef.current = -1
    setStatus('idle')
  }, [videoRef])

  const start = useCallback(async () => {
    if (status === 'loading' || status === 'ready') return
    setStatus('loading')
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      streamRef.current = stream

      const video = videoRef.current
      if (!video) throw new Error('Video element is not mounted.')
      video.srcObject = stream
      await video.play().catch(() => {
        /* autoplay can reject if not user-gesture initiated; ignore */
      })

      landmarkerRef.current = await createLandmarker(numHands, delegate)

      const loop = () => {
        const lm = landmarkerRef.current
        const vid = videoRef.current
        if (!lm || !vid || vid.readyState < 2) {
          rafRef.current = requestAnimationFrame(loop)
          return
        }
        // Only run detection on a fresh frame.
        if (vid.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = vid.currentTime
          const ts = performance.now()
          if (ts > lastTsRef.current) {
            lastTsRef.current = ts
            const result = lm.detectForVideo(vid, ts)
            // Pair each hand's landmarks with its (raw) handedness label so the
            // Soroban logic can assign TENS (left) / UNITS (right) roles.
            const hands: TrackedHand[] = result.landmarks.map((landmarks, i) => {
              const top = result.handedness[i]?.[0]
              const handedness: RawHandedness = top?.categoryName === 'Left' ? 'Left' : 'Right'
              return {
                landmarks: landmarks as Landmark[],
                handedness,
                score: top?.score,
              }
            })
            onLandmarksRef.current?.(hands)
          }
        }
        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
      setStatus('ready')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start hand tracking.'
      setError(message)
      setStatus('error')
      stop()
    }
  }, [status, videoRef, numHands, delegate, stop])

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((track) => track.stop())
      landmarkerRef.current?.close()
    }
  }, [])

  return { status, error, start, stop }
}
