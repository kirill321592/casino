import { useEffect, useRef, type ComponentRef } from 'react'
import { PixiRoulette } from '@/entities/wheel/ui/PixiRoulette'
import { useGame } from '@/app/providers/GameProvider'
import { getPocketColor } from '@/entities/wheel/model/wheelLayout'
import { BettingBoard } from '@/widgets/betting-board/ui/BettingBoard'

export function GameBoard() {
  const wheelRef = useRef<ComponentRef<typeof PixiRoulette>>(null)
  const { state, dispatch } = useGame()

  const resultColor =
    state.lastResult !== null ? getPocketColor(state.lastResult) : null

  useEffect(() => {
    if (state.phase !== 'spinning' || state.pendingResult === null) return
    void wheelRef.current?.spinToPocket(state.pendingResult).then(() => {
      dispatch({ type: 'SPIN_COMPLETE' })
    })
  }, [dispatch, state.pendingResult, state.phase])

  return (
    <div className="game-board">
      <section className="wheel-section">
        <PixiRoulette ref={wheelRef} className="wheel-canvas" />

        {state.phase === 'result' && state.lastResult !== null && (
          <div className={`result-banner result-${resultColor}`}>
            <strong>{state.lastResult}</strong>
            <span>
              {state.lastWinnings > 0
                ? `You won $${state.lastWinnings}!`
                : 'No win this round.'}
            </span>
            <button
              type="button"
              className="result-dismiss"
              onClick={() => dispatch({ type: 'DISMISS_RESULT' })}
            >
              Continue
            </button>
          </div>
        )}
      </section>

      <BettingBoard />
    </div>
  )
}
