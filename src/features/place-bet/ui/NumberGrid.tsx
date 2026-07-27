import { getPocketColor } from '@/entities/roulette/model/wheelLayout'
import { cn } from '@/shared/lib/cn'
import { usePlaceBet } from '../model/usePlaceBet'

const NUMBERS = Array.from({ length: 37 }, (_, i) => i)

const numberBase =
  'rounded-control px-3.5 py-2.5 font-bold text-white transition-[transform,opacity] duration-150 enabled:hover:-translate-y-px'

const NUMBER_COLOR: Record<string, string> = {
  green: 'col-span-6 bg-table-green',
  red: 'bg-table-red',
  black: 'border border-slate-700 bg-table-black',
}

export function NumberGrid() {
  const { placeBet, canBet } = usePlaceBet()

  return (
    <div>
      <span className="panel-label">Straight up</span>
      <div className="grid auto-rows-[3rem] grid-cols-6 gap-1.5 sm:auto-rows-[4rem]">
        {NUMBERS.map((number) => (
          <button
            key={number}
            type="button"
            className={cn(numberBase, NUMBER_COLOR[getPocketColor(number)])}
            disabled={!canBet}
            onClick={() => placeBet('straight', number)}
          >
            {number}
          </button>
        ))}
      </div>
    </div>
  )
}
