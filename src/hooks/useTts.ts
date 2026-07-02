import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAppSettings } from '@/context/AppSettingsContext'

/** Per-utterance overrides. */
export interface SpeakOptions {
  /** Speaking rate (default DEFAULT_RATE — deliberately slow for young ears). */
  rate?: number
  /** Voice pitch (default DEFAULT_PITCH — slightly bright/friendly). */
  pitch?: number
  /** Fires once when the utterance finishes naturally (never on cancel/error). */
  onEnd?: () => void
}

export interface Tts {
  /** Speak `text`; cancels any in-flight utterance first. No-op if muted/unsupported. */
  speak: (text: string, opts?: SpeakOptions) => void
  /** Stop all speech now and detach pending callbacks. */
  cancel: () => void
  /** True while an utterance is playing. */
  speaking: boolean
  /** Whether this browser can synthesize speech at all. */
  supported: boolean
  /** Whether at least one voice is available yet (false → speak() won't produce audio). */
  hasVoices: boolean
}

// Kid-tuned defaults: slower and a touch brighter than the browser default.
const DEFAULT_RATE = 0.9
const DEFAULT_PITCH = 1.05
// Chrome silently pauses utterances longer than ~15 s; nudging `resume()` on an
// interval keeps long narration playing. Lesson prompts are short, but this is
// cheap insurance and costs nothing when speech has already ended.
const RESUME_INTERVAL_MS = 10_000

function detectSupport(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance === 'function'
  )
}

/** The live SpeechSynthesis, or null if unavailable — read at call time so a
 * teardown after the API disappears (e.g. tests unstubbing globals) never throws. */
function getSynth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null
}

/**
 * Kid-friendly text-to-speech over the browser's SpeechSynthesis API (Phase 8.3
 * lessons). 100% client-side — an OS service, no app egress (ADR-0001). Where
 * SpeechSynthesis is missing (jsdom, older browsers) `supported` is false and
 * every method is a safe no-op, so callers degrade to text + timers. Honors the
 * global mute/volume from AppSettingsContext: muting cancels any in-flight speech.
 */
export function useTts(): Tts {
  const { volume, muted } = useAppSettings()
  const [supported] = useState(detectSupport)
  const [speaking, setSpeaking] = useState(false)
  const [hasVoices, setHasVoices] = useState(false)

  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const resumeTimerRef = useRef<number | null>(null)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)
  const mountedRef = useRef(true)
  // Refs let the stable `speak`/`cancel` callbacks read the latest prefs without
  // being re-created on every volume/mute change.
  const volumeRef = useRef(volume)
  const mutedRef = useRef(muted)
  volumeRef.current = volume
  mutedRef.current = muted

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current !== null) {
      window.clearInterval(resumeTimerRef.current)
      resumeTimerRef.current = null
    }
  }, [])

  // Detach the current utterance's callbacks so a late `onend`/`onerror` (e.g.
  // fired by cancel()) can never call back into an unmounted/superseded consumer.
  const detachCurrent = useCallback(() => {
    const u = utterRef.current
    if (u) {
      u.onend = null
      u.onerror = null
    }
    utterRef.current = null
  }, [])

  const cancel = useCallback(() => {
    clearResumeTimer()
    detachCurrent()
    if (mountedRef.current) setSpeaking(false)
    getSynth()?.cancel()
  }, [clearResumeTimer, detachCurrent])

  // Pick an English, on-device voice once the list is populated (getVoices() is
  // frequently empty until the async 'voiceschanged' event fires).
  useEffect(() => {
    const synth = getSynth()
    if (!supported || !synth) return
    const pick = () => {
      const voices = synth.getVoices()
      if (!voices.length) return
      const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en'))
      voiceRef.current =
        english.find((v) => v.localService) ??
        english[0] ??
        voices.find((v) => v.localService) ??
        voices[0] ??
        null
      setHasVoices(true)
    }
    pick()
    synth.addEventListener('voiceschanged', pick)
    return () => synth.removeEventListener('voiceschanged', pick)
  }, [supported])

  const speak = useCallback(
    (text: string, opts?: SpeakOptions) => {
      const synth = getSynth()
      if (!supported || mutedRef.current || !text || !synth) return
      detachCurrent()
      synth.cancel() // never overlap; also flushes any queued utterance
      clearResumeTimer()

      const utter = new window.SpeechSynthesisUtterance(text)
      utter.rate = opts?.rate ?? DEFAULT_RATE
      utter.pitch = opts?.pitch ?? DEFAULT_PITCH
      utter.volume = Math.min(1, Math.max(0, volumeRef.current))
      utter.lang = 'en-US'
      if (voiceRef.current) utter.voice = voiceRef.current

      utter.onend = () => {
        clearResumeTimer()
        utterRef.current = null
        if (mountedRef.current) setSpeaking(false)
        opts?.onEnd?.()
      }
      utter.onerror = () => {
        clearResumeTimer()
        utterRef.current = null
        if (mountedRef.current) setSpeaking(false)
        opts?.onEnd?.() // release any gate (e.g. WatchView's Next) on a real speech error
      }

      utterRef.current = utter
      if (mountedRef.current) setSpeaking(true)
      synth.speak(utter)

      resumeTimerRef.current = window.setInterval(() => {
        if (synth.speaking) synth.resume()
        else clearResumeTimer()
      }, RESUME_INTERVAL_MS)
    },
    [supported, clearResumeTimer, detachCurrent],
  )

  // Silence in-flight speech the instant the app is muted.
  useEffect(() => {
    if (muted) cancel()
  }, [muted, cancel])

  // Stop speech + timers on unmount (guard state via mountedRef).
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (resumeTimerRef.current !== null) window.clearInterval(resumeTimerRef.current)
      const u = utterRef.current
      if (u) {
        u.onend = null
        u.onerror = null
      }
      utterRef.current = null
      getSynth()?.cancel()
    }
  }, [])

  return useMemo(
    () => ({ speak, cancel, speaking, supported, hasVoices }),
    [speak, cancel, speaking, supported, hasVoices],
  )
}
