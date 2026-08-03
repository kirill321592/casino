import { HISTORY_LENGTH, DEFAULT_CHIP } from '@/shared/config/constants'
import type { RoundState } from '@/shared/api/roulette'
import type { Bet } from './types'

export type RoulettePhase = 'idle' | 'spinning' | 'result'

export interface RouletteState {
  phase: RoulettePhase
  /**
   * What the player is shown. The server owns the real figure; this one only
   * lags it while the wheel is still turning.
   */
  balance: number
  bets: Bet[]
  selectedChip: number
  lastResult: number | null
  lastWinnings: number
  history: number[]
  pendingResult: number | null
  pendingPayout: number
  pendingBalance: number | null
  round: RoundState | null
}

export type RouletteAction =
  | { type: 'SET_CHIP'; chip: number }
  | { type: 'CLEAR_BETS' }
  | { type: 'BET_ACCEPTED'; bet: Omit<Bet, 'id'>; balance: number; roundId: string }
  | { type: 'BALANCE_SYNC'; balance: number }
  | { type: 'ROUND_STATE'; round: RoundState }
  | { type: 'ROUND_RESULT'; winningNumber: number; payout: number; balance: number }
  | { type: 'SPIN_COMPLETE' }
  | { type: 'DISMISS_RESULT' }

let betIdCounter = 0

export function createInitialRouletteState(balance: number): RouletteState {
  return {
    phase: 'idle',
    balance,
    bets: [],
    selectedChip: DEFAULT_CHIP,
    lastResult: null,
    lastWinnings: 0,
    history: [],
    pendingResult: null,
    pendingPayout: 0,
    pendingBalance: null,
    round: null,
  }
}

export function rouletteReducer(state: RouletteState, action: RouletteAction): RouletteState {
  switch (action.type) {
    case 'SET_CHIP':
      if (state.phase === 'spinning') return state
      return { ...state, selectedChip: action.chip }

    case 'BET_ACCEPTED': {
      // Mid-spin the balance is being held back for the reveal; letting an
      // acceptance move it now would give the result away early.
      if (state.phase === 'spinning') return state

      /*
       * An acceptance names the round it was taken for. If that round is no
       * longer the open one it has outlived its result, and the balance it
       * carries was read before that round paid out — applying it would roll a
       * settled balance backwards and wipe the winnings off the screen. The chip
       * is just as stale, so both are dropped and the next round:result or
       * session:balance restates the figure.
       */
      if (action.roundId !== state.round?.id) return state

      const bet: Bet = { ...action.bet, id: `bet-${++betIdCounter}` }
      // The stake left the balance the moment the server took the bet.
      return { ...state, bets: [...state.bets, bet], balance: action.balance }
    }

    /* A reconnect re-states the balance; mid-spin it would spoil the reveal. */
    case 'BALANCE_SYNC':
      if (state.phase === 'spinning') return state
      return { ...state, balance: action.balance }

    case 'ROUND_STATE': {
      const opensNewRound = action.round.status === 'betting' && state.round?.id !== action.round.id

      // The server opens the next round 3s after the result while the wheel
      // animates for 3.5s, so a spin in flight must survive this — SPIN_COMPLETE
      // settles it. Clearing here drops the payout and result every round.
      if (!opensNewRound || state.phase === 'spinning') {
        return { ...state, round: action.round }
      }

      return {
        ...state,
        round: action.round,
        phase: 'idle',
        bets: [],
        pendingResult: null,
        pendingPayout: 0,
        pendingBalance: null,
      }
    }

    /* Takes the chips off the board and nothing else — the result on screen is
     * dismissed by DISMISS_RESULT or by the next round opening. */
    case 'CLEAR_BETS':
      if (state.phase === 'spinning') return state
      return { ...state, bets: [] }

    case 'ROUND_RESULT': {
      if (state.phase !== 'idle' && state.phase !== 'result') return state

      // Winnings are already in the account; the balance on screen waits for the
      // wheel so the player sees the number land before it moves.
      return {
        ...state,
        phase: 'spinning',
        pendingResult: action.winningNumber,
        pendingPayout: action.payout,
        pendingBalance: action.balance,
        lastWinnings: 0,
      }
    }

    case 'SPIN_COMPLETE': {
      if (state.phase !== 'spinning' || state.pendingResult === null) return state

      return {
        ...state,
        phase: 'result',
        balance: state.pendingBalance ?? state.balance,
        bets: [],
        lastResult: state.pendingResult,
        lastWinnings: state.pendingPayout,
        history: [state.pendingResult, ...state.history].slice(0, HISTORY_LENGTH),
        pendingResult: null,
        pendingPayout: 0,
        pendingBalance: null,
      }
    }

    case 'DISMISS_RESULT':
      if (state.phase !== 'result') return state
      return { ...state, phase: 'idle' }

    default:
      return state
  }
}
