import { useGame } from '@/app/providers/GameProvider'
import { formatMoney } from '@/shared/lib/formatMoney'
import { GameBoard } from '@/widgets/game-board/ui/GameBoard'
import { ResultHistory } from '@/widgets/result-history/ui/ResultHistory'

export function GamePage() {
  const { state, error } = useGame()

  return (
    <div className="game-page">
      <header className="game-header">
        <div>
          <h1>European Roulette</h1>
          <p className="game-subtitle">Place your bets and spin the wheel.</p>
        </div>
        <div className="balance-display">
          <span className="panel-label">Balance</span>
          <strong>{formatMoney(state.balance)}</strong>
        </div>
      </header>

      <ResultHistory />
      {error && <p className="empty-bets" role="alert">{error}</p>}
      <GameBoard />
    </div>
  )
}
