import { Link } from 'react-router'
import { BalanceCard } from '@/entities/session/ui/BalanceCard'
import { SignOutButton } from '@/features/sign-out/ui/SignOutButton'
import { SoundControl } from '@/features/sound-settings/ui/SoundControl'
import { routes } from '@/shared/config/routes'

interface GameHeaderProps {
  title: string
  subtitle: string
  balance: number
}

export function GameHeader({ title, subtitle, balance }: GameHeaderProps) {
  return (
    <header className="mb-5 flex items-start justify-between gap-4 max-[900px]:flex-col">
      <div>
        <Link
          to={routes.lobby}
          className="mb-2 inline-block text-sm text-muted no-underline transition-colors hover:text-slate-50"
        >
          ← Back to lobby
        </Link>
        <h1 className="m-0 text-2xl sm:text-[2rem]">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <SoundControl />
        <BalanceCard balance={balance} />
        <SignOutButton />
      </div>
    </header>
  )
}
