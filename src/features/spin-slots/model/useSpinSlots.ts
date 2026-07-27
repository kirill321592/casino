import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { gameServerUrl, type GameError } from '@/shared/api/gameServer'
import type { SlotsPaytable, SlotsSpinResult } from '@/shared/api/slots'
import {
  createInitialSlotsState,
  slotsReducer,
} from '@/entities/slots/model/slotsReducer'
import { FALLBACK_PAYTABLE } from '@/entities/slots/model/symbols'

export function useSpinSlots() {
  const [state, dispatch] = useReducer(slotsReducer, undefined, createInitialSlotsState)
  const socketRef = useRef<Socket | null>(null)
  const [paytable, setPaytable] = useState<SlotsPaytable>(FALLBACK_PAYTABLE)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const socket = io(`${gameServerUrl}/slots`, { withCredentials: true })
    socketRef.current = socket

    const fail = (message: string) => {
      setConnected(false)
      setError(message)
      // Refunds the stake if the spin was still in flight.
      dispatch({ type: 'SPIN_FAILED' })
    }

    socket.on('connect', () => { setConnected(true); setError(null) })
    socket.on('disconnect', () => fail('Connection to the slots server was lost.'))
    socket.on('connect_error', () => fail('Unable to connect to the slots server.'))
    socket.on('slots:paytable', (next: SlotsPaytable) => setPaytable(next))
    socket.on('slots:result', ({ reels, winnings }: SlotsSpinResult) =>
      dispatch({ type: 'SPIN_RESULT', reels, winnings }),
    )
    socket.on('game:error', ({ message }: GameError) => {
      setError(message)
      dispatch({ type: 'SPIN_FAILED' })
    })

    return () => { socket.disconnect(); socketRef.current = null }
  }, [])

  const spin = () => {
    const socket = socketRef.current
    if (!socket?.connected || state.phase === 'spinning' || state.balance < state.bet) return
    setError(null)
    dispatch({ type: 'SPIN_REQUEST' })
    socket.emit('slots:spin', { bet: state.bet })
  }

  const completeSpin = useCallback(() => dispatch({ type: 'SPIN_COMPLETE' }), [])
  const setBet = (bet: number) => dispatch({ type: 'SET_BET', bet })
  const dismissResult = () => dispatch({ type: 'DISMISS_RESULT' })

  return { state, paytable, connected, error, spin, completeSpin, setBet, dismissResult }
}
