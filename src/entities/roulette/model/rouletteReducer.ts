import { HISTORY_LENGTH, STARTING_BALANCE, DEFAULT_CHIP } from '@/shared/config/constants'
import { creditBalance, deductBalance } from '@/entities/player/model/balance'
import type { RoundState } from '@/shared/api/roulette'
import { calcTotalStake } from './payouts'
import type { Bet } from './types'

export type RoulettePhase = 'idle' | 'spinning' | 'result'

export interface RouletteState {
  phase: RoulettePhase
  balance: number
  bets: Bet[]
  selectedChip: number
  lastResult: number | null
  lastWinnings: number
  history: number[]
  pendingResult: number | null
  pendingPayout: number
  round: RoundState | null
}

export type RouletteAction =
  | { type: 'SET_CHIP'; chip: number }
  | { type: 'CLEAR_BETS' }
  | { type: 'BET_ACCEPTED'; bet: Omit<Bet, 'id'> }
  | { type: 'ROUND_STATE'; round: RoundState }
  | { type: 'ROUND_RESULT'; winningNumber: number; payout: number }
  | { type: 'SPIN_COMPLETE' }
  | { type: 'DISMISS_RESULT' }

let betIdCounter = 0

export function createInitialRouletteState(): RouletteState {
  return {
    phase: 'idle',
    balance: STARTING_BALANCE,
    bets: [],
    selectedChip: DEFAULT_CHIP,
    lastResult: null,
    lastWinnings: 0,
    history: [],
    pendingResult: null,
    pendingPayout: 0,
    round: null,
  }
}

export function rouletteReducer(state: RouletteState, action: RouletteAction): RouletteState {
  switch (action.type) {
    case 'SET_CHIP':
      if (state.phase === 'spinning') return state
      return { ...state, selectedChip: action.chip }

    case 'BET_ACCEPTED': {
      if (state.phase === 'spinning') return state
      const bet: Bet = { ...action.bet, id: `bet-${++betIdCounter}` }
      return { ...state, bets: [...state.bets, bet] }
    }

    case 'ROUND_STATE':
      return {
        ...state,
        round: action.round,
        ...(action.round.status === 'betting' && state.round?.id !== action.round.id
          ? { phase: 'idle', bets: [], pendingResult: null, pendingPayout: 0 }
          : {}),
      }

    case 'CLEAR_BETS':
      if (state.phase === 'spinning') return state
      return { ...state, bets: [], phase: 'idle' }

    case 'ROUND_RESULT': {
      if (state.phase !== 'idle' && state.phase !== 'result') return state

      const stake = calcTotalStake(state.bets)

      return {
        ...state,
        phase: 'spinning',
        balance: deductBalance(state.balance, stake),
        pendingResult: action.winningNumber,
        pendingPayout: action.payout,
        lastWinnings: 0,
      }
    }

    case 'SPIN_COMPLETE': {
      if (state.phase !== 'spinning' || state.pendingResult === null) return state

      return {
        ...state,
        phase: 'result',
        balance: creditBalance(state.balance, state.pendingPayout),
        bets: [],
        lastResult: state.pendingResult,
        lastWinnings: state.pendingPayout,
        history: [state.pendingResult, ...state.history].slice(0, HISTORY_LENGTH),
        pendingResult: null,
        pendingPayout: 0,
      }
    }

    case 'DISMISS_RESULT':
      if (state.phase !== 'result') return state
      return { ...state, phase: 'idle' }

    default:
      return state
  }
}
