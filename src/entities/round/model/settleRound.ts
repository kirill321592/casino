import type { Bet } from '@/entities/bet/model/types'
import { calcTotalPayout } from '@/entities/bet/model/payouts'
import { creditBalance, deductBalance } from '@/entities/player/model/balance'

export interface SettleResult {
  balance: number
  winnings: number
  winningNumber: number
}

export function settleRound(
  balance: number,
  bets: Bet[],
  winningNumber: number,
): SettleResult {
  const winnings = calcTotalPayout(bets, winningNumber)
  return {
    balance: creditBalance(balance, winnings),
    winnings,
    winningNumber,
  }
}

export function lockStake(balance: number, stake: number): number {
  return deductBalance(balance, stake)
}
