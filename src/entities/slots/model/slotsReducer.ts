import { STARTING_BALANCE, CHIP_VALUES, DEFAULT_CHIP, HISTORY_LENGTH } from '@/shared/config/constants'
import { deductBalance, creditBalance } from '@/entities/player/model/balance'

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
  pendingWinnings: number
  lastWinnings: number
  history: SlotsSpinRecord[]
}

export type SlotsAction =
  | { type: 'SET_BET'; bet: number }
  | { type: 'SPIN_REQUEST' }
  | { type: 'SPIN_RESULT'; reels: string[]; winnings: number }
  | { type: 'SPIN_FAILED' }
  | { type: 'SPIN_COMPLETE' }
  | { type: 'DISMISS_RESULT' }

export function createInitialSlotsState(): SlotsState {
  return {
    phase: 'idle',
    balance: STARTING_BALANCE,
    bet: DEFAULT_CHIP,
    reels: ['🍒', '🍋', '🔔'],
    pendingReels: null,
    pendingWinnings: 0,
    lastWinnings: 0,
    history: [],
  }
}

/* Waiting on the server: the stake is gone but no reels have arrived yet. */
function isAwaitingResult(state: SlotsState): boolean {
  return state.phase === 'spinning' && state.pendingReels === null
}

export function slotsReducer(state: SlotsState, action: SlotsAction): SlotsState {
  switch (action.type) {
    case 'SET_BET':
      if (state.phase === 'spinning') return state
      if (!CHIP_VALUES.includes(action.bet as (typeof CHIP_VALUES)[number])) return state
      return { ...state, bet: action.bet }

    case 'SPIN_REQUEST': {
      if (state.phase === 'spinning') return state
      if (state.balance < state.bet) return state
      return {
        ...state,
        phase: 'spinning',
        balance: deductBalance(state.balance, state.bet),
        pendingReels: null,
        pendingWinnings: 0,
        lastWinnings: 0,
      }
    }

    case 'SPIN_RESULT': {
      if (!isAwaitingResult(state)) return state
      return { ...state, pendingReels: action.reels, pendingWinnings: action.winnings }
    }

    // The spin never reached the server, so give the stake back.
    case 'SPIN_FAILED':
      if (!isAwaitingResult(state)) return state
      return { ...state, phase: 'idle', balance: creditBalance(state.balance, state.bet) }

    case 'SPIN_COMPLETE': {
      if (state.phase !== 'spinning' || state.pendingReels === null) return state
      const { pendingReels: reels, pendingWinnings: winnings } = state
      return {
        ...state,
        phase: 'result',
        reels,
        pendingReels: null,
        pendingWinnings: 0,
        balance: creditBalance(state.balance, winnings),
        lastWinnings: winnings,
        history: [{ reels, winnings }, ...state.history].slice(0, HISTORY_LENGTH),
      }
    }

    case 'DISMISS_RESULT':
      if (state.phase !== 'result') return state
      return { ...state, phase: 'idle' }

    default:
      return state
  }
}
