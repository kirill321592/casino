import { getJson, postJson, putJson } from './http'

/*
 * These mirror the server's limits rules (responsible-gaming/limits.ts). The
 * server re-checks every value; these only decide what the form offers.
 */
export const REALITY_CHECK_MINUTES = [15, 30, 60, 120] as const
export const SELF_EXCLUSION_DAYS = [1, 7, 30, 180] as const

export interface PlayLimits {
  /** Most the player may lose in one UTC day, net of winnings. `null` is no limit. */
  dailyLossLimit: number | null
  /** A looser limit waiting out its cooling-off period before it applies. */
  pendingDailyLossLimit: { amount: number | null; effectiveAt: string } | null
  /** Minutes between reality checks; `null` turns them off. */
  realityCheckMinutes: number | null
  /** Net loss so far this UTC day, never below zero. */
  lossToday: number
  coolingOffHours: number
}

export interface LimitsUpdate {
  dailyLossLimit: number | null
  realityCheckMinutes: number | null
}

export function fetchLimits(signal?: AbortSignal): Promise<PlayLimits> {
  return getJson<PlayLimits>('/account/limits', signal)
}

export function updateLimits(update: LimitsUpdate): Promise<PlayLimits> {
  return putJson<PlayLimits>('/account/limits', update)
}

/** Starts a break from play. The server ends the session as part of it. */
export function selfExclude(days: number): Promise<void> {
  return postJson<void>('/account/self-exclusion', { days })
}
