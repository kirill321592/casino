import { getPocketColor } from '../model/wheelLayout'
import { cn } from '@/shared/lib/cn'
import type { Bet } from '../model/types'

const LABELS: Record<Bet['type'], string> = {
  straight: '',
  red: 'Red',
  black: 'Black',
  even: 'Even',
  odd: 'Odd',
}

const CHIP_COLOR: Record<string, string> = {
  neutral: 'bg-slate-700',
  red: 'bg-table-red',
  black: 'border border-slate-600 bg-table-black',
  green: 'bg-table-green',
}

interface BetChipProps {
  bet: Bet
}

export function BetChip({ bet }: BetChipProps) {
  const label = bet.type === 'straight' ? `#${bet.value}` : LABELS[bet.type]

  const colorKey =
    bet.type === 'red'
      ? 'red'
      : bet.type === 'black'
        ? 'black'
        : bet.type === 'straight' && bet.value !== undefined
          ? getPocketColor(bet.value)
          : 'neutral'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1.5 text-sm font-semibold',
        CHIP_COLOR[colorKey],
      )}
    >
      {label} · ${bet.amount}
    </span>
  )
}
