import { getPocketColor, isEven, isOdd } from '@/entities/wheel/model/wheelLayout'
import type { Bet } from './types'

export function isBetWinner(bet: Bet, result: number): boolean {
  switch (bet.type) {
    case 'straight':
      return bet.value === result
    case 'red':
      return getPocketColor(result) === 'red'
    case 'black':
      return getPocketColor(result) === 'black'
    case 'even':
      return isEven(result)
    case 'odd':
      return isOdd(result)
  }
}

export function calcBetPayout(bet: Bet, result: number): number {
  if (!isBetWinner(bet, result)) return 0

  switch (bet.type) {
    case 'straight':
      return bet.amount * 36
    case 'red':
    case 'black':
    case 'even':
    case 'odd':
      return bet.amount * 2
  }
}

export function calcTotalPayout(bets: Bet[], result: number): number {
  return bets.reduce((total, bet) => total + calcBetPayout(bet, result), 0)
}

export function calcTotalStake(bets: Bet[]): number {
  return bets.reduce((total, bet) => total + bet.amount, 0)
}
