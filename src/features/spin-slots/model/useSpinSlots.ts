import { useCallback, useEffect, useReducer, useState } from 'react'
import { fetchPaytable, requestSpin, type SlotsPaytable } from '@/shared/api/slots'
import { createInitialSlotsState, slotsReducer } from '@/entities/slots/model/slotsReducer'
import { FALLBACK_PAYTABLE } from '@/entities/slots/model/symbols'

export function useSpinSlots() {
  const [state, dispatch] = useReducer(slotsReducer, undefined, createInitialSlotsState)
  const [paytable, setPaytable] = useState<SlotsPaytable>(FALLBACK_PAYTABLE)
  const [error, setError] = useState<string | null>(null)

  // Display only, so a failed load falls back to the seeded table and still plays.
  useEffect(() => {
    const controller = new AbortController()

    fetchPaytable(controller.signal)
      .then(setPaytable)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) setError(describe(cause))
      })

    return () => controller.abort()
  }, [])

  const spin = () => {
    if (state.phase === 'spinning' || state.balance < state.bet) return
    setError(null)
    dispatch({ type: 'SPIN_REQUEST' })

    void requestSpin(state.bet)
      .then(({ reels, winnings }) => dispatch({ type: 'SPIN_RESULT', reels, winnings }))
      .catch((cause: unknown) => {
        setError(describe(cause))
        // The spin never produced a result, so give the stake back.
        dispatch({ type: 'SPIN_FAILED' })
      })
  }

  const completeSpin = useCallback(() => dispatch({ type: 'SPIN_COMPLETE' }), [])
  const setBet = (bet: number) => dispatch({ type: 'SET_BET', bet })
  const dismissResult = () => dispatch({ type: 'DISMISS_RESULT' })

  return { state, paytable, error, spin, completeSpin, setBet, dismissResult }
}

function describe(cause: unknown): string {
  return cause instanceof Error ? cause.message : 'The slots server returned an unexpected error.'
}
