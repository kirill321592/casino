import { createContext, type Dispatch } from 'react'
import type { RouletteAction, RouletteState } from './rouletteReducer'
import type { BetType } from './types'

export interface RouletteContextValue {
  state: RouletteState
  dispatch: Dispatch<RouletteAction>
  placeBet: (type: BetType, value?: number) => void
  connected: boolean
  error: string | null
}

export const RouletteContext = createContext<RouletteContextValue | null>(null)
