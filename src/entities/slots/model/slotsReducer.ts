import { STARTING_BALANCE, CHIP_VALUES, DEFAULT_CHIP, HISTORY_LENGTH } from '@/shared/config/constants'
import { deductBalance, creditBalance } from '@/entities/player/model/balance'
import { calcPayout } from './spin'

export type SlotsPhase = 'idle' | 'spinning' | 'result'

export interface SlotsSpinRecord {
  reels: string[]
  winnings: number
}

export interface SlotsState {
  phase: SlotsPhase
  balance: number
  bet: number
  reels: string[]
  pendingReels: string[] | null
  lastWinnings: number
  history: SlotsSpinRecord[]
}

export type SlotsAction =
  | { type: 'SET_BET'; bet: number }
  | { type: 'SPIN_START'; reels: string[] }
  | { type: 'SPIN_COMPLETE' }
  | { type: 'DISMISS_RESULT' }

export function createInitialSlotsState(): SlotsState {
  return {
    phase: 'idle',
    balance: STARTING_BALANCE,
    bet: DEFAULT_CHIP,
    reels: ['🍒', '🍋', '🔔'],
    pendingReels: null,
    lastWinnings: 0,
    history: [],
  }
}

export function slotsReducer(state: SlotsState, action: SlotsAction): SlotsState {
  switch (action.type) {
    case 'SET_BET':
      if (state.phase === 'spinning') return state
      if (!CHIP_VALUES.includes(action.bet as (typeof CHIP_VALUES)[number])) return state
      return { ...state, bet: action.bet }

    case 'SPIN_START': {
      if (state.phase === 'spinning') return state
      if (state.balance < state.bet) return state
      return {
        ...state,
        phase: 'spinning',
        balance: deductBalance(state.balance, state.bet),
        pendingReels: action.reels,
        lastWinnings: 0,
      }
    }

    case 'SPIN_COMPLETE': {
      if (state.phase !== 'spinning' || state.pendingReels === null) return state
      const winnings = calcPayout(state.pendingReels, state.bet)
      return {
        ...state,
        phase: 'result',
        reels: state.pendingReels,
        pendingReels: null,
        balance: creditBalance(state.balance, winnings),
        lastWinnings: winnings,
        history: [{ reels: state.pendingReels, winnings }, ...state.history].slice(0, HISTORY_LENGTH),
      }
    }

    case 'DISMISS_RESULT':
      if (state.phase !== 'result') return state
      return { ...state, phase: 'idle' }

    default:
      return state
  }
}
