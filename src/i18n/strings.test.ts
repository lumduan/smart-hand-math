import { describe, it, expect } from 'vitest'
import { STRINGS, LOCALES, toLocale, type Strings } from '@/i18n/strings'

/** Recursively collect dotted key paths (skips arrays/functions). */
function deepKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return []
  const out: string[] = []
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key
    out.push(path)
    out.push(...deepKeys((obj as Record<string, unknown>)[key], path))
  }
  return out
}

describe('i18n strings', () => {
  it('ships en and th locales', () => {
    expect(LOCALES).toEqual(['en', 'th'])
    expect(STRINGS.en).toBeDefined()
    expect(STRINGS.th).toBeDefined()
  })

  // Phase 8 will replace the `th` stub with a real translation; this guard
  // ensures it stays structurally complete (every en key present in th).
  it('th has structural parity with en (every key present)', () => {
    expect(deepKeys(STRINGS.th)).toEqual(deepKeys(STRINGS.en))
  })

  it('interpolated functions produce the expected output', () => {
    const t: Strings = STRINGS.en
    expect(t.play.correct(7)).toBe("✅ Correct! It's 7")
    expect(t.play.wrong(3, 7)).toBe("❌ Oops, you showed 3. It's 7")
    expect(t.play.idleBody(3)).toContain('3 lives')
    expect(t.game.level(2)).toBe('Level 2')
    expect(t.game.timer(10)).toBe('⏱ 10s')
    expect(t.play.bestLabel(12)).toBe('Best: 12')
  })

  it('toLocale validates input and defaults to en', () => {
    expect(toLocale('en')).toBe('en')
    expect(toLocale('th')).toBe('th')
    expect(toLocale('fr')).toBe('en')
    expect(toLocale(undefined)).toBe('en')
  })
})
