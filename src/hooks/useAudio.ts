import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useAppSettings } from '@/context/AppSettingsContext'

export type SoundName =
  | 'correct'
  | 'wrong'
  | 'click'
  | 'win'
  | 'lose'
  | 'tick'
  | 'stepComplete'
  | 'tryAgain'
  | 'lessonComplete'

/**
 * Synthesized game sound effects via the Web Audio API — no audio files, no
 * licensing, works offline (see ADR-0007). Each sound is a short programmed
 * tone/chord. Volume + mute come from AppSettingsContext.
 *
 * The AudioContext is created lazily on first play (which happens after a user
 * gesture, satisfying browser autoplay policies) and the whole hook no-ops when
 * AudioContext is unavailable (SSR / jsdom / test).
 */
export function useAudio() {
  const { volume, muted } = useAppSettings()
  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)

  // Lazily create (or reuse) the AudioContext + master gain. Null in envs
  // without Web Audio.
  const getCtx = useCallback((): AudioContext | null => {
    if (ctxRef.current) return ctxRef.current
    const Ctor =
      typeof window !== 'undefined'
        ? window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        : undefined
    if (!Ctor) return null
    const ctx = new Ctor()
    const master = ctx.createGain()
    master.gain.value = muted ? 0 : volume
    master.connect(ctx.destination)
    ctxRef.current = ctx
    masterRef.current = master
    return ctx
  }, [muted, volume])

  // Keep the master gain in sync with volume/mute.
  useEffect(() => {
    const master = masterRef.current
    const ctx = ctxRef.current
    if (!master || !ctx) return
    master.gain.setValueAtTime(muted ? 0 : volume, ctx.currentTime)
  }, [volume, muted])

  // Close the context on unmount.
  useEffect(() => {
    return () => {
      ctxRef.current?.close().catch(() => {})
      ctxRef.current = null
      masterRef.current = null
    }
  }, [])

  // One enveloped oscillator note. Quick attack + exponential release = pleasant
  // and click-free.
  const tone = useCallback(
    (
      ctx: AudioContext,
      master: GainNode,
      opts: { freq: number; type?: OscillatorType; start?: number; duration?: number; gain?: number },
    ) => {
      const { freq, type = 'sine', start = 0, duration = 0.15, gain = 0.5 } = opts
      const t0 = ctx.currentTime + start
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, t0)
      g.gain.setValueAtTime(0.0001, t0)
      g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
      osc.connect(g)
      g.connect(master)
      osc.start(t0)
      osc.stop(t0 + duration + 0.02)
    },
    [],
  )

  const play = useCallback(
    (name: SoundName) => {
      if (muted) return
      const ctx = getCtx()
      if (!ctx) return
      const master = masterRef.current
      if (!master) return
      // Resume if suspended (e.g. before the first gesture, or after backgrounding).
      if (ctx.state === 'suspended') void ctx.resume()

      switch (name) {
        case 'correct': // bright ascending C5-E5-G5 arpeggio
          tone(ctx, master, { freq: 523.25, gain: 0.4, duration: 0.12, start: 0 })
          tone(ctx, master, { freq: 659.25, gain: 0.4, duration: 0.12, start: 0.1 })
          tone(ctx, master, { freq: 783.99, gain: 0.45, duration: 0.18, start: 0.2 })
          break
        case 'wrong': // descending G4-Eb4 (triangle, slightly longer)
          tone(ctx, master, { freq: 392.0, type: 'triangle', gain: 0.4, duration: 0.16, start: 0 })
          tone(ctx, master, { freq: 311.13, type: 'triangle', gain: 0.4, duration: 0.22, start: 0.14 })
          break
        case 'click': // short soft blip
          tone(ctx, master, { freq: 660, gain: 0.22, duration: 0.06 })
          break
        case 'tick': // short high blip
          tone(ctx, master, { freq: 880, type: 'square', gain: 0.16, duration: 0.04 })
          break
        case 'win': // ascending fanfare C5-E5-G5-C6
          tone(ctx, master, { freq: 523.25, gain: 0.4, duration: 0.12, start: 0 })
          tone(ctx, master, { freq: 659.25, gain: 0.4, duration: 0.12, start: 0.12 })
          tone(ctx, master, { freq: 783.99, gain: 0.45, duration: 0.12, start: 0.24 })
          tone(ctx, master, { freq: 1046.5, gain: 0.5, duration: 0.3, start: 0.36 })
          break
        case 'lose': // descending A4-F4-C4
          tone(ctx, master, { freq: 440.0, type: 'triangle', gain: 0.4, duration: 0.18, start: 0 })
          tone(ctx, master, { freq: 349.23, type: 'triangle', gain: 0.4, duration: 0.22, start: 0.16 })
          tone(ctx, master, { freq: 261.63, type: 'triangle', gain: 0.45, duration: 0.4, start: 0.36 })
          break
        case 'stepComplete': // gentle C5→E5 rise as a teaching step advances
          tone(ctx, master, { freq: 523.25, gain: 0.34, duration: 0.12, start: 0 })
          tone(ctx, master, { freq: 659.25, gain: 0.38, duration: 0.16, start: 0.1 })
          break
        case 'tryAgain': // soft, non-punitive nudge — gentler than `wrong`
          tone(ctx, master, { freq: 392.0, type: 'triangle', gain: 0.3, duration: 0.18, start: 0 })
          break
        case 'lessonComplete': // celebratory C5-E5-G5-C6-E6 fanfare (paired with finale())
          tone(ctx, master, { freq: 523.25, gain: 0.4, duration: 0.12, start: 0 })
          tone(ctx, master, { freq: 659.25, gain: 0.4, duration: 0.12, start: 0.12 })
          tone(ctx, master, { freq: 783.99, gain: 0.42, duration: 0.12, start: 0.24 })
          tone(ctx, master, { freq: 1046.5, gain: 0.46, duration: 0.14, start: 0.36 })
          tone(ctx, master, { freq: 1318.51, gain: 0.5, duration: 0.34, start: 0.5 })
          break
      }
    },
    [getCtx, muted, tone],
  )

  return useMemo(
    () => ({
      play,
      playCorrect: () => play('correct'),
      playWrong: () => play('wrong'),
      playClick: () => play('click'),
      playWin: () => play('win'),
      playLose: () => play('lose'),
      playTick: () => play('tick'),
      playStepComplete: () => play('stepComplete'),
      playTryAgain: () => play('tryAgain'),
      playLessonComplete: () => play('lessonComplete'),
    }),
    [play],
  )
}
