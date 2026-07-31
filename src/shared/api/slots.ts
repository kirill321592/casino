import { getJson, postJson } from './http'

export interface SlotsPaytableEntry {
  symbol: string
  payout3: number
  payout2: number
}

/** Fetched once for display; the server never lets the client decide odds or payouts. */
export interface SlotsPaytable {
  reelCount: number
  symbols: SlotsPaytableEntry[]
}

export interface SlotsSpinResult {
  reels: string[]
  bet: number
  multiplier: number
  winnings: number
}

export function fetchPaytable(signal: AbortSignal): Promise<SlotsPaytable> {
  return getJson<SlotsPaytable>('/slots/paytable', signal)
}

/* One spin, one round trip — nothing here needs a standing connection. */
export function requestSpin(bet: number): Promise<SlotsSpinResult> {
  return postJson<SlotsSpinResult>('/slots/spin', { bet })
}
