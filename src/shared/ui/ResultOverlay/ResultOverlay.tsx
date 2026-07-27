import type { ReactNode } from 'react'
import { formatMoney } from '@/shared/lib/formatMoney'

interface ResultOverlayProps {
  /* What the round produced — a pocket number, a row of reel symbols, … */
  headline: ReactNode
  winnings: number
  noWinMessage: string
  onDismiss: () => void
}

export function ResultOverlay({
  headline,
  winnings,
  noWinMessage,
  onDismiss,
}: ResultOverlayProps) {
  return (
    <div className="absolute inset-x-4 bottom-4 flex flex-col gap-1.5 rounded-[0.875rem] border border-slate-400/25 bg-surface/95 px-4 py-3.5 text-center">
      <strong className="text-[2rem]">{headline}</strong>
      <span>
        {winnings > 0 ? `You won ${formatMoney(winnings)}!` : noWinMessage}
      </span>
      <button
        type="button"
        className="mt-1 rounded-lg bg-slate-700 px-3 py-2 text-slate-50"
        onClick={onDismiss}
      >
        Continue
      </button>
    </div>
  )
}
