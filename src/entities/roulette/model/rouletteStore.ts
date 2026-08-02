import { create } from 'zustand'
import { io, type Socket } from 'socket.io-client'
import { gameServerUrl, type GameError } from '@/shared/api/gameServer'
import type { RoundResult, RoundState, ServerBet } from '@/shared/api/roulette'
import {
  createInitialRouletteState,
  rouletteReducer,
  type RouletteAction,
  type RouletteState,
} from './rouletteReducer'
import type { BetType } from './types'

export interface RouletteStore extends RouletteState {
  connected: boolean
  error: string | null
  dispatch: (action: RouletteAction) => void
  placeBet: (type: BetType, value?: number) => void
  /**
   * Opens the table and returns its teardown. A module-level store outlives the
   * screen, so this also resets — that clean slate used to come free from the
   * provider being unmounted, and without it the next player would sit down to
   * the previous one's history.
   */
  connect: (balance: number) => () => void
}

/* Whichever socket is currently live. Only `connect` writes it. */
let live: Socket | null = null

export const useRouletteStore = create<RouletteStore>((set, get) => ({
  ...createInitialRouletteState(0),
  connected: false,
  error: null,

  /*
   * The reducer stays the authority on what a round may do — it guards the
   * phases, and passing the whole store through it is safe because every case
   * spreads the state it was handed.
   */
  dispatch: (action) => set((store) => rouletteReducer(store, action)),

  placeBet: (type, value) => {
    const { round, phase, selectedChip } = get()
    if (!live?.connected || round?.status !== 'betting' || phase !== 'idle') return

    live.emit('bet:place', {
      roundId: round.id,
      type,
      amount: selectedChip,
      ...(type === 'straight' ? { number: value } : {}),
    })
  },

  connect: (openingBalance) => {
    set({ ...createInitialRouletteState(openingBalance), connected: false, error: null })

    const { dispatch } = get()
    const setError = (error: string | null) => set({ error })

    // The session cookie rides along with the handshake, so the server knows
    // whose balance every bet on this socket belongs to.
    const socket = io(`${gameServerUrl}/roulette`, { withCredentials: true })
    live = socket

    socket.on('connect', () => set({ connected: true, error: null }))
    socket.on('disconnect', () => setError('Connection to the roulette server was lost.'))
    socket.on('connect_error', () => setError('Unable to connect to the roulette server.'))
    socket.on('session:balance', ({ balance }: { balance: number }) =>
      dispatch({ type: 'BALANCE_SYNC', balance }),
    )
    socket.on('round:state', (round: RoundState) => dispatch({ type: 'ROUND_STATE', round }))
    socket.on('bet:accepted', (bet: ServerBet) =>
      dispatch({
        type: 'BET_ACCEPTED',
        bet: { type: bet.type, amount: bet.amount, value: bet.number },
        balance: bet.balance,
      }),
    )
    socket.on('bet:rejected', ({ message }: GameError) => setError(message))
    socket.on('game:error', ({ message }: GameError) => setError(message))
    socket.on('round:result', ({ number, payout, balance }: RoundResult) =>
      dispatch({ type: 'ROUND_RESULT', winningNumber: number, payout, balance }),
    )

    return () => {
      socket.disconnect()
      // StrictMode remounts before this runs, so only retire our own socket.
      if (live === socket) live = null
    }
  },
}))
