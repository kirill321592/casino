import { useEffect, useRef, type ComponentRef } from 'react'
import { PixiSlots } from '@/entities/slots/ui/PixiSlots'
import type { SlotsState } from '@/entities/slots/model/slotsReducer'
import { SpinSlotsButton } from '@/features/spin-slots/ui/SpinSlotsButton'
import { ResultOverlay } from '@/shared/ui/ResultOverlay'

interface SlotsBoardProps {
  state: SlotsState
  onSpin: () => void
  onSpinComplete: () => void
  onDismissResult: () => void
}

export function SlotsBoard({
  state,
  onSpin,
  onSpinComplete,
  onDismissResult,
}: SlotsBoardProps) {
  const reelsRef = useRef<ComponentRef<typeof PixiSlots>>(null)

  useEffect(() => {
    if (state.phase !== 'spinning' || state.pendingReels === null) return
    void reelsRef.current?.spinToReels(state.pendingReels).then(onSpinComplete)
  }, [onSpinComplete, state.pendingReels, state.phase])

  return (
    <section className="card relative flex flex-col items-center justify-center gap-5 p-6 sm:p-8">
      <PixiSlots ref={reelsRef} initialReels={state.reels} />
      <SpinSlotsButton
        bet={state.bet}
        spinning={state.phase === 'spinning'}
        canAfford={state.balance >= state.bet}
        onSpin={onSpin}
      />

      {state.phase === 'result' && (
        <ResultOverlay
          headline={state.reels.join(' ')}
          winnings={state.lastWinnings}
          noWinMessage="No win this spin."
          onDismiss={onDismissResult}
        />
      )}
    </section>
  )
}
