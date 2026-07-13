import { useGame } from '@/app/providers/GameProvider'
import { calcTotalStake } from '@/entities/bet/model/payouts'
import { BetChip } from '@/entities/bet/ui/BetChip'
import { ChipSelector } from '@/features/place-bet/ui/ChipSelector'
import { ColorBetButtons } from '@/features/place-bet/ui/ColorBetButtons'
import { NumberGrid } from '@/features/place-bet/ui/NumberGrid'
import { ClearBetsButton } from '@/features/clear-bets/ui/ClearBetsButton'

export function BettingBoard() {
  const { state } = useGame()
  const totalStake = calcTotalStake(state.bets)

  return (
    <aside className="betting-board">
      <ChipSelector />
      <ColorBetButtons />
      <NumberGrid />

      <div className="active-bets">
        <span className="panel-label">Active bets</span>
        {state.bets.length === 0 ? (
          <p className="empty-bets">Place a bet to spin.</p>
        ) : (
          <div className="bet-list">
            {state.bets.map((bet) => (
              <BetChip key={bet.id} bet={bet} />
            ))}
          </div>
        )}
        <p className="stake-total">Total stake: ${totalStake}</p>
      </div>
      <div className="board-actions">
        <ClearBetsButton />
      </div>
    </aside>
  )
}
