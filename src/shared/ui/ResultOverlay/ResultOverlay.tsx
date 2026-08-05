import { useEffect, useRef, type ReactNode } from 'react'
import { formatMoney } from '@/shared/lib/formatMoney'

interface ResultOverlayProps {
  /* What the round produced — a pocket number, a row of reel symbols, … */
  headline: ReactNode
  winnings: number
  noWinMessage: string
  onDismiss: () => void
}

const VISIBLE_MS = 3000

export function ResultOverlay({ headline, winnings, noWinMessage, onDismiss }: ResultOverlayProps) {
  // Held in a ref so a parent re-render (a store tick, say) can't restart the
  // countdown and leave the popup on screen longer than its three seconds.
  const dismissRef = useRef(onDismiss)
  dismissRef.current = onDismiss

  useEffect(() => {
    const timer = setTimeout(() => dismissRef.current(), VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      role="status"
      aria-live="polite"
      /* Fixed to the viewport, and click-through: nothing here is interactive,
         so the board underneath stays usable while the result is showing. */
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="flex min-w-[16rem] max-w-[22rem] flex-col gap-1.5 rounded-2xl border border-slate-400/25 bg-surface/95 px-6 py-5 text-center shadow-[0_1.5rem_3rem_rgb(0_0_0/0.55)] motion-safe:animate-result-pop">
        <strong className="text-[2.5rem] leading-tight">{headline}</strong>
        <span>{winnings > 0 ? `You won ${formatMoney(winnings)}!` : noWinMessage}</span>
      </div>
    </div>
  )
}
