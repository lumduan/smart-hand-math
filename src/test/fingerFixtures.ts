/**
 * Synthetic 21-landmark hand fixtures for testing the Soroban engine.
 *
 * The engine is distance-based (see src/utils/fingerMathLogic.ts):
 *   • a non-thumb finger is "extended" ⟺ dist(tip, WRIST) > dist(pip, WRIST)
 *   • the thumb is "open" ⟺ dist(THUMB_TIP, PINKY_MCP) > dist(THUMB_IP, PINKY_MCP)
 *
 * These builders place landmarks so those inequalities hold with a clear margin
 * (strict `>`, never a tie), letting tests construct any digit 0–9 and any
 * handedness without a real camera.
 */
import type { Landmark, RawHandedness, TrackedHand } from '@/utils/fingerMathLogic'

const point = (x: number, y: number): Landmark => ({ x, y, z: 0 })

// Distance from the wrist along a finger's ray. Extended → tip well past the
// PIP; folded → tip curled back closer to the wrist than the PIP.
const EXT = { mcp: 3, pip: 5, dip: 6.5, tip: 8 }
const FOLD = { mcp: 3, pip: 5, dip: 4.2, tip: 3.5 }

const FINGER_RAY = {
  index: { dx: 0.2, dy: 1 },
  middle: { dx: 0.35, dy: 1 },
  ring: { dx: 0.5, dy: 1 },
  pinky: { dx: 0.65, dy: 1 },
} as const

const FINGER_BASE: Record<keyof typeof FINGER_RAY, number> = {
  index: 5,
  middle: 9,
  ring: 13,
  pinky: 17,
}

export interface HandSpec {
  thumb?: boolean
  index?: boolean
  middle?: boolean
  ring?: boolean
  pinky?: boolean
}

/** Build 21 landmarks realising the given open/closed finger configuration. */
export function makeLandmarks(spec: HandSpec): Landmark[] {
  const lm: Landmark[] = new Array(21)
  lm[0] = point(0, 0) // WRIST

  for (const name of Object.keys(FINGER_RAY) as (keyof typeof FINGER_RAY)[]) {
    const ray = FINGER_RAY[name]
    const d = spec[name] ? EXT : FOLD
    const base = FINGER_BASE[name]
    lm[base] = point(ray.dx * d.mcp, ray.dy * d.mcp) // MCP
    lm[base + 1] = point(ray.dx * d.pip, ray.dy * d.pip) // PIP
    lm[base + 2] = point(ray.dx * d.dip, ray.dy * d.dip) // DIP
    lm[base + 3] = point(ray.dx * d.tip, ray.dy * d.tip) // TIP
  }

  // Thumb geometry is relative to the pinky MCP (landmark 17), which is set
  // above. The thumb IP stays fixed; only the tip moves — far for "open",
  // tucked back for "closed".
  const pinkyMcp = lm[17]
  lm[1] = point(pinkyMcp.x - 1.2, pinkyMcp.y - 1.0) // CMC
  lm[2] = point(pinkyMcp.x - 1.8, pinkyMcp.y - 0.9) // MCP
  lm[3] = point(pinkyMcp.x - 2.4, pinkyMcp.y - 0.6) // IP (fixed)
  lm[4] = spec.thumb
    ? point(pinkyMcp.x - 3.4, pinkyMcp.y + 0.2) // open: tip reaches across
    : point(pinkyMcp.x - 0.6, pinkyMcp.y - 0.3) // tucked: tip folds toward palm

  return lm
}

/** HandSpec for a target Soroban digit (thumb iff ≥5; fingers left-to-right). */
export function digitSpec(digit: number): HandSpec {
  const thumb = digit >= 5
  const fingerCount = digit - (thumb ? 5 : 0)
  const order: (keyof HandSpec)[] = ['index', 'middle', 'ring', 'pinky']
  const spec: HandSpec = { thumb }
  for (let i = 0; i < fingerCount; i++) spec[order[i]] = true
  return spec
}

/** A tracked hand realising a digit, with raw MediaPipe handedness + score. */
export function digitHand(
  digit: number,
  handedness: RawHandedness = 'Right',
  score = 0.9,
): TrackedHand {
  return { landmarks: makeLandmarks(digitSpec(digit)), handedness, score }
}

/** A tracked hand realising an arbitrary finger configuration. */
export function makeHand(
  spec: HandSpec,
  handedness: RawHandedness = 'Right',
  score = 0.9,
): TrackedHand {
  return { landmarks: makeLandmarks(spec), handedness, score }
}
