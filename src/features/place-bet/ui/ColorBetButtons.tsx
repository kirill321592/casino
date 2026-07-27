import { cn } from '@/shared/lib/cn'
import { usePlaceBet } from '../model/usePlaceBet'

const outsideBase =
  'flex-[1_1_calc(50%-0.25rem)] rounded-control bg-slate-800 px-3.5 py-2.5 font-semibold text-slate-50 transition-[transform,opacity] duration-150 enabled:hover:-translate-y-px'

export function ColorBetButtons() {
  const { placeBet, canBet } = usePlaceBet()

  return (
    <div>
      <span className="panel-label">Outside bets</span>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={cn(outsideBase, 'bg-table-red')}
          disabled={!canBet}
          onClick={() => placeBet('red')}
        >
          Red
        </button>
        <button
          type="button"
          className={cn(outsideBase, 'border border-slate-700 bg-table-black')}
          disabled={!canBet}
          onClick={() => placeBet('black')}
        >
          Black
        </button>
        <button
          type="button"
          className={outsideBase}
          disabled={!canBet}
          onClick={() => placeBet('even')}
        >
          Even
        </button>
        <button
          type="button"
          className={outsideBase}
          disabled={!canBet}
          onClick={() => placeBet('odd')}
        >
          Odd
        </button>
      </div>
    </div>
  )
}
