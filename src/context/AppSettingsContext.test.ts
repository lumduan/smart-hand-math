import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { AppSettingsProvider, useAppSettings } from '@/context/AppSettingsContext'

const STORAGE_KEY = 'smartmath.settings'

// Mirrors AppSettingsContext.loadPersisted(): undefined env → 0.6 fallback.
const expectedDefaultVolume = Number(import.meta.env.VITE_DEFAULT_VOLUME ?? 0.6)

beforeEach(() => {
  localStorage.clear()
})

describe('useAppSettings defaults', () => {
  it('uses fallback defaults when nothing is persisted', () => {
    const { result } = renderHook(() => useAppSettings(), { wrapper: AppSettingsProvider })
    expect(result.current.volume).toBe(expectedDefaultVolume)
    expect(result.current.muted).toBe(false)
    expect(result.current.mirrored).toBe(true)
    expect(result.current.cameraPermission).toBe('prompt')
    expect(result.current.locale).toBe('en')
    expect(result.current.onboardingDismissed).toBe(false)
    expect(result.current.cameraScale).toBe('md')
  })
})

describe('setVolume', () => {
  it('clamps into [0,1]', () => {
    const { result } = renderHook(() => useAppSettings(), { wrapper: AppSettingsProvider })
    act(() => result.current.setVolume(2))
    expect(result.current.volume).toBe(1)
    act(() => result.current.setVolume(-3))
    expect(result.current.volume).toBe(0)
    act(() => result.current.setVolume(0.4))
    expect(result.current.volume).toBe(0.4)
  })
})

describe('toggles', () => {
  it('toggleMuted flips muted', () => {
    const { result } = renderHook(() => useAppSettings(), { wrapper: AppSettingsProvider })
    act(() => result.current.toggleMuted())
    expect(result.current.muted).toBe(true)
    act(() => result.current.toggleMuted())
    expect(result.current.muted).toBe(false)
  })

  it('toggleMirrored flips mirrored', () => {
    const { result } = renderHook(() => useAppSettings(), { wrapper: AppSettingsProvider })
    act(() => result.current.toggleMirrored())
    expect(result.current.mirrored).toBe(false)
    act(() => result.current.toggleMirrored())
    expect(result.current.mirrored).toBe(true)
  })
})

describe('persistence', () => {
  it('writes volume/muted/mirrored to localStorage under smartmath.settings', () => {
    const { result } = renderHook(() => useAppSettings(), { wrapper: AppSettingsProvider })
    act(() => {
      result.current.setVolume(0.3)
      result.current.toggleMuted()
    })
    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw!)).toMatchObject({ volume: 0.3, muted: true, mirrored: true })
  })

  it('hydrates from persisted values (shallow merge over fallback)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ volume: 0.25, muted: true }))
    const { result } = renderHook(() => useAppSettings(), { wrapper: AppSettingsProvider })
    expect(result.current.volume).toBe(0.25)
    expect(result.current.muted).toBe(true)
    expect(result.current.mirrored).toBe(true) // fallback fills the missing key
  })

  it('falls back to defaults on corrupt JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json')
    const { result } = renderHook(() => useAppSettings(), { wrapper: AppSettingsProvider })
    expect(result.current.volume).toBe(expectedDefaultVolume)
    expect(result.current.muted).toBe(false)
  })
})

describe('locale', () => {
  it('defaults to en and switches via setLocale', () => {
    const { result } = renderHook(() => useAppSettings(), { wrapper: AppSettingsProvider })
    expect(result.current.locale).toBe('en')
    act(() => result.current.setLocale('th'))
    expect(result.current.locale).toBe('th')
  })

  it('persists locale to localStorage', () => {
    const { result } = renderHook(() => useAppSettings(), { wrapper: AppSettingsProvider })
    act(() => result.current.setLocale('th'))
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toMatchObject({ locale: 'th' })
  })

  it('hydrates a persisted locale', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ locale: 'th' }))
    const { result } = renderHook(() => useAppSettings(), { wrapper: AppSettingsProvider })
    expect(result.current.locale).toBe('th')
  })

  it('coerces an unsupported persisted locale back to en', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ locale: 'fr' }))
    const { result } = renderHook(() => useAppSettings(), { wrapper: AppSettingsProvider })
    expect(result.current.locale).toBe('en')
  })
})

