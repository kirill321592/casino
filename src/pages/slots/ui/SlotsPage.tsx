import { useSpinSlots } from '@/features/spin-slots/model/useSpinSlots'
import { GameHeader } from '@/widgets/game-header/ui/GameHeader'
import { SlotsBoard } from '@/widgets/slots-board/ui/SlotsBoard'
import { SlotsControls } from '@/widgets/slots-controls/ui/SlotsControls'

export function SlotsPage({ onExit }: { onExit?: () => void }) {
  const { state, paytable, error, spin, completeSpin, setBet, dismissResult } = useSpinSlots()

  return (
    <div className="page-shell">
      <GameHeader
        title="Lucky Slots"
        subtitle="Spin the reels and chase the jackpot."
        balance={state.balance}
        onExit={onExit}
      />
      {error && (
        <p className="m-0 text-faint" role="alert">
          {error}
        </p>
      )}
      <div className="game-grid">
        <SlotsBoard
          state={state}
          onSpin={spin}
          onSpinComplete={completeSpin}
          onDismissResult={dismissResult}
        />
        <SlotsControls
          bet={state.bet}
          disabled={state.phase === 'spinning'}
          paytable={paytable}
          history={state.history}
          onSelectBet={setBet}
        />
      </div>
    </div>
  )
}
