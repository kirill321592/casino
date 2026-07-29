import { useRoulette } from '@/entities/roulette/model/useRoulette'
import { GameHeader } from '@/widgets/game-header/ui/GameHeader'
import { BettingBoard } from '@/widgets/betting-board/ui/BettingBoard'
import { RouletteBoard } from '@/widgets/roulette-board/ui/RouletteBoard'
import { ResultHistory } from '@/widgets/result-history/ui/ResultHistory'

export function RoulettePage({ onExit }: { onExit?: () => void }) {
  const { state, error } = useRoulette()

  return (
    <div className="page-shell">
      <GameHeader
        title="European Roulette"
        subtitle="Place your bets and spin the wheel."
        balance={state.balance}
        onExit={onExit}
      />
      <ResultHistory />
      {error && (
        <p className="m-0 text-faint" role="alert">
          {error}
        </p>
      )}
      <div className="game-grid">
        <RouletteBoard />
        <BettingBoard />
      </div>
    </div>
  )
}
