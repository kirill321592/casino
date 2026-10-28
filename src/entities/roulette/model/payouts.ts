import type { Bet } from './types'

export function calcTotalStake(bets: Bet[]): number {
  return bets.reduce((total, bet) => total + bet.amount, 0)
}

/*
 * What each bet pays, stake included, as the server settles it. Shown on the
 * rules page; the server is still the one that pays.
 */
export const BET_PAYOUTS: ReadonlyArray<{ bet: string; covers: string; returns: number }> = [
  { bet: 'Straight up', covers: 'One number, 0–36', returns: 36 },
  { bet: 'Red or Black', covers: '18 numbers; 0 loses', returns: 2 },
  { bet: 'Even or Odd', covers: '18 numbers; 0 loses', returns: 2 },
]

/* A single-zero wheel returns 36 of every 37 units staked, on every bet above. */
export const ROULETTE_RTP = 36 / 37
