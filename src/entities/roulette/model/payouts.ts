import type { Bet } from './types'

export function calcTotalStake(bets: Bet[]): number {
  return bets.reduce((total, bet) => total + bet.amount, 0)
}
