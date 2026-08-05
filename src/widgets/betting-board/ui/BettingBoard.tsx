import { useRouletteStore } from '@/entities/roulette/model/rouletteStore'
import { calcTotalStake } from '@/entities/roulette/model/payouts'
import { BetChip } from '@/entities/roulette/ui/BetChip'
import { ChipSelector } from '@/features/place-bet/ui/ChipSelector'
import { ColorBetButtons } from '@/features/place-bet/ui/ColorBetButtons'
import { NumberGrid } from '@/features/place-bet/ui/NumberGrid'
import { ClearBetsButton } from '@/features/clear-bets/ui/ClearBetsButton'

export function BettingBoard() {
  const bets = useRouletteStore((store) => store.bets)
  const totalStake = calcTotalStake(bets)

  return (
    <aside className="card flex flex-col gap-3.5 p-3 sm:p-4">
      <ChipSelector />
      <ColorBetButtons />
      <NumberGrid />
      <div className="pt-1">
        <span className="panel-label">Active bets</span>
        {bets.length === 0 ? (
          <p className="m-0 text-faint">Place a bet to spin.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {bets.map((bet) => (
              <BetChip key={bet.id} bet={bet} />
            ))}
          </div>
        )}
        <p className="mt-3 mb-0 font-semibold text-slate-300">Total stake: ${totalStake}</p>
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        <ClearBetsButton />
      </div>
    </aside>
  )
}
