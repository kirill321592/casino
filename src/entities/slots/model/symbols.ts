import type { SlotsPaytable, SlotsPaytableEntry } from '@/shared/api/slots'

/*
 * The reel strip the Pixi scene scrolls through. Odds and payouts are the
 * server's business — these values only seed the UI until `slots:paytable`
 * arrives, and the symbol order drives the animation strip.
 */
export const SLOT_SYMBOLS: SlotsPaytableEntry[] = [
  { symbol: '🍒', payout3: 4, payout2: 1 },
  { symbol: '🍋', payout3: 6, payout2: 1 },
  { symbol: '🔔', payout3: 10, payout2: 2 },
  { symbol: '⭐', payout3: 20, payout2: 3 },
  { symbol: '💎', payout3: 40, payout2: 5 },
  { symbol: '7️⃣', payout3: 100, payout2: 10 },
]

export const REEL_COUNT = 3

export const FALLBACK_PAYTABLE: SlotsPaytable = {
  reelCount: REEL_COUNT,
  symbols: SLOT_SYMBOLS,
}
