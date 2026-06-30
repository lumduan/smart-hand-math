import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toLocale, type Locale } from '@/i18n/strings'

export type CameraPermission = 'prompt' | 'granted' | 'denied'

/** Camera preview size preference (Phase 8.1). */
export type CameraScale = 'sm' | 'md' | 'lg'

/** All camera-size options in cycle order (sm → md → lg → sm). */
export const CAMERA_SIZES = ['sm', 'md', 'lg'] as const

function toCameraScale(value: unknown): CameraScale {
  return CAMERA_SIZES.includes(value as CameraScale) ? (value as CameraScale) : 'md'
}

/** AutoSubmit timing bounds (Phase 8.2) — keep timings sane + testable. */
const MS_MIN = 200
const MS_MAX = 5000

function toAutoSubmitEnabled(value: unknown): boolean {
  return typeof value === 'boolean' ? value : true
}

/** Clamp a millisecond tuning value into [MS_MIN, MS_MAX]; fall back if invalid. */
function clampMs(value: unknown, fallback: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return Math.min(MS_MAX, Math.max(MS_MIN, Math.round(n)))
}

interface AppSettings {
  cameraPermission: CameraPermission
  volume: number // 0..1
  muted: boolean
  mirrored: boolean // selfie view (default true)
  onboardingDismissed: boolean // first-visit "how it works" banner
  locale: Locale // active UI language
  cameraScale: CameraScale // preview size (sm/md/lg) — Phase 8.1
  autoSubmitEnabled: boolean // gesture auto-submit on/off (Phase 8.2)
  autoSubmitPromptMs: number // T1: hold before the prompt appears
  autoSubmitConfirmMs: number // T2: hold after the prompt before commit
  setCameraPermission: (p: CameraPermission) => void
  setVolume: (v: number) => void
  toggleMuted: () => void
  toggleMirrored: () => void
  dismissOnboarding: () => void
  setLocale: (locale: Locale) => void
  setCameraScale: (s: CameraScale) => void
  setAutoSubmitEnabled: (b: boolean) => void
  setAutoSubmitPromptMs: (ms: number) => void
  setAutoSubmitConfirmMs: (ms: number) => void
}

const STORAGE_KEY = 'smartmath.settings'

interface PersistedSettings {
  volume: number
  muted: boolean
  mirrored: boolean
  onboardingDismissed: boolean
  locale: Locale
  cameraScale: CameraScale
  autoSubmitEnabled: boolean
  autoSubmitPromptMs: number
  autoSubmitConfirmMs: number
}

const AppSettingsContext = createContext<AppSettings | null>(null)

function loadPersisted(): PersistedSettings {
  const fallback: PersistedSettings = {
    volume: Number(import.meta.env.VITE_DEFAULT_VOLUME ?? 0.6),
    muted: false,
    mirrored: true,
    onboardingDismissed: false,
    locale: 'en',
    cameraScale: 'md',
    autoSubmitEnabled: true,
    autoSubmitPromptMs: 1500,
    autoSubmitConfirmMs: 1000,
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<PersistedSettings>
    return {
      ...fallback,
      ...parsed,
      locale: toLocale(parsed.locale),
      cameraScale: toCameraScale(parsed.cameraScale),
      autoSubmitEnabled: toAutoSubmitEnabled(parsed.autoSubmitEnabled),
      autoSubmitPromptMs: clampMs(parsed.autoSubmitPromptMs, 1500),
      autoSubmitConfirmMs: clampMs(parsed.autoSubmitConfirmMs, 1000),
    }
  } catch {
    return fallback
  }
}

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [persisted, setPersisted] = useState<PersistedSettings>(loadPersisted)
  const [cameraPermission, setCameraPermission] = useState<CameraPermission>('prompt')

  // Persist the audio/mirror/onboarding/locale/camera/auto-submit prefs on change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
    } catch {
      /* storage may be unavailable (private mode) — ignore */
    }
  }, [persisted])

  const setVolume = useCallback((v: number) => {
    setPersisted((prev) => ({ ...prev, volume: Math.min(1, Math.max(0, v)) }))
  }, [])

  const toggleMuted = useCallback(() => {
    setPersisted((prev) => ({ ...prev, muted: !prev.muted }))
  }, [])

  const toggleMirrored = useCallback(() => {
    setPersisted((prev) => ({ ...prev, mirrored: !prev.mirrored }))
  }, [])

  const dismissOnboarding = useCallback(() => {
    setPersisted((prev) => ({ ...prev, onboardingDismissed: true }))
  }, [])

  const setLocale = useCallback((locale: Locale) => {
    setPersisted((prev) => ({ ...prev, locale }))
  }, [])

  const setCameraScale = useCallback((scale: CameraScale) => {
    setPersisted((prev) => ({ ...prev, cameraScale: scale }))
  }, [])

  const setAutoSubmitEnabled = useCallback((b: boolean) => {
    setPersisted((prev) => ({ ...prev, autoSubmitEnabled: b }))
  }, [])

  const setAutoSubmitPromptMs = useCallback((ms: number) => {
    setPersisted((prev) => ({ ...prev, autoSubmitPromptMs: clampMs(ms, 1500) }))
  }, [])

  const setAutoSubmitConfirmMs = useCallback((ms: number) => {
    setPersisted((prev) => ({ ...prev, autoSubmitConfirmMs: clampMs(ms, 1000) }))
  }, [])

  const value = useMemo<AppSettings>(
    () => ({
      cameraPermission,
      volume: persisted.volume,
      muted: persisted.muted,
      mirrored: persisted.mirrored,
      onboardingDismissed: persisted.onboardingDismissed,
      locale: persisted.locale,
      cameraScale: persisted.cameraScale,
      autoSubmitEnabled: persisted.autoSubmitEnabled,
      autoSubmitPromptMs: persisted.autoSubmitPromptMs,
      autoSubmitConfirmMs: persisted.autoSubmitConfirmMs,
      setCameraPermission,
      setVolume,
      toggleMuted,
      toggleMirrored,
      dismissOnboarding,
      setLocale,
      setCameraScale,
      setAutoSubmitEnabled,
      setAutoSubmitPromptMs,
      setAutoSubmitConfirmMs,
    }),
    [
      cameraPermission,
      persisted,
      setVolume,
      toggleMuted,
      toggleMirrored,
      dismissOnboarding,
      setLocale,
      setCameraScale,
      setAutoSubmitEnabled,
      setAutoSubmitPromptMs,
      setAutoSubmitConfirmMs,
    ],
  )

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>
}

export function useAppSettings(): AppSettings {
  const ctx = useContext(AppSettingsContext)
  if (!ctx) throw new Error('useAppSettings must be used within an AppSettingsProvider')
  return ctx
}
