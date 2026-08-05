import { memo } from 'react'
import { getPocketColor } from '@/entities/roulette/model/wheelLayout'
import { useRouletteStore } from '@/entities/roulette/model/rouletteStore'
import { cn } from '@/shared/lib/cn'
import { canPlaceBets, usePlaceBet } from '../model/usePlaceBet'

const numberBase =
  'rounded-control px-1.5 py-2 font-bold text-white transition-[transform,opacity] duration-150 enabled:hover:-translate-y-px'

const NUMBER_COLOR: Record<string, string> = {
  green: 'col-span-6 bg-table-green',
  red: 'bg-table-red',
  black: 'border border-slate-700 bg-table-black',
}

/* The pockets never change, so neither does a button's class — merge them once. */
const POCKETS = Array.from({ length: 37 }, (_, number) => ({
  number,
  className: cn(numberBase, NUMBER_COLOR[getPocketColor(number)]),
}))

/* memo covers the other way in: a parent re-render can't reach these 37 buttons
 * either, since they take no props. */
export const NumberGrid = memo(function NumberGrid() {
  const placeBet = usePlaceBet()
  const canBet = useRouletteStore(canPlaceBets)

  return (
    <div>
      <span className="panel-label">Straight up</span>
      <div className="grid auto-rows-[2.5rem] grid-cols-6 gap-1 sm:auto-rows-[2.75rem]">
        {POCKETS.map(({ number, className }) => (
          <button
            key={number}
            type="button"
            className={className}
            disabled={!canBet}
            onClick={() => placeBet('straight', number)}
          >
            {number}
          </button>
        ))}
      </div>
    </div>
  )
})
