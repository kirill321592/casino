import { useCallback, useReducer } from 'react'
import {
  createInitialSlotsState,
  slotsReducer,
} from '@/entities/slots/model/slotsReducer'
import { spinReels } from '@/entities/slots/model/spin'

export function useSpinSlots() {
  const [state, dispatch] = useReducer(slotsReducer, undefined, createInitialSlotsState)

  const spin = () => {
    if (state.phase === 'spinning' || state.balance < state.bet) return
    dispatch({ type: 'SPIN_START', reels: spinReels() })
  }

  const completeSpin = useCallback(() => dispatch({ type: 'SPIN_COMPLETE' }), [])
  const setBet = (bet: number) => dispatch({ type: 'SET_BET', bet })
  const dismissResult = () => dispatch({ type: 'DISMISS_RESULT' })

  return { state, spin, completeSpin, setBet, dismissResult }
}
