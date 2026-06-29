import { describe, it, expect } from 'vitest'
import { handValue, handsToNumber } from '@/utils/fingerMathLogic'
import type { Landmark, RawHandedness } from '@/utils/fingerMathLogic'

/** Shape written by docs/plans/hand-tracking/PoC/capture.html. */
interface CapturedHand {
  handedness: RawHandedness
  score?: number
  landmarks: Landmark[]
}
interface Fixture {
  label: string
  expectedNumber: number
  hands: CapturedHand[]
}

// Real landmark captures live in src/test/fixtures/hand-tracking/*.json.
// Until the first capture is dropped here this suite is SKIPPED (CI-safe).
// Once present, each fixture runs the gesture→number mapping through the exact
// production code path on REAL hands — the live check that confirms the
// INVERT_HANDEDNESS default (see docs/plans/hand-tracking/PoC/README.md + ADR-0005).
const fixtures = import.meta.glob('../test/fixtures/hand-tracking/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Fixture>

const run = Object.keys(fixtures).length > 0 ? describe : describe.skip

run('fingerMathLogic — real-hardware captures', () => {
  for (const [path, fixture] of Object.entries(fixtures)) {
    const name = fixture.label ?? path

    describe(`${name}`, () => {
      it('every captured hand decodes to a Soroban digit 0–9', () => {
        expect(fixture.hands.length).toBeGreaterThan(0)
        for (const hand of fixture.hands) {
          const value = handValue(hand.landmarks)
          expect(value).toBeGreaterThanOrEqual(0)
          expect(value).toBeLessThanOrEqual(9)
        }
      })

      it(`composes to the intended number ${fixture.expectedNumber}`, () => {
        expect(handsToNumber(fixture.hands)).toBe(fixture.expectedNumber)
      })
    })
  }
})
