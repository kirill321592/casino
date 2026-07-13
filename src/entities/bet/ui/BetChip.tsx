import { getPocketColor } from '@/entities/wheel/model/wheelLayout'
import type { Bet } from '../model/types'

const LABELS: Record<Bet['type'], string> = {
  straight: '',
  red: 'Red',
  black: 'Black',
  even: 'Even',
  odd: 'Odd',
}

interface BetChipProps {
  bet: Bet
}

export function BetChip({ bet }: BetChipProps) {
  const label =
    bet.type === 'straight'
      ? `#${bet.value}`
      : LABELS[bet.type]

  const colorClass =
    bet.type === 'red'
      ? 'bet-chip-red'
      : bet.type === 'black'
        ? 'bet-chip-black'
        : bet.type === 'straight' && bet.value !== undefined
          ? `bet-chip-${getPocketColor(bet.value)}`
          : 'bet-chip-neutral'

  return (
    <span className={`bet-chip ${colorClass}`}>
      {label} · ${bet.amount}
    </span>
  )
}
