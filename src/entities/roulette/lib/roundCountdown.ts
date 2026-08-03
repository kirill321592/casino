/**
 * Time left to bet, from the duration the server sent and how long ago it landed.
 *
 * Both readings come from the same monotonic clock, so this owes nothing to the
 * wall clock: a browser set minutes out — or a laptop that slept through half the
 * round — still counts down correctly, and never runs backwards the way a
 * `closesAt` timestamp can when the system clock is corrected mid-round.
 */
export function remainingMs(closesIn: number, elapsedMs: number): number {
  return Math.max(0, closesIn - elapsedMs)
}

/**
 * Seconds while the window is short — which is the whole point of the display —
 * and m:ss once that would read awkwardly. Rounds up so the last second is shown
 * as "1s" rather than "0s" for its full duration.
 */
export function formatCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000)
  if (total < 60) return `${total}s`

  const minutes = Math.floor(total / 60)
  return `${minutes}:${String(total % 60).padStart(2, '0')}`
}

/**
 * How much of the betting window is left, 0–1, for the progress bar.
 *
 * The guard is written to reject NaN as well as zero: an older server sends no
 * `durationMs`, and dividing by that would reach the DOM as `scaleX(NaN)`.
 */
export function countdownProgress(remaining: number, windowMs: number): number {
  if (!(windowMs > 0)) return 0
  return Math.min(1, Math.max(0, remaining / windowMs))
}
