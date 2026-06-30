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

interface AppSettings {
  cameraPermission: CameraPermission
  volume: number // 0..1
  muted: boolean
  mirrored: boolean // selfie view (default true)
  onboardingDismissed: boolean // first-visit "how it works" banner
  locale: Locale // active UI language
  cameraScale: CameraScale // preview size (sm/md/lg) — Phase 8.1
  setCameraPermission: (p: CameraPermission) => void
  setVolume: (v: number) => void
  toggleMuted: () => void
  toggleMirrored: () => void
  dismissOnboarding: () => void
  setLocale: (locale: Locale) => void
  setCameraScale: (s: CameraScale) => void
}

const STORAGE_KEY = 'smartmath.settings'

interface PersistedSettings {
  volume: number
  muted: boolean
  mirrored: boolean
  onboardingDismissed: boolean
  locale: Locale
  cameraScale: CameraScale
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
    }
  } catch {
    return fallback
  }
}

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [persisted, setPersisted] = useState<PersistedSettings>(loadPersisted)
  const [cameraPermission, setCameraPermission] = useState<CameraPermission>('prompt')

  // Persist the audio/mirror/onboarding/locale/camera-scale prefs whenever they change.
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

  const value = useMemo<AppSettings>(
    () => ({
      cameraPermission,
      volume: persisted.volume,
      muted: persisted.muted,
      mirrored: persisted.mirrored,
      onboardingDismissed: persisted.onboardingDismissed,
      locale: persisted.locale,
      cameraScale: persisted.cameraScale,
      setCameraPermission,
      setVolume,
      toggleMuted,
      toggleMirrored,
      dismissOnboarding,
      setLocale,
      setCameraScale,
    }),
    [cameraPermission, persisted, setVolume, toggleMuted, toggleMirrored, dismissOnboarding, setLocale, setCameraScale],
  )

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>
}

export function useAppSettings(): AppSettings {
  const ctx = useContext(AppSettingsContext)
  if (!ctx) throw new Error('useAppSettings must be used within an AppSettingsProvider')
  return ctx
}
