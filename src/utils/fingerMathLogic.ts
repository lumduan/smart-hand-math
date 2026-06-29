/**
 * fingerMathLogic — Soroban / Asian finger-counting system
 * --------------------------------------------------------
 * Turns MediaPipe's 21 hand landmarks into numbers using the positional,
 * single/dual-hand Soroban system (NOT Western "one finger = one unit").
 *
 *   • One hand represents a digit 0..9:
 *       - Thumb (landmark 4) extended  = 5
 *       - Index/Middle/Ring/Pinky (8/12/16/20) extended = 1 each
 *       => open hand = 5 + 4 = 9, closed fist = 0
 *   • Two hands form a number 0..99 by place value:
 *       - Player's LEFT  hand = TENS  column (×10)
 *       - Player's RIGHT hand = UNITS column (×1)
 *
 * Detection is intentionally **orientation-, handedness- and mirror-independent
 * for the per-hand digit** (distance-based extension tests). Handedness is only
 * consulted to assign each hand its TENS/UNITS role.
 *
 * MediaPipe 21-landmark model (0 = wrist):
 *   0      WRIST
 *   1-4    thumb   (CMC, MCP, IP, TIP)
 *   5-8    index   (MCP, PIP, DIP, TIP)
 *   9-12   middle  (MCP, PIP, DIP, TIP)
 *   13-16  ring    (MCP, PIP, DIP, TIP)
 *   17-20  pinky   (MCP, PIP, DIP, TIP)
 */

export interface Landmark {
  x: number
  y: number
  z: number
}

export type RawHandedness = 'Left' | 'Right'

export type FingerName = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky'

/** Which fingers are open on a hand (handy for debugging / overlays). */
export type FingerStates = Record<FingerName, boolean>

/** A tracked hand: its 21 landmarks plus the raw MediaPipe handedness label. */
export interface TrackedHand {
  landmarks: Landmark[]
  handedness: RawHandedness
  /** MediaPipe handedness confidence (0..1). Used to break ties. */
  score?: number
}

// ---- Landmark indices ----------------------------------------------------

const WRIST = 0
const THUMB_TIP = 4
const THUMB_IP = 3
const PINKY_MCP = 17

const FINGERS = {
  index: { tip: 8, pip: 6 },
  middle: { tip: 12, pip: 10 },
  ring: { tip: 16, pip: 14 },
  pinky: { tip: 20, pip: 18 },
} as const

const UNIT_FINGERS = ['index', 'middle', 'ring', 'pinky'] as const

// ---- Geometry helpers ----------------------------------------------------

function distance(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/**
 * A non-thumb finger is "extended" when its tip is farther from the wrist than
 * its PIP joint is. This is orientation-tolerant (works for tilted/rotated
 * hands), unlike a naive "tip.y < pip.y" test which assumes an upright hand.
 */
function isFingerExtended(landmarks: Landmark[], name: (typeof UNIT_FINGERS)[number]): boolean {
  const { tip, pip } = FINGERS[name]
  return distance(landmarks[tip], landmarks[WRIST]) > distance(landmarks[pip], landmarks[WRIST])
}

/**
 * The thumb is "open" when its tip is farther from the pinky-MCP (the opposite
 * side of the palm) than the thumb IP joint is. A tucked thumb folds its tip
 * back toward the pinky side. Also orientation- and handedness-independent.
 */
function isThumbOpen(landmarks: Landmark[]): boolean {
  return (
    distance(landmarks[THUMB_TIP], landmarks[PINKY_MCP]) >
    distance(landmarks[THUMB_IP], landmarks[PINKY_MCP])
  )
}

// ---- Public API ----------------------------------------------------------

/** Per-finger open/closed state for a hand. */
export function getFingerStates(landmarks: Landmark[]): FingerStates {
  return {
    thumb: isThumbOpen(landmarks),
    index: isFingerExtended(landmarks, 'index'),
    middle: isFingerExtended(landmarks, 'middle'),
    ring: isFingerExtended(landmarks, 'ring'),
    pinky: isFingerExtended(landmarks, 'pinky'),
  }
}

/**
 * Soroban value of a single hand: 0..9.
 *   thumb open => +5 ; each open index/middle/ring/pinky => +1
 */
export function handValue(landmarks: Landmark[]): number {
  const thumb = isThumbOpen(landmarks) ? 5 : 0
  const units = UNIT_FINGERS.reduce<number>(
    (sum, name) => sum + (isFingerExtended(landmarks, name) ? 1 : 0),
    0,
  )
  return thumb + units
}

/**
 * Webcams feed a NON-mirrored frame to a model trained assuming a MIRRORED
 * (selfie) frame, so the raw MediaPipe "Left"/"Right" labels are systematically
 * swapped relative to the player's anatomical hand. The cosmetic display-mirror
 * flag does NOT change this (landmark coords are always in raw-frame space).
 *
 * Flip this single constant if real-hardware testing shows the wrong hand being
 * treated as tens.
 */
export const INVERT_HANDEDNESS = true

/** Convert a raw MediaPipe label into the player's anatomical hand. */
export function anatomicalHand(raw: RawHandedness): RawHandedness {
  if (!INVERT_HANDEDNESS) return raw
  return raw === 'Left' ? 'Right' : 'Left'
}

/**
 * Compose one or two hands into a number 0..99 by Soroban place value.
 * The player's anatomical LEFT hand supplies the tens digit, the RIGHT hand the
 * units digit. A missing hand contributes 0. If two hands resolve to the same
 * side, the higher-confidence one wins.
 */
export function handsToNumber(hands: TrackedHand[]): number {
  let tens: { value: number; score: number } | null = null
  let units: { value: number; score: number } | null = null

  for (const hand of hands) {
    const value = handValue(hand.landmarks)
    const score = hand.score ?? 1
    const slot = { value, score }
    if (anatomicalHand(hand.handedness) === 'Left') {
      if (!tens || score > tens.score) tens = slot
    } else if (!units || score > units.score) {
      units = slot
    }
  }

  return (tens?.value ?? 0) * 10 + (units?.value ?? 0)
}
