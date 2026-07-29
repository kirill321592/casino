import { useRoulette } from '@/entities/roulette/model/useRoulette'
import { calcTotalStake } from '@/entities/roulette/model/payouts'
import { BetChip } from '@/entities/roulette/ui/BetChip'
import { ChipSelector } from '@/features/place-bet/ui/ChipSelector'
import { ColorBetButtons } from '@/features/place-bet/ui/ColorBetButtons'
import { NumberGrid } from '@/features/place-bet/ui/NumberGrid'
import { ClearBetsButton } from '@/features/clear-bets/ui/ClearBetsButton'

export function BettingBoard() {
  const { state } = useRoulette()
  const totalStake = calcTotalStake(state.bets)

  return (
    <aside className="card flex flex-col gap-[1.125rem] p-4 sm:p-5">
      <ChipSelector />
      <ColorBetButtons />
      <NumberGrid />
      <div className="pt-1">
        <span className="panel-label">Active bets</span>
        {state.bets.length === 0 ? (
          <p className="m-0 text-faint">Place a bet to spin.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {state.bets.map((bet) => (
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
