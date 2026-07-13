import { calcTotalStake } from './payouts'
import type { Bet } from './types'

export function canAffordBet(balance: number, bets: Bet[], amount: number): boolean {
  return balance >= calcTotalStake(bets) + amount
}

export function canPlaceBets(balance: number, bets: Bet[]): boolean {
  const stake = calcTotalStake(bets)
  return bets.length > 0 && stake > 0 && balance >= stake
}
