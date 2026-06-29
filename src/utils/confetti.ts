import confetti from 'canvas-confetti'

/**
 * Celebration presets built on canvas-confetti (see ADR-0006 + the animations
 * README). Each call renders a one-shot particle burst on a private canvas;
 * `disableForReducedMotion` makes them respect `prefers-reduced-motion`.
 */

/** Small celebratory burst — a correct answer. */
export function burst(): void {
  confetti({
    particleCount: 28,
    spread: 55,
    startVelocity: 28,
    decay: 0.92,
    scalar: 0.9,
    disableForReducedMotion: true,
  })
}

/** Bigger burst — a streak milestone or level-up. */
export function celebrate(): void {
  confetti({
    particleCount: 80,
    spread: 80,
    startVelocity: 38,
    origin: { y: 0.7 },
    disableForReducedMotion: true,
  })
}

/** Big finale — reserved for a win (currently dormant; no win condition yet). */
export function finale(): void {
  confetti({
    particleCount: 160,
    spread: 120,
    startVelocity: 45,
    origin: { y: 0.6 },
    disableForReducedMotion: true,
  })
}
