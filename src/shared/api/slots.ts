export interface SlotsPaytableEntry {
  symbol: string
  payout3: number
  payout2: number
}

/** Sent by the server on connect; the client never decides odds or payouts. */
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
