export type ServerBetType = 'straight' | 'red' | 'black' | 'even' | 'odd'

export interface RoundState {
  id: string
  status: 'betting' | 'spinning'
  closesAt: string
  betsCount: number
}

export interface ServerBet {
  type: ServerBetType
  amount: number
  number?: number
}

export interface RoundResult {
  number: number
  payouts: Record<string, number>
}

export const rouletteServerUrl = import.meta.env.VITE_ROULETTE_SERVER_URL ?? 'http://localhost:3000'
