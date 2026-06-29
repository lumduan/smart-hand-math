import { describe, it, expect } from 'vitest'
import {
  handValue,
  handsToNumber,
  anatomicalHand,
  getFingerStates,
  INVERT_HANDEDNESS,
  type RawHandedness,
} from '@/utils/fingerMathLogic'
import { makeLandmarks, digitHand, digitSpec } from '@/test/fingerFixtures'

describe('handValue — Soroban digit 0..9', () => {
  for (let d = 0; d <= 9; d++) {
    it(`digit ${d} → handValue ${d}`, () => {
      expect(handValue(makeLandmarks(digitSpec(d)))).toBe(d)
    })
  }

  it('open hand (thumb + 4 fingers) = 9', () => {
    expect(
      handValue(makeLandmarks({ thumb: true, index: true, middle: true, ring: true, pinky: true })),
    ).toBe(9)
  })

  it('closed fist = 0', () => {
    expect(handValue(makeLandmarks({}))).toBe(0)
  })

  it('thumb only = 5', () => {
    expect(handValue(makeLandmarks({ thumb: true }))).toBe(5)
  })

  it('four fingers, no thumb = 4', () => {
    expect(handValue(makeLandmarks({ index: true, middle: true, ring: true, pinky: true }))).toBe(4)
  })
})

describe('getFingerStates', () => {
  it('matches the decomposition of digit 7 (thumb + index + middle)', () => {
    expect(getFingerStates(makeLandmarks(digitSpec(7)))).toEqual({
      thumb: true,
      index: true,
      middle: true,
      ring: false,
      pinky: false,
    })
  })

  it('reports all fingers closed for a fist', () => {
    expect(getFingerStates(makeLandmarks({}))).toEqual({
      thumb: false,
      index: false,
      middle: false,
      ring: false,
      pinky: false,
    })
  })
})

describe('anatomicalHand', () => {
  it(`applies the current INVERT_HANDEDNESS=${INVERT_HANDEDNESS}`, () => {
    expect(anatomicalHand('Left')).toBe(INVERT_HANDEDNESS ? 'Right' : 'Left')
    expect(anatomicalHand('Right')).toBe(INVERT_HANDEDNESS ? 'Left' : 'Right')
  })
})

describe('handsToNumber — place value 0..99', () => {
  // Anatomical LEFT = tens, RIGHT = units. With INVERT_HANDEDNESS=true the raw
  // MediaPipe labels are swapped, so raw 'Right' → tens and raw 'Left' → units.
  const tens: RawHandedness = INVERT_HANDEDNESS ? 'Right' : 'Left'
  const units: RawHandedness = INVERT_HANDEDNESS ? 'Left' : 'Right'

  it('returns 0 when no hand is visible', () => {
    expect(handsToNumber([])).toBe(0)
  })

  it.each([
    ['0 + 0', 0, 0, 0],
    ['3 + 7', 3, 7, 37],
    ['5 + 0', 5, 0, 50],
    ['0 + 9', 0, 9, 9],
    ['1 + 0', 1, 0, 10],
    ['9 + 9', 9, 9, 99],
  ])('%s (tens + units) → %i', (_label, t, u, expected) => {
    expect(handsToNumber([digitHand(t, tens), digitHand(u, units)])).toBe(expected)
  })

  it('routes a single tens hand to the tens slot (units 0)', () => {
    expect(handsToNumber([digitHand(3, tens)])).toBe(30)
  })

  it('routes a single units hand to the units slot (tens 0)', () => {
    expect(handsToNumber([digitHand(3, units)])).toBe(3)
  })

  it('same side: the higher-confidence hand wins', () => {
    const low = digitHand(2, tens, 0.6)
    const high = digitHand(4, tens, 0.95)
    expect(handsToNumber([low, high])).toBe(40)
  })

  it('same side, equal score: the first-seen hand wins', () => {
    const first = digitHand(2, tens, 0.9)
    const second = digitHand(4, tens, 0.9)
    expect(handsToNumber([first, second])).toBe(20)
  })

  it('missing score defaults to 1 (first-seen still wins on a tie)', () => {
    const first = { landmarks: makeLandmarks(digitSpec(2)), handedness: tens }
    const second = { landmarks: makeLandmarks(digitSpec(4)), handedness: tens }
    expect(handsToNumber([first, second])).toBe(20)
  })
})
