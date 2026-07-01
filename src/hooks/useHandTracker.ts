import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import type { HandLandmarker } from '@mediapipe/tasks-vision'
import type { Landmark, RawHandedness, TrackedHand } from '@/utils/fingerMathLogic'

export type TrackerStatus = 'idle' | 'loading' | 'ready' | 'error'

interface UseHandTrackerOptions {
  videoRef: RefObject<HTMLVideoElement | null>
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

// Self-hosted by default (Phase 6): no CDN egress, works offline. Override via env.
const MODEL_URL = import.meta.env.VITE_MEDIAPIPE_MODEL_URL ?? '/models/hand_landmarker.task'
const WASM_URL = import.meta.env.VITE_MEDIAPIPE_WASM_URL ?? '/models/wasm'

async function createLandmarker(numHands: number, delegate: 'GPU' | 'CPU'): Promise<HandLandmarker> {
  // Dynamic import: keeps @mediapipe/tasks-vision in its own lazy chunk, fetched
  // only when the camera actually starts (not on initial page load).
  const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision')
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

// Cache one HandLandmarker per `numHands` for the whole session. MediaPipe's
// WASM/GPU init is expensive and — critically — repeatedly creating and
// `.close()`-ing landmarkers (which happens when the lessons camera mounts and
// unmounts between steps) can wedge the runtime, showing a blank feed until a
// full page reload. Creating each landmarker once and reusing it across mounts
// avoids that. At most two instances ever exist (numHands 1 and 2).
const landmarkerCache = new Map<number, HandLandmarker>()
const landmarkerLoading = new Map<number, Promise<HandLandmarker>>()

function acquireLandmarker(numHands: number, delegate: 'GPU' | 'CPU'): Promise<HandLandmarker> {
  const cached = landmarkerCache.get(numHands)
  if (cached) return Promise.resolve(cached)
  let loading = landmarkerLoading.get(numHands)
  if (!loading) {
    loading = createLandmarker(numHands, delegate)
      .then((lm) => {
        landmarkerCache.set(numHands, lm)
        return lm
      })
      .finally(() => landmarkerLoading.delete(numHands))
    landmarkerLoading.set(numHands, loading)
  }
  return loading
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
  const unmountedRef = useRef(false)
  const startingRef = useRef(false)

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
    // Detach only — the landmarker is a cached singleton reused across mounts.
    landmarkerRef.current = null

    lastVideoTimeRef.current = -1
    lastTsRef.current = -1
    setStatus('idle')
  }, [videoRef])

  const start = useCallback(async () => {
    // startingRef is a synchronous guard: auto-start fires start() programmatically
    // and StrictMode double-invokes the effect, so two calls can race past a
    // `status`-based check before the 'loading' state commits.
    if (startingRef.current || status === 'ready') return
    startingRef.current = true
    setStatus('loading')
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      // If we unmounted while getUserMedia was resolving, release the camera and
      // bail — otherwise the stream leaks and the device stays busy (blank feed
      // until a reload) because the unmount cleanup already ran.
      if (unmountedRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      streamRef.current = stream

      const video = videoRef.current
      if (!video) throw new Error('Video element is not mounted.')
      video.srcObject = stream
      await video.play().catch(() => {
        /* autoplay can reject if not user-gesture initiated; ignore */
      })

      const landmarker = await acquireLandmarker(numHands, delegate)
      if (unmountedRef.current) return
      landmarkerRef.current = landmarker

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
    } finally {
      startingRef.current = false
    }
  }, [status, videoRef, numHands, delegate, stop])

  // Stop the camera + loop on unmount, but keep the cached landmarker alive (it is
  // reused across mounts). Reset `unmountedRef` on (re)mount so React StrictMode's
  // dev mount→unmount→remount cycle doesn't leave it stuck `true` — which would make
  // start() bail after getUserMedia and hang on "loading".
  useEffect(() => {
    unmountedRef.current = false
    return () => {
      unmountedRef.current = true
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return { status, error, start, stop }
}
