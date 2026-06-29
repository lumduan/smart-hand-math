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
