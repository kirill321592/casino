import { formatMoney } from '@/shared/lib/formatMoney'

/**
 * Takes the balance as a prop rather than reading the session: mid-spin a game
 * shows the figure the animation has reached, which trails the settled one.
 */
export function BalanceCard({ balance }: { balance: number }) {
  return (
    <div className="min-w-[8.75rem] rounded-xl border border-slate-400/25 bg-surface/90 px-4 py-3">
      <span className="panel-label">Balance</span>
      <strong className="block text-2xl text-gold">{formatMoney(balance)}</strong>
    </div>
  )
}
