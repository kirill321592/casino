import { useCallback, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { io, type Socket } from 'socket.io-client'
import { gameServerUrl, type GameError } from '@/shared/api/gameServer'
import { type RoundResult, type RoundState, type ServerBet } from '@/shared/api/roulette'
import { createInitialRouletteState, rouletteReducer } from './rouletteReducer'
import { RouletteContext } from './rouletteContext'
import type { BetType } from './types'

export function RouletteProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(rouletteReducer, undefined, createInitialRouletteState)
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useReducer(() => true, false)
  const [error, setError] = useReducer((_: string | null, value: string | null) => value, null)

  useEffect(() => {
    const socket = io(`${gameServerUrl}/roulette`, { withCredentials: true })
    socketRef.current = socket
    socket.on('connect', () => {
      setConnected()
      setError(null)
    })
    socket.on('disconnect', () => setError('Connection to the roulette server was lost.'))
    socket.on('connect_error', () => setError('Unable to connect to the roulette server.'))
    socket.on('round:state', (round: RoundState) => dispatch({ type: 'ROUND_STATE', round }))
    socket.on('bet:accepted', (bet: ServerBet) =>
      dispatch({
        type: 'BET_ACCEPTED',
        bet: { type: bet.type, amount: bet.amount, value: bet.number },
      }),
    )
    socket.on('bet:rejected', ({ message }: GameError) => setError(message))
    socket.on('game:error', ({ message }: GameError) => setError(message))
    socket.on('round:result', (result: RoundResult) => {
      const payout = socket.id ? (result.payouts[socket.id] ?? 0) : 0
      dispatch({ type: 'ROUND_RESULT', winningNumber: result.number, payout })
    })
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  const placeBet = useCallback(
    (type: BetType, value?: number) => {
      if (
        !socketRef.current?.connected ||
        !state.round ||
        state.round.status !== 'betting' ||
        state.phase !== 'idle'
      )
        return
      socketRef.current.emit('bet:place', {
        roundId: state.round.id,
        type,
        amount: state.selectedChip,
        ...(type === 'straight' ? { number: value } : {}),
      })
    },
    [state.round, state.phase, state.selectedChip],
  )

  const value = useMemo(
    () => ({ state, dispatch, placeBet, connected, error }),
    [state, placeBet, connected, error],
  )

  return <RouletteContext.Provider value={value}>{children}</RouletteContext.Provider>
}
