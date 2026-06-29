import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Howl } from 'howler'
import { useAppSettings } from '@/context/AppSettingsContext'

export type SoundName = 'correct' | 'wrong' | 'click' | 'win' | 'lose' | 'tick'

interface SoundSpec {
  src: string[]
  volume: number
}

const SOUND_LIBRARY: Record<SoundName, SoundSpec> = {
  // Files live in /public/audio. Add the matching .mp3 files to enable them.
  correct: { src: ['/audio/correct.mp3'], volume: 0.7 },
  wrong: { src: ['/audio/wrong.mp3'], volume: 0.7 },
  click: { src: ['/audio/click.mp3'], volume: 0.5 },
  win: { src: ['/audio/win.mp3'], volume: 0.8 },
  lose: { src: ['/audio/lose.mp3'], volume: 0.8 },
  tick: { src: ['/audio/tick.mp3'], volume: 0.4 },
}

/**
 * Thin Howler.js wrapper for game sound effects. Sounds are created lazily and
 * cached; calling `play` before the file has loaded (or if the file is missing)
 * is a safe no-op. Volume and mute come from AppSettingsContext.
 */
export function useAudio() {
  const { volume, muted } = useAppSettings()
  const sounds = useRef<Partial<Record<SoundName, Howl>>>({})

  const getSound = useCallback((name: SoundName): Howl | undefined => {
    if (sounds.current[name]) return sounds.current[name]
    const spec = SOUND_LIBRARY[name]
    const howl = new Howl({ src: spec.src, volume: spec.volume, preload: false })
    sounds.current[name] = howl
    // Try to load on first use; if the file is missing we simply stay silent.
    howl.load()
    return howl
  }, [])

  const play = useCallback(
    (name: SoundName) => {
      if (muted) return
      const sound = getSound(name)
      if (!sound || sound.state() === 'unloaded') return
      void sound.play()
    },
    [getSound, muted],
  )

  // Keep global Howler volume in sync with settings.
  useEffect(() => {
    Howler.volume(muted ? 0 : volume)
  }, [volume, muted])

  // Release audio resources on unmount.
  useEffect(() => {
    return () => {
      Object.values(sounds.current).forEach((h) => h?.unload())
      sounds.current = {}
    }
  }, [])

  return useMemo(
    () => ({
      play,
      playCorrect: () => play('correct'),
      playWrong: () => play('wrong'),
      playClick: () => play('click'),
      playWin: () => play('win'),
      playLose: () => play('lose'),
    }),
    [play],
  )
}
