import { create } from 'zustand'
import { io, type Socket } from 'socket.io-client'
import { gameServerUrl, type GameError } from '@/shared/api/gameServer'
import { getJson } from '@/shared/api/http'
import { playSound } from '@/shared/lib/sound'
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

/*
 * How many times in a row the server may hang up on a socket before the table
 * stops dialling back. It only ever does so on purpose — a handshake it would
 * not authenticate — so a second refusal in a row is not going to be the last.
 */
const MAX_SERVER_HANGUPS = 3

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

  /*
   * Open whenever the round is, including while the previous result is still on
   * screen — the server opens the next round before the wheel has finished, and
   * making the player dismiss the overlay first costs them betting time they
   * cannot get back.
   */
  placeBet: (type, value) => {
    const { round, phase, selectedChip } = get()
    if (!live?.connected || round?.status !== 'betting' || phase === 'spinning') return

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

    let hangups = 0

    socket.on('connect', () => set({ connected: true, error: null }))
    /*
     * A dropped transport — wifi blip, server restart — Socket.IO redials on its
     * own, with backoff. A deliberate hangup it leaves alone, and here that means
     * the server would not take the session cookie. Asking the HTTP API settles
     * which it is: a 401 there signs the player out through the usual path,
     * anything else means the session is fine and the table can dial back in.
     */
    socket.on('disconnect', (reason) => {
      set({ connected: false })
      if (reason === 'io client disconnect') return

      if (reason !== 'io server disconnect') {
        setError('Lost connection to the roulette server. Reconnecting…')
        return
      }

      hangups += 1
      if (hangups > MAX_SERVER_HANGUPS) {
        setError('The roulette server keeps closing the connection. Reload the page to try again.')
        return
      }

      getJson('/auth/me')
        .then(() => {
          if (live === socket) socket.connect()
        })
        .catch(() => undefined)
    })
    socket.on('connect_error', () => {
      set({ connected: false })
      setError('Unable to reach the roulette server. Retrying…')
    })
    socket.on('session:balance', ({ balance }: { balance: number }) =>
      dispatch({ type: 'BALANCE_SYNC', balance }),
    )
    socket.on('round:state', (round: RoundState) => {
      // A round only arrives once the handshake was accepted.
      hangups = 0
      dispatch({ type: 'ROUND_STATE', round })
    })
    socket.on('bet:accepted', (bet: ServerBet) => {
      // On acceptance rather than on click: the sound means the chip is really down.
      playSound('chip')
      dispatch({
        type: 'BET_ACCEPTED',
        bet: { type: bet.type, amount: bet.amount, value: bet.number },
        balance: bet.balance,
        roundId: bet.roundId,
      })
    })
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
