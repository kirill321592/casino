export type ServerBetType = 'straight' | 'red' | 'black' | 'even' | 'odd'

export interface RoundState {
  id: string
  status: 'betting' | 'spinning'
  closesAt: string
  /**
   * The deadline as a duration, measured by the server. Prefer this over
   * `closesAt`: a duration owes nothing to the browser's clock, so a machine set
   * minutes out still counts down correctly. The server re-reads it every time it
   * sends state, so it is accurate as of arrival and nothing else.
   */
  closesIn: number
  /** Full length of the betting window, for showing progress through it. */
  durationMs: number
  betsCount: number
}

/** A bet the server took, with the balance it left behind. */
export interface ServerBet {
  type: ServerBetType
  amount: number
  number?: number
  balance: number
  /**
   * The round the stake was taken for. A slow acceptance can arrive after that
   * round has paid out, and this is what makes such a one recognisable — the
   * balance it carries was read before the payout, so taking it would undo one.
   */
  roundId: string
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
