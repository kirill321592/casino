import { useEffect, useRef, type ComponentRef } from 'react'
import { PixiRoulette } from '@/entities/roulette/ui/PixiRoulette'
import { useRoulette } from '@/entities/roulette/model/useRoulette'
import { ResultOverlay } from '@/shared/ui/ResultOverlay'

export function RouletteBoard() {
  const wheelRef = useRef<ComponentRef<typeof PixiRoulette>>(null)
  const { state, dispatch } = useRoulette()

  useEffect(() => {
    if (state.phase !== 'spinning' || state.pendingResult === null) return
    void wheelRef.current?.spinToPocket(state.pendingResult).then(() => {
      dispatch({ type: 'SPIN_COMPLETE' })
    })
  }, [dispatch, state.pendingResult, state.phase])

  return (
    <section className="card relative flex items-center justify-center p-3 sm:p-5">
      <PixiRoulette ref={wheelRef} className="[filter:drop-shadow(0_1rem_2rem_rgb(0_0_0/0.35))]" />

      {state.phase === 'result' && state.lastResult !== null && (
        <ResultOverlay
          headline={state.lastResult}
          winnings={state.lastWinnings}
          noWinMessage="No win this round."
          onDismiss={() => dispatch({ type: 'DISMISS_RESULT' })}
        />
      )}
    </section>
  )
}
