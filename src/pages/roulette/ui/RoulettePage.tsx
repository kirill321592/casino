import { useRouletteStore } from '@/entities/roulette/model/rouletteStore'
import { useRouletteTable } from '@/entities/roulette/model/useRouletteTable'
import { GameHeader } from '@/widgets/game-header/ui/GameHeader'
import { BettingBoard } from '@/widgets/betting-board/ui/BettingBoard'
import { RouletteBoard } from '@/widgets/roulette-board/ui/RouletteBoard'
import { ResultHistory } from '@/widgets/result-history/ui/ResultHistory'
import { RoundStatus } from '@/widgets/round-status/ui/RoundStatus'

/* Lazy-loaded by the lobby, so the socket client and the 3D wheel ship here. */
export function RoulettePage({ onExit }: { onExit?: () => void }) {
  useRouletteTable()
  const balance = useRouletteStore((store) => store.balance)
  const error = useRouletteStore((store) => store.error)

  return (
    <div className="page-shell">
      <GameHeader title="European Roulette" subtitle="" balance={balance} onExit={onExit} />
      {error && (
        <p className="m-0 text-faint" role="alert">
          {error}
        </p>
      )}
      <RoundStatus />
      <div className="game-grid">
        <RouletteBoard />
        <BettingBoard />
      </div>
      <ResultHistory />
    </div>
  )
}
