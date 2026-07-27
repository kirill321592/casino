import { formatMoney } from '@/shared/lib/formatMoney'
import type { SlotsSpinRecord } from '../model/slotsReducer'

interface SpinHistoryProps {
  history: SlotsSpinRecord[]
}

export function SpinHistory({ history }: SpinHistoryProps) {
  return (
    <div>
      <span className="panel-label">History</span>
      {history.length === 0 ? (
        <span className="text-faint">No spins yet</span>
      ) : (
        <div className="flex flex-col gap-1.5">
          {history.map((record, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg bg-ink/50 px-3 py-1.5 text-sm"
            >
              <span>{record.reels.join(' ')}</span>
              <span className={record.winnings > 0 ? 'text-gold' : 'text-faint'}>
                {record.winnings > 0 ? `+${formatMoney(record.winnings)}` : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
