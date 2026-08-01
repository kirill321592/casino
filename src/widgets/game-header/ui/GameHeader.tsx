import { BalanceCard } from '@/entities/session/ui/BalanceCard'
import { SignOutButton } from '@/features/sign-out/ui/SignOutButton'

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
      <div className="flex items-center gap-4">
        <BalanceCard balance={balance} />
        <SignOutButton />
      </div>
    </header>
  )
}
