import { useEffect, useRef, type ComponentRef } from 'react'
import { RouletteCanvas } from '@/entities/roulette/ui/RouletteCanvas'
import { SPIN_DURATION_MS } from '@/entities/roulette/lib/animateSpin'
import { useRouletteStore } from '@/entities/roulette/model/rouletteStore'
import { spinDuration } from '@/shared/lib/reducedMotion'
import { playSound } from '@/shared/lib/sound'
import { ResultOverlay } from '@/shared/ui/ResultOverlay'

export function RouletteBoard() {
  const wheelRef = useRef<ComponentRef<typeof RouletteCanvas>>(null)
  const phase = useRouletteStore((store) => store.phase)
  const pendingResult = useRouletteStore((store) => store.pendingResult)
  const lastResult = useRouletteStore((store) => store.lastResult)
  const lastWinnings = useRouletteStore((store) => store.lastWinnings)
  const dispatch = useRouletteStore((store) => store.dispatch)

  useEffect(() => {
    if (phase !== 'spinning' || pendingResult === null) return
    playSound('ball', { durationMs: spinDuration(SPIN_DURATION_MS) })
    void wheelRef.current?.spinToPocket(pendingResult).then(() => {
      dispatch({ type: 'SPIN_COMPLETE' })
    })
  }, [dispatch, pendingResult, phase])

  /* Wins only. Casinos stay quiet on a loss, and so does this. */
  useEffect(() => {
    if (phase === 'result' && lastWinnings > 0) playSound('win')
  }, [phase, lastWinnings])

  return (
    <section className="card relative flex items-center justify-center p-3 sm:p-5">
      <RouletteCanvas
        ref={wheelRef}
        className="[filter:drop-shadow(0_1rem_2rem_rgb(0_0_0/0.35))]"
      />

      {phase === 'result' && lastResult !== null && (
        <ResultOverlay
          headline={lastResult}
          winnings={lastWinnings}
          noWinMessage="No win this round."
          onDismiss={() => dispatch({ type: 'DISMISS_RESULT' })}
        />
      )}
    </section>
  )
}
