export type BetType = 'straight' | 'red' | 'black' | 'even' | 'odd'

export interface Bet {
  id: string
  type: BetType
  amount: number
  value?: number
}

export interface BetDefinition {
  type: BetType
  label: string
  value?: number
}
