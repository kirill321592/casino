import { formatMoney } from '@/shared/lib/formatMoney'

interface GameHeaderProps {
  title: string
  subtitle: string
  balance: number
  onExit?: () => void
}

export function GameHeader({ title, subtitle, balance, onExit }: GameHeaderProps) {
  return (
    <header className="mb-5 flex items-start justify-between gap-4 max-[900px]:flex-col">
      <div>
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            className="mb-2 text-sm text-muted transition-colors hover:text-slate-50"
          >
            ← Back to lobby
          </button>
        )}
        <h1 className="m-0 text-2xl sm:text-[2rem]">{title}</h1>
        <p className="mt-1 text-muted">{subtitle}</p>
      </div>
      <div className="min-w-[8.75rem] rounded-xl border border-slate-400/25 bg-surface/90 px-4 py-3">
        <span className="panel-label">Balance</span>
        <strong className="block text-2xl text-gold">{formatMoney(balance)}</strong>
      </div>
    </header>
  )
}