describe('cameraScale', () => {
  it('defaults to md and switches via setCameraScale', () => {
    const { result } = renderHook(() => useAppSettings(), { wrapper: AppSettingsProvider })
    expect(result.current.cameraScale).toBe('md')
    act(() => result.current.setCameraScale('lg'))
    expect(result.current.cameraScale).toBe('lg')
  })

  it('persists cameraScale to localStorage', () => {
    const { result } = renderHook(() => useAppSettings(), { wrapper: AppSettingsProvider })
    act(() => result.current.setCameraScale('sm'))
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toMatchObject({ cameraScale: 'sm' })
  })

  it('hydrates a persisted cameraScale', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ cameraScale: 'lg' }))
    const { result } = renderHook(() => useAppSettings(), { wrapper: AppSettingsProvider })
    expect(result.current.cameraScale).toBe('lg')
  })

  it('coerces an unsupported persisted cameraScale back to md', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ cameraScale: 'huge' }))
    const { result } = renderHook(() => useAppSettings(), { wrapper: AppSettingsProvider })
    expect(result.current.cameraScale).toBe('md')
  })
})

describe('autoSubmit settings', () => {
  it('uses defaults (enabled, 1500ms prompt, 1000ms confirm)', () => {
    const { result } = renderHook(() => useAppSettings(), { wrapper: AppSettingsProvider })
    expect(result.current.autoSubmitEnabled).toBe(true)
    expect(result.current.autoSubmitPromptMs).toBe(1500)
    expect(result.current.autoSubmitConfirmMs).toBe(1000)
  })

  it('persists via the setters', () => {
    const { result } = renderHook(() => useAppSettings(), { wrapper: AppSettingsProvider })
    act(() => {
      result.current.setAutoSubmitEnabled(false)
      result.current.setAutoSubmitPromptMs(800)
      result.current.setAutoSubmitConfirmMs(600)
    })
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toMatchObject({
      autoSubmitEnabled: false,
      autoSubmitPromptMs: 800,
      autoSubmitConfirmMs: 600,
    })
  })

  it('hydrates persisted autoSubmit settings', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ autoSubmitEnabled: false, autoSubmitPromptMs: 700, autoSubmitConfirmMs: 500 }),
    )
    const { result } = renderHook(() => useAppSettings(), { wrapper: AppSettingsProvider })
    expect(result.current.autoSubmitEnabled).toBe(false)
    expect(result.current.autoSubmitPromptMs).toBe(700)
    expect(result.current.autoSubmitConfirmMs).toBe(500)
  })

  it('clamps out-of-range persisted ms into [200, 5000]', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ autoSubmitPromptMs: 10, autoSubmitConfirmMs: 99999 }),
    )
    const { result } = renderHook(() => useAppSettings(), { wrapper: AppSettingsProvider })
    expect(result.current.autoSubmitPromptMs).toBe(200)
    expect(result.current.autoSubmitConfirmMs).toBe(5000)
  })

  it('falls back to the default when persisted ms is non-numeric', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ autoSubmitPromptMs: 'fast' }))
    const { result } = renderHook(() => useAppSettings(), { wrapper: AppSettingsProvider })
    expect(result.current.autoSubmitPromptMs).toBe(1500)
  })

  it('coerces a non-boolean persisted enabled back to true', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ autoSubmitEnabled: 'yes' }))
    const { result } = renderHook(() => useAppSettings(), { wrapper: AppSettingsProvider })
    expect(result.current.autoSubmitEnabled).toBe(true)
  })
})

describe('cameraPermission', () => {
  it('is in-memory only: settable but never persisted', () => {
    const { result } = renderHook(() => useAppSettings(), { wrapper: AppSettingsProvider })
    expect(result.current.cameraPermission).toBe('prompt')
    act(() => result.current.setCameraPermission('granted'))
    expect(result.current.cameraPermission).toBe('granted')
    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw && (JSON.parse(raw) as Record<string, unknown>).cameraPermission).toBeUndefined()
  })
})
