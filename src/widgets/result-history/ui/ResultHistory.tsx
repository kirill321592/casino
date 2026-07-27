import { useRoulette } from '@/entities/roulette/model/RouletteProvider'
import { getPocketColor } from '@/entities/roulette/model/wheelLayout'
import { cn } from '@/shared/lib/cn'

const PILL_COLOR: Record<string, string> = {
  green: 'bg-table-green',
  red: 'bg-table-red',
  black: 'bg-slate-800 border border-slate-700',
}

export function ResultHistory() {
  const { state } = useRoulette()

  return (
    <div className="mb-5 rounded-2xl border border-slate-400/20 bg-surface/75 p-4">
      <span className="panel-label">History</span>
      <div className="flex flex-wrap gap-2">
        {state.history.length === 0 ? (
          <span className="text-faint">No spins yet</span>
        ) : (
          state.history.map((number, index) => (
            <span
              key={`${number}-${index}`}
              className={cn(
                'min-w-[2.25rem] rounded-full px-2.5 py-1.5 text-center text-sm font-bold',
                PILL_COLOR[getPocketColor(number)],
              )}
            >
              {number}
            </span>
          ))
        )}
      </div>
    </div>
  )
}
