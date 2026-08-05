/**
 * Spins are the whole point of the game, so reduced motion shortens them to a
 * quick settle rather than removing them — the player still sees the result
 * land, just without the long orbit.
 */
export function prefersReducedMotion(): boolean {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export const REDUCED_MOTION_DURATION_MS = 420

export function spinDuration(fullDurationMs: number): number {
  return prefersReducedMotion() ? REDUCED_MOTION_DURATION_MS : fullDurationMs
}
