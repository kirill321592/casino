export type ServerBetType = 'straight' | 'red' | 'black' | 'even' | 'odd'

export interface RoundState {
  id: string
  status: 'betting' | 'spinning'
  closesAt: string
  betsCount: number
}

/** A bet the server took, with the balance it left behind. */
export interface ServerBet {
  type: ServerBetType
  amount: number
  number?: number
  balance: number
}

/**
 * Each player is told the number, their own payout and their own balance —
 * the table's other stakes are nobody else's business.
 */
export interface RoundResult {
  number: number
  payout: number
  balance: number
}
