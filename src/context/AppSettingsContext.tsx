import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type CameraPermission = 'prompt' | 'granted' | 'denied'

interface AppSettings {
  cameraPermission: CameraPermission
  volume: number // 0..1
  muted: boolean
  mirrored: boolean // selfie view (default true)
  onboardingDismissed: boolean // first-visit "how it works" banner
  setCameraPermission: (p: CameraPermission) => void
  setVolume: (v: number) => void
  toggleMuted: () => void
  toggleMirrored: () => void
  dismissOnboarding: () => void
}

const STORAGE_KEY = 'smartmath.settings'

interface PersistedSettings {
  volume: number
  muted: boolean
  mirrored: boolean
  onboardingDismissed: boolean
}

const AppSettingsContext = createContext<AppSettings | null>(null)

function loadPersisted(): PersistedSettings {
  const fallback: PersistedSettings = {
    volume: Number(import.meta.env.VITE_DEFAULT_VOLUME ?? 0.6),
    muted: false,
    mirrored: true,
    onboardingDismissed: false,
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    return { ...fallback, ...(JSON.parse(raw) as Partial<PersistedSettings>) }
  } catch {
    return fallback
  }
}

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [persisted, setPersisted] = useState<PersistedSettings>(loadPersisted)
  const [cameraPermission, setCameraPermission] = useState<CameraPermission>('prompt')

  // Persist the audio/mirror/onboarding prefs whenever they change.
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

  const value = useMemo<AppSettings>(
    () => ({
      cameraPermission,
      volume: persisted.volume,
      muted: persisted.muted,
      mirrored: persisted.mirrored,
      onboardingDismissed: persisted.onboardingDismissed,
      setCameraPermission,
      setVolume,
      toggleMuted,
      toggleMirrored,
      dismissOnboarding,
    }),
    [cameraPermission, persisted, setVolume, toggleMuted, toggleMirrored, dismissOnboarding],
  )

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>
}

export function useAppSettings(): AppSettings {
  const ctx = useContext(AppSettingsContext)
  if (!ctx) throw new Error('useAppSettings must be used within an AppSettingsProvider')
  return ctx
}
